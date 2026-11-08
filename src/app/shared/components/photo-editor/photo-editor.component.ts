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
import {
  photoMode,
  nomDeFichier,
  cheminPhoto,
  sourcePhoto,
  SourcePhoto,
  SourcesPhoto,
} from '../../../core/utils/photo-mode';
import { uid } from '../../../core/utils/uid';
import { PhotoSyncService } from '../../../core/services/photo-sync.service';
import { DataService } from '../../../core/services/data.service';
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
 * - **Fichiers voisins** : l'image est en plus téléchargée à côté de la page,
 *   et l'audit garde son chemin relatif — de quoi retrouver les photos dans
 *   l'explorateur de fichiers, et les récupérer si la base du navigateur est
 *   vidée. Le binaire reste en base dans les deux modes.
 *
 * **L'affichage se fait toujours depuis la base, jamais depuis le fichier
 * voisin.** Le chemin relatif était la source préférée ; or le téléchargement
 * n'est ni instantané ni notifiable, et sur mobile il n'aboutit pas toujours
 * dans le dossier de la page. La vignette tombait donc sur un fichier
 * inexistant, le navigateur retenait l'échec, et il fallait recharger la page
 * pour voir la photo (retour de la première visite terrain, 2026-10). Le
 * binaire local, lui, est écrit avant même que la vignette soit rendue : il
 * s'affiche du premier coup et hors connexion. Le fichier voisin et le Drive
 * restent en secours, dans cet ordre, pour le jour où la base est vidée.
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

  /**
   * Consultation seule : masque l'ajout et la suppression. Sert à l'accueil du
   * projet, dont la galerie ne fait que rassembler les photos déjà prises dans
   * les fiches techniques (KAPT, 260818).
   */
  @Input() readonly = false;

  photos: AssetRef[] = [];

  /** URL d'affichage par identifiant, résolue depuis IndexedDB. */
  urls: Record<string, string> = {};

  /** Vignettes dont toutes les sources ont échoué. */
  echecs: Record<string, boolean> = {};

  /** URL de secours obtenue depuis le Drive, par identifiant. */
  secours: Record<string, string> = {};

  /**
   * Sources déjà mises en échec, par identifiant de photo. Écarte une piste
   * morte au lieu de la réessayer indéfiniment — voir `sourcePhoto`.
   */
  private echoues: Record<string, Partial<Record<SourcePhoto, boolean>>> = {};

  busy = false;

  /** Dialogue de prise de vue affiché. */
  cameraOuverte = false;

  onChangeFn: (v: AssetRef[]) => void = () => {};
  onTouchedFn: () => void = () => {};

  constructor(
    private assets: AssetStoreService,
    private sync: PhotoSyncService,
    private data: DataService,
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
    const dossier = this.data.dossierAuditCourant();

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

    // L'attente ne sert plus l'affichage — celui-ci vient de la base — mais
    // le téléchargement lui-même : révoquer l'URL trop tôt l'interrompt.
    await new Promise((r) => setTimeout(r, 1200));
    URL.revokeObjectURL(url);

    await this.resolveUrl(id);
    // Le chemin décrit l'arborescence de l'archive — un dossier par audit — et
    // non l'endroit où le navigateur vient d'écrire : il aplatit les
    // séparateurs, et ne sait pas créer de sous-dossier (voir `cheminPhoto`).
    return { id, name: file.name, path: cheminPhoto(dossier, nom) };
  }

  /** Les sources disponibles pour cette photo, dans l'état où elles sont. */
  private etatDe(photo: AssetRef): SourcesPhoto {
    return {
      base: this.urls[photo.id],
      chemin: photo.path,
      drive: this.secours[photo.id],
      echoues: this.echoues[photo.id],
    };
  }

  /**
   * Où afficher cette photo. L'ordre et ses raisons sont dans `sourcePhoto`
   * (`photo-mode.ts`), fonction pure éprouvée par `tools/check-photos.js` :
   * l'ordre est une règle, et il a déjà été corrigé une fois.
   */
  source(photo: AssetRef): string | null {
    return sourcePhoto(this.etatDe(photo))?.url ?? null;
  }

  /**
   * Cette photo n'existe plus que sous la forme d'un chemin : son binaire a
   * disparu de la base.
   *
   * À dire, parce que l'export JSON embarque les images **depuis la base** :
   * une photo sans binaire ne partira pas avec l'audit, et le fichier reçu
   * par un collègue aura une vignette vide. Un chemin relatif ne vaut que sur
   * le poste où le fichier se trouve.
   */
  sansBinaire(photo: AssetRef): boolean {
    return !this.urls[photo.id] && !this.resolutionEnCours;
  }

  /** Vrai le temps que `resolveAll` ait interrogé la base, pour ne rien alléguer trop tôt. */
  resolutionEnCours = true;

  get nbSansBinaire(): number {
    return this.resolutionEnCours ? 0 : this.photos.filter((p) => !this.urls[p.id]).length;
  }

  /**
   * Une source qui échoue fait passer à la suivante. L'échec n'est signalé à
   * l'auditeur qu'une fois toutes les pistes épuisées — y compris le Drive,
   * qu'on ne va chercher qu'à ce moment-là, puisqu'il suppose le réseau.
   */
  async onImageError(photo: AssetRef): Promise<void> {
    const ko = (this.echoues[photo.id] ??= {});

    // C'est la source que `sourcePhoto` venait de désigner qui a échoué : on la
    // marque, et la suivante prend sa place. Désigner et écarter par la même
    // fonction interdit aux deux de diverger.
    const essayee = sourcePhoto(this.etatDe(photo));
    if (essayee) ko[essayee.source] = true;

    // Une autre source reste à essayer : le rendu s'en chargera.
    if (this.source(photo)) {
      this.cdr.markForCheck();
      return;
    }

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

  /**
   * Nouvelle tentative : le téléchargement s'est peut-être terminé depuis.
   * Toutes les sources redeviennent candidates, binaire local compris.
   */
  async reessayer(photo: AssetRef): Promise<void> {
    delete this.echecs[photo.id];
    delete this.echoues[photo.id];
    delete this.secours[photo.id];
    if (photo.path) {
      // Le paramètre force le navigateur à retenter au lieu de servir son
      // cache, qui a retenu l'échec du premier essai.
      photo.path = photo.path.split('?')[0] + '?r=' + Date.now();
    }
    await this.resolveUrl(photo.id);
    this.cdr.markForCheck();
  }

  async removePhoto(index: number): Promise<void> {
    const ref = this.photos[index];
    if (!ref) return;
    if (!confirm(`Retirer la photo « ${ref.name} » de l'audit ?`)) return;

    this.photos = this.photos.filter((_, i) => i !== index);
    delete this.urls[ref.id];
    delete this.echecs[ref.id];
    delete this.echoues[ref.id];
    delete this.secours[ref.id];

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

  /**
   * Résout l'URL d'affichage de **toutes** les photos, celles qui portent un
   * chemin relatif comprises : c'est désormais le binaire local qui s'affiche,
   * et les sauter laissait précisément les vignettes du mode « fichiers
   * voisins » sans source.
   */
  private async resolveAll(): Promise<void> {
    this.resolutionEnCours = true;
    try {
      for (const p of this.photos) await this.resolveUrl(p.id);
    } finally {
      this.resolutionEnCours = false;
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
    this.echoues = {};
    void this.resolveAll();
  }

  registerOnChange(fn: (v: AssetRef[]) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
}
