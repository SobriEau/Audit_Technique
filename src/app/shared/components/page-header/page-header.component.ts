import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { DataService } from '../../../core/services/data.service';

/**
 * Composant partagé : en-tête SobriEau avec boutons import/export JSON.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  @Input() showImport = false;
  @Input() showExport = true;

  constructor(private dataService: DataService) {}

  onExport(): void {
    const stamp = new Date().toISOString().slice(0, 10);
    this.dataService.exportJson(`sobrieau-${stamp}`);
  }

  handleFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.dataService
      .importJson(file)
      .then(() => alert('Données importées avec succès.'))
      .catch((err: unknown) =>
        alert('Erreur lors de l\'import : ' + (err instanceof Error ? err.message : String(err)))
      );
  }
}
