import {
  Component,
  forwardRef,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  Input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AssetStoreService } from '../../../core/services/asset-store.service';
import { AssetRef } from '../../../models/data.models';
import { photoMode, nomDeFichier } from '../../../core/utils/photo-mode';
import { uid } from '../../../core/utils/uid';
import { PhotoSyncService } from '../../../core/services/photo-sync.service';
import { CameraCaptureComponent } from '../camera-capture/camera-capture.component';

/**
 * Composant partagé : galerie de photos.
 * Usage : <app-photo-editor [(ngModel)]="photos" contexte="Robinet 3" />
 *
 * Deux modes de rangement, choisis sur l'accueil :
 *
 * - **IndexedDB** (par défaut) : l'image est écrite dans la base du navigateur
 *   et affichée par une URL d'objet. Fonctionne partout, hors connexion
 *   comprise, mais l'export la recopie en base64.
 * - **Fichiers voisins** : l'image est téléchargée à côté de la page, et
 *   l'audit ne garde qu'un chemin relatif. L'export reste léger quel que soit
 *   le nombre de photos, mais tout dépend du navigateur : s'il refuse
 *   d'écrire, ou renomme le fichier, l'image ne se rechargera pas. C'est
 *   pourquoi chaque vignette signale explicitement si elle a pu être relue.
 */
@Component({
  selector: 'app-photo-editor',
  standalone: true,
  imports: [CameraCaptureComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhotoEditorComponent),
      multi: true,
    },
  ],
  templateUrl: './photo-editor.component.html',
  styleUrl: './photo-editor.component.scss',
})
export class PhotoEditorComponent implements ControlValueAccessor {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('cameraInput') cameraRef!: ElementRef<HTMLInputElement>;

  /** Sert à composer un nom de fichier lisible en mode « fichiers voisins ». */
  @Input() contexte = 'audit';

  photos: AssetRef[] = [];

  /** URL d'affichage par identifiant, résolue depuis IndexedDB. */
  urls: Record<string, string> = {};

  /** Vignettes dont toutes les sources ont échoué. */
  echecs: Record<string, boolean> = {};

  /** URL de secours obtenue depuis le Drive, par identifiant. */
  secours: Record<string, string> = {};

  busy = false;

  /** Dialogue de prise de vue affiché. */
  cameraOuverte = false;

  onChangeFn: (v: AssetRef[]) => void = () => {};
  onTouchedFn: () => void = () => {};

  constructor(
    private assets: AssetStoreService,
    private sync: PhotoSyncService,
    private cdr: ChangeDetectorRef
  ) {}

  /** Combien de ces photos sont aussi sur le Drive. */
  get nbSurDrive(): number {
    return this.photos.filter((p) => !!p.driveId).length;
  }

  get connecte(): boolean {
    return this.sync.connecte;
  }

  get modeFichiers(): boolean {
    return photoMode() === 'fichiers';
  }

  triggerPicker(): void {
    this.fileInputRef.nativeElement.click();
  }

  /**
   * Prise de vue.
   *
   * `capture="environment"` n'ouvre l'appareil photo que sur mobile : sur
   * ordinateur l'attribut est ignoré et le sélecteur de fichiers s'affiche, ce
   * qui donnait un bouton trompeur. On passe donc par `getUserMedia` — vérifié
   * utilisable depuis le fichier autonome — et l'on ne retombe sur le champ
   * natif que si l'API manque.
   */
  triggerCamera(): void {
    // Le test porte sur le type : les définitions DOM déclarent `mediaDevices`
    // comme toujours présent, alors qu'il manque hors contexte sûr.
    if (typeof navigator.mediaDevices?.getUserMedia === 'function') {
      this.cameraOuverte = true;
      this.cdr.markForCheck();
      return;
    }
    this.cameraRef.nativeElement.click();
  }

  /** Photo validée dans le dialogue : elle suit le chemin d'un fichier choisi. */
  async onCaptured(file: File): Promise<void> {
    this.cameraOuverte = false;
    await this.ajouterFichiers([file]);
  }

  /** Le dialogue renvoie vers le sélecteur : caméra refusée, ou absente. */
  onCameraRepli(): void {
    this.cameraOuverte = false;
    this.cdr.markForCheck();
    this.fileInputRef.nativeElement.click();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = ''; // permet de re-choisir le même fichier
    await this.ajouterFichiers(files);
  }

  private async ajouterFichiers(files: File[]): Promise<void> {
    if (files.length === 0) return;

    this.busy = true;
    try {
      for (const file of files) {
        const ref = this.modeFichiers
          ? await this.ajouterCommeFichier(file)
          : await this.ajouterEnBase(file);

        // Dépôt immédiat si l'auditeur est connecté ; sinon la photo reste en
        // attente et sera reprise à la prochaine connexion.
        try {
          const distant = await this.sync.deposer(ref, file);
          if (distant) ref.driveId = distant;
        } catch {
          /* réseau capricieux : ce n'est pas une raison de perdre la photo */
        }

        this.photos = [...this.photos, ref];
      }
      this.emit();
      this.sync.rafraichir();
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }

  /** Rangement classique : le binaire va en IndexedDB. */
  private async ajouterEnBase(file: File): Promise<AssetRef> {
    const ref = await this.assets.addFile(file);
    await this.resolveUrl(ref.id);
    return ref;
  }

  /**
   * Rangement en fichier voisin : on déclenche un téléchargement et on ne
   * conserve que le chemin relatif. Le nom compose horodatage, contexte et
   * identifiant, pour qu'aucune collision n'amène le navigateur à renommer.
   */
  private async ajouterCommeFichier(file: File): Promise<AssetRef> {
    const nom0 = nomDeFichier(this.contexte, file.name, uid());

    // Le binaire est conservé en base malgré le fichier voisin : c'est la seule
    // source disponible pour un envoi différé vers le Drive, et un secours si
    // le dossier de téléchargement est nettoyé.
    const ref = await this.assets.addFile(file);
    const id = ref.id;
    const nom = nom0;

    const url = URL.createObjectURL(file);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nom;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();

    // L'écriture n'est pas instantanée, et rien ne permet d'en être notifié :
    // on laisse au navigateur le temps d'écrire avant de tenter l'affichage.
    await new Promise((r) => setTimeout(r, 1200));
    URL.revokeObjectURL(url);

    await this.resolveUrl(id);
    return { id, name: file.name, path: './' + nom };
  }

  /**
   * Source d'affichage, par ordre de préférence : le fichier voisin, puis le
   * binaire local, puis le Drive. Les deux premiers sont immédiats et
   * fonctionnent hors connexion ; le troisième est le filet.
   */
  source(photo: AssetRef): string | null {
    return photo.path ?? this.urls[photo.id] ?? this.secours[photo.id] ?? null;
  }

  /**
   * Une source qui échoue fait passer à la suivante. L'échec n'est signalé à
   * l'auditeur qu'une fois toutes les pistes épuisées.
   */
  async onImageError(photo: AssetRef): Promise<void> {
    // Le fichier voisin a échoué : on tente le binaire local.
    if (photo.path && !this.urls[photo.id]) {
      await this.resolveUrl(photo.id);
      if (this.urls[photo.id]) {
        photo.path = undefined;
        this.cdr.markForCheck();
        return;
      }
    }

    // Reste le Drive.
    if (photo.driveId && !this.secours[photo.id]) {
      const url = await this.sync.depuisDrive(photo);
      if (url) {
        this.secours[photo.id] = url;
        this.cdr.markForCheck();
        return;
      }
    }

    this.echecs[photo.id] = true;
    this.cdr.markForCheck();
  }

  onImageLoad(photo: AssetRef): void {
    if (this.echecs[photo.id]) {
      delete this.echecs[photo.id];
      this.cdr.markForCheck();
    }
  }

  /** Nouvelle tentative : le téléchargement s'est peut-être terminé depuis. */
  reessayer(photo: AssetRef): void {
    delete this.echecs[photo.id];
    if (photo.path) {
      // Le paramètre force le navigateur à retenter au lieu de servir son cache.
      photo.path = photo.path.split('?')[0] + '?r=' + Date.now();
    }
    this.cdr.markForCheck();
  }

  async removePhoto(index: number): Promise<void> {
    const ref = this.photos[index];
    if (!ref) return;
    if (!confirm(`Retirer la photo « ${ref.name} » de l'audit ?`)) return;

    this.photos = this.photos.filter((_, i) => i !== index);
    delete this.urls[ref.id];
    delete this.echecs[ref.id];

    // Un fichier voisin n'est pas effaçable depuis une page : on le laisse en
    // place et on le dit, plutôt que de faire croire à une suppression.
    await this.assets.remove(ref.id);

    this.emit();
    this.sync.rafraichir();
    this.cdr.markForCheck();
  }

  /** Ouvre la photo en grand dans un nouvel onglet. */
  openPhoto(ref: AssetRef): void {
    const src = this.source(ref);
    if (src) window.open(src, '_blank');
  }

  private emit(): void {
    this.onChangeFn(this.photos);
    this.onTouchedFn();
  }

  private async resolveUrl(id: string): Promise<void> {
    const url = await this.assets.objectUrl(id);
    if (url) this.urls[id] = url;
  }

  private async resolveAll(): Promise<void> {
    for (const p of this.photos) {
      if (!p.path) await this.resolveUrl(p.id);
    }
    this.sync.rafraichir();
    this.cdr.markForCheck();
  }

  // ─── ControlValueAccessor ─────────────────────────────────────────────────

  writeValue(val: AssetRef[] | null): void {
    this.photos = Array.isArray(val) ? val : [];
    this.urls = {};
    this.echecs = {};
    this.secours = {};
    void this.resolveAll();
  }

  registerOnChange(fn: (v: AssetRef[]) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
}
