import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';

/** Côté le plus long d'une photo prise dans l'application. */
const COTE_MAX = 1600;

/** Compromis taille / lisibilité pour une photo d'équipement. */
const QUALITE = 0.85;

/**
 * Prise de vue depuis la caméra de l'appareil.
 *
 * `capture="environment"` sur un `<input type="file">` n'ouvre l'appareil photo
 * **que sur mobile** ; sur ordinateur l'attribut est ignoré et le sélecteur de
 * fichiers s'affiche — d'où un bouton « Prendre une photo » qui n'en prenait
 * pas. La webcam passe obligatoirement par `getUserMedia`.
 *
 * Mesuré depuis le fichier autonome ouvert en `file://` : Chrome considère
 * `file` comme un contexte sûr (`isSecureContext === true`), l'invite
 * d'autorisation s'affiche et le flux arrive. La chaîne flux → canvas → JPEG a
 * été vérifiée à cette origine.
 *
 * Réserve à connaître : l'origine d'un `file://` étant opaque, le navigateur ne
 * peut pas mémoriser l'autorisation d'un lancement à l'autre. L'auditeur devra
 * l'accorder à chaque ouverture du fichier — c'est écrit à l'écran plutôt que
 * laissé deviner.
 */
@Component({
  selector: 'app-camera-capture',
  standalone: true,
  templateUrl: './camera-capture.component.html',
  styleUrl: './camera-capture.component.scss',
})
export class CameraCaptureComponent implements AfterViewInit, OnDestroy {
  /** Photo retenue par l'auditeur. */
  @Output() captured = new EventEmitter<File>();

  /** Fermeture sans prise de vue. */
  @Output() closed = new EventEmitter<void>();

  /** L'auditeur préfère finalement choisir un fichier existant. */
  @Output() replier = new EventEmitter<void>();

  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  /** Caméras disponibles, connues seulement une fois l'autorisation donnée. */
  cameras: MediaDeviceInfo[] = [];
  choisie = '';

  erreur: string | null = null;
  demarrage = true;

  /** Photo figée, en attente de validation. */
  apercu: string | null = null;
  private cliche: Blob | null = null;

  private flux: MediaStream | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    void this.demarrer();
  }

  ngOnDestroy(): void {
    this.arreter();
    if (this.apercu) URL.revokeObjectURL(this.apercu);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.fermer();
  }

  // ── Flux ──────────────────────────────────────────────────────────────────

  private async demarrer(deviceId?: string): Promise<void> {
    this.arreter();
    this.erreur = null;
    this.demarrage = true;
    this.cdr.markForCheck();

    // `environment` vise la caméra arrière du téléphone, la seule utile pour
    // photographier un équipement. Sur ordinateur la contrainte est ignorée.
    const video: MediaTrackConstraints = deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: { ideal: 'environment' } };
    video.width = { ideal: 1920 };
    video.height = { ideal: 1080 };

    try {
      if (typeof navigator.mediaDevices?.getUserMedia !== 'function') {
        throw new DOMException('Ce navigateur ne donne pas accès à la caméra.', 'NotSupportedError');
      }
      this.flux = await navigator.mediaDevices.getUserMedia({ video, audio: false });

      const v = this.videoRef?.nativeElement;
      if (v) {
        v.srcObject = this.flux;
        await v.play().catch(() => undefined);
      }

      // Les libellés ne sont renseignés qu'une fois l'autorisation accordée :
      // on n'énumère donc qu'après avoir obtenu le flux.
      const tous = await navigator.mediaDevices.enumerateDevices();
      this.cameras = tous.filter((d) => d.kind === 'videoinput');
      this.choisie = this.flux.getVideoTracks()[0]?.getSettings().deviceId ?? '';
    } catch (e) {
      this.erreur = this.expliquer(e);
    } finally {
      this.demarrage = false;
      this.cdr.markForCheck();
    }
  }

  private arreter(): void {
    this.flux?.getTracks().forEach((t) => t.stop());
    this.flux = null;
  }

  /** Un message qui dit quoi faire, plutôt qu'un nom d'erreur brut. */
  private expliquer(e: unknown): string {
    const nom = e instanceof DOMException ? e.name : '';
    switch (nom) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return (
          "L'accès à la caméra a été refusé. Autorisez-le depuis l'icône de la " +
          "barre d'adresse, puis réessayez."
        );
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'Aucune caméra détectée sur cet appareil.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'La caméra est déjà utilisée par une autre application.';
      case 'SecurityError':
        return 'Le navigateur refuse la caméra dans ce contexte.';
      case 'OverconstrainedError':
        return 'Aucune caméra ne correspond à la demande.';
      default:
        return e instanceof Error ? e.message : 'La caméra est indisponible.';
    }
  }

  changerCamera(id: string): void {
    void this.demarrer(id);
  }

  reessayer(): void {
    void this.demarrer(this.choisie || undefined);
  }

  // ── Prise de vue ──────────────────────────────────────────────────────────

  /**
   * Fige l'image courante. Elle est réduite à `COTE_MAX` : une photo de capteur
   * pèse plusieurs mégaoctets, alors qu'un robinet reste parfaitement lisible à
   * cette taille — et un audit peut compter plus de cent photos.
   */
  async declencher(): Promise<void> {
    const v = this.videoRef?.nativeElement;
    if (!v || !v.videoWidth) return;

    const echelle = Math.min(1, COTE_MAX / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(v.videoWidth * echelle);
    canvas.height = Math.round(v.videoHeight * echelle);
    canvas.getContext('2d')?.drawImage(v, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', QUALITE));
    if (!blob) {
      this.erreur = "L'image n'a pas pu être enregistrée.";
      this.cdr.markForCheck();
      return;
    }

    this.cliche = blob;
    if (this.apercu) URL.revokeObjectURL(this.apercu);
    this.apercu = URL.createObjectURL(blob);
    this.arreter(); // le témoin de la caméra doit s'éteindre pendant la relecture
    this.cdr.markForCheck();
  }

  /** Reprendre : la première photo est floue une fois sur deux, sous un évier. */
  reprendre(): void {
    if (this.apercu) URL.revokeObjectURL(this.apercu);
    this.apercu = null;
    this.cliche = null;
    void this.demarrer(this.choisie || undefined);
  }

  valider(): void {
    if (!this.cliche) return;
    const horodatage = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
    const fichier = new File([this.cliche], `photo-${horodatage}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
    this.captured.emit(fichier);
  }

  fermer(): void {
    this.closed.emit();
  }

  choisirFichier(): void {
    this.replier.emit();
  }

  /** Les noms de périphériques sont parfois vides : on numérote alors. */
  nomCamera(d: MediaDeviceInfo, i: number): string {
    return d.label || `Caméra ${i + 1}`;
  }
}
