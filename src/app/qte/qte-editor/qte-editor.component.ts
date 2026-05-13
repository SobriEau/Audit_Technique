import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { QTE_SECTIONS, QteData } from '../../models/data.models';

/**
 * Éditeur JSON générique pour toutes les sections QTE simples
 * (WC, Douches, Espace vert, etc.).
 *
 * La section est déterminée par le paramètre de route :section.
 * Route : /qte/:section  (ex. /qte/wc, /qte/douches_baignoires)
 */
@Component({
  selector: 'app-qte-editor',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './qte-editor.component.html',
  styleUrl: './qte-editor.component.scss',
})
export class QteEditorComponent implements OnInit {
  sectionKey = '';
  sectionLabel = '';
  jsonText = '';

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.sectionKey = this.route.snapshot.params['section'] as string;
    const found = QTE_SECTIONS.find((s) => s.key === this.sectionKey);
    this.sectionLabel = found?.label ?? this.sectionKey;
    const data = this.dataService.getQte(this.sectionKey as keyof QteData);
    this.jsonText = JSON.stringify(data ?? {}, null, 2);
  }

  save(): void {
    try {
      const parsed = JSON.parse(this.jsonText || '{}') as Record<string, unknown>;
      this.dataService.setQte(this.sectionKey as keyof QteData, parsed);
      alert('Sauvegardé.');
    } catch (e) {
      alert('JSON invalide : ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  back(): void {
    this.router.navigate(['/qte']);
  }
}
