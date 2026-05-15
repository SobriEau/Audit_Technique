import {
  Component,
  forwardRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface PhotoEntry {
  /** Original filename. */
  name: string;
  /** Base64 data URL (e.g. "data:image/jpeg;base64,…"). */
  data: string;
}

/**
 * Composant partagé : sélection et gestion de photos.
 * Implémente ControlValueAccessor — usage : <app-photo-editor [(ngModel)]="photos" />
 *
 * La valeur émise est un tableau de PhotoEntry (nom + base64).
 * Cliquer sur un nom ou la miniature ouvre la photo en plein écran dans un nouvel onglet.
 */
@Component({
  selector: 'app-photo-editor',
  standalone: true,
  imports: [],
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

  photos: PhotoEntry[] = [];

  onChangeFn: (v: PhotoEntry[]) => void = () => {};
  onTouchedFn: () => void = () => {};

  triggerPicker(): void {
    this.fileInputRef.nativeElement.click();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;

    const newPhotos = await Promise.all(files.map((f) => this.readAsDataUrl(f)));
    this.photos = [...this.photos, ...newPhotos];
    this.onChangeFn(this.photos);
    this.onTouchedFn();
    // Reset so the same file can be added again if needed
    input.value = '';
  }

  private readAsDataUrl(file: File): Promise<PhotoEntry> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({ name: file.name, data: reader.result as string });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  openPhoto(photo: PhotoEntry): void {
    // Convert the stored data URL back to a Blob URL to avoid browser
    // restrictions on opening data: URLs directly in new tabs.
    const [header, b64] = photo.data.split(',');
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      arr[i] = bytes.charCodeAt(i);
    }
    const blob = new Blob([arr], { type: mime });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // Pop-up blocked — revoke immediately
      URL.revokeObjectURL(url);
    }
    // The Blob URL will remain valid while the tab is open.
    // It will be garbage-collected when the main page is refreshed.
  }

  removePhoto(index: number): void {
    this.photos = this.photos.filter((_, i) => i !== index);
    this.onChangeFn(this.photos);
  }

  // ─── ControlValueAccessor ────────────────────────────────────────────────

  writeValue(val: PhotoEntry[] | null): void {
    this.photos = Array.isArray(val) ? val : [];
  }

  registerOnChange(fn: (v: PhotoEntry[]) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
}
