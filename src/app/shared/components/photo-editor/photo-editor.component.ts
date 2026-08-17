import { Component, forwardRef, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AssetStoreService } from '../../../core/services/asset-store.service';
import { AssetRef } from '../../../models/data.models';

/**
 * Composant partagé : galerie de photos.
 * Usage : <app-photo-editor [(ngModel)]="photos" />
 *
 * La valeur liée est un tableau de références légères (id + nom) ; les images
 * elles-mêmes sont dans IndexedDB via AssetStoreService. C'est ce qui permet
 * d'ajouter des photos de plusieurs mégaoctets sans saturer localStorage.
 */
@Component({
  selector: 'app-photo-editor',
  standalone: true,
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

  photos: AssetRef[] = [];

  /** URL d'affichage par identifiant, résolue depuis IndexedDB. */
  urls: Record<string, string> = {};

  busy = false;

  onChangeFn: (v: AssetRef[]) => void = () => {};
  onTouchedFn: () => void = () => {};

  constructor(
    private assets: AssetStoreService,
    private cdr: ChangeDetectorRef
  ) {}

  triggerPicker(): void {
    this.fileInputRef.nativeElement.click();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = ''; // permet de re-choisir le même fichier
    if (files.length === 0) return;

    this.busy = true;
    try {
      for (const file of files) {
        const ref = await this.assets.addFile(file);
        this.photos = [...this.photos, ref];
        await this.resolveUrl(ref.id);
      }
      this.emit();
    } finally {
      this.busy = false;
      this.cdr.markForCheck();
    }
  }

  async removePhoto(index: number): Promise<void> {
    const ref = this.photos[index];
    if (!ref) return;
    if (!confirm(`Supprimer la photo « ${ref.name} » ?`)) return;

    this.photos = this.photos.filter((_, i) => i !== index);
    delete this.urls[ref.id];
    await this.assets.remove(ref.id);
    this.emit();
    this.cdr.markForCheck();
  }

  /** Ouvre la photo en grand dans un nouvel onglet. */
  openPhoto(ref: AssetRef): void {
    const url = this.urls[ref.id];
    if (url) window.open(url, '_blank');
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
    for (const p of this.photos) await this.resolveUrl(p.id);
    this.cdr.markForCheck();
  }

  // ─── ControlValueAccessor ─────────────────────────────────────────────────

  writeValue(val: AssetRef[] | null): void {
    this.photos = Array.isArray(val) ? val : [];
    this.urls = {};
    void this.resolveAll();
  }

  registerOnChange(fn: (v: AssetRef[]) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
}
