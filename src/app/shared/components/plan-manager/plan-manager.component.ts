import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssetStoreService } from '../../../core/services/asset-store.service';
import { DataService } from '../../../core/services/data.service';
import {
  PdfRasterService,
  PDF_PAGE_CONFIRM_THRESHOLD,
} from '../../../core/services/pdf-raster.service';
import { AssetRef } from '../../../models/data.models';
import { DictationFieldComponent } from '../dictation-field/dictation-field.component';

/**
 * Gestion des plans du bâtiment, depuis l'accueil.
 *
 * Les plans sont communs à tout l'audit : chaque élément technique peut
 * ensuite s'y localiser via <app-plan-locator>.
 */
@Component({
  selector: 'app-plan-manager',
  standalone: true,
  imports: [FormsModule, DictationFieldComponent],
  templateUrl: './plan-manager.component.html',
  styleUrl: './plan-manager.component.scss',
})
export class PlanManagerComponent implements OnInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  plans: AssetRef[] = [];
  urls: Record<string, string> = {};
  busy = false;

  /** Message affiché pendant la conversion d'un PDF, qui peut être longue. */
  progress = '';

  constructor(
    private data: DataService,
    private assets: AssetStoreService,
    private pdf: PdfRasterService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.plans = [...this.data.getPlans()];
    void this.resolveAll();
  }

  triggerPicker(): void {
    this.fileInputRef.nativeElement.click();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) return;

    this.busy = true;
    try {
      for (const file of files) {
        if (this.pdf.isPdf(file)) {
          await this.addPdf(file);
        } else {
          const ref = await this.assets.addFile(file);
          // Nom par défaut : le nom du fichier sans son extension, éditable ensuite.
          ref.name = this.baseName(file.name);
          this.plans = [...this.plans, ref];
          await this.resolveUrl(ref.id);
        }
      }
      this.persist();
    } catch (err: unknown) {
      alert(
        'Impossible de charger ce plan : ' +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      this.busy = false;
      this.progress = '';
      this.cdr.markForCheck();
    }
  }

  /**
   * Un PDF donne un plan par page : dans un dossier de bâtiment, chaque page
   * correspond en général à un niveau.
   */
  private async addPdf(file: File): Promise<void> {
    this.progress = 'Lecture du PDF…';
    this.cdr.markForCheck();

    const total = await this.pdf.countPages(file);
    if (
      total > PDF_PAGE_CONFIRM_THRESHOLD &&
      !confirm(
        `Ce PDF contient ${total} pages.\n` +
          `Chaque page deviendra un plan distinct.\nContinuer ?`
      )
    ) {
      return;
    }

    const base = this.baseName(file.name);
    const pages = await this.pdf.rasterize(file, (done) => {
      this.progress = `Conversion du PDF — page ${done} / ${total}`;
      this.cdr.markForCheck();
    });

    for (const p of pages) {
      const name = pages.length > 1 ? `${base} — page ${p.page}` : base;
      const ref = await this.assets.addBlob(p.blob, name);
      this.plans = [...this.plans, ref];
      await this.resolveUrl(ref.id);
    }
  }

  private baseName(fileName: string): string {
    return fileName.replace(/\.[^.]+$/, '');
  }

  rename(): void {
    this.persist();
  }

  async remove(index: number): Promise<void> {
    const plan = this.plans[index];
    if (!plan) return;
    if (
      !confirm(
        `Supprimer le plan « ${plan.name} » ?\n` +
          'Les éléments localisés sur ce plan perdront leur localisation.'
      )
    ) {
      return;
    }

    this.plans = this.plans.filter((_, i) => i !== index);
    delete this.urls[plan.id];
    this.persist();
    this.data.purgePlanReferences(plan.id);
    await this.assets.remove(plan.id);
    this.cdr.markForCheck();
  }

  private persist(): void {
    this.data.setPlans(this.plans);
  }

  private async resolveUrl(id: string): Promise<void> {
    const url = await this.assets.objectUrl(id);
    if (url) this.urls[id] = url;
  }

  private async resolveAll(): Promise<void> {
    for (const p of this.plans) await this.resolveUrl(p.id);
    this.cdr.markForCheck();
  }
}
