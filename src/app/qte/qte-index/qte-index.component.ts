import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RichEditorComponent } from '../../shared/components/rich-editor/rich-editor.component';
import { AUDIT_SCHEMA } from '../../models/audit-schema';
import { EntityDef } from '../../models/field.models';

@Component({
  selector: 'app-qte-index',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, RichEditorComponent],
  templateUrl: './qte-index.component.html',
  styleUrl: './qte-index.component.scss',
})
export class QteIndexComponent implements OnInit {
  info = '';
  sections = AUDIT_SCHEMA;

  constructor(private router: Router, private dataService: DataService) {}

  ngOnInit(): void {
    this.info = this.dataService.data.Qte?.Info ?? '';
  }

  saveInfo(): void {
    if (!this.dataService.data.Qte) this.dataService.data.Qte = {};
    this.dataService.data.Qte.Info = this.info || null;
    this.dataService.save();
  }

  /** Nombre d'éléments saisis, affiché en regard de chaque section. */
  count(section: EntityDef): number | null {
    if (section.single) return null;
    return this.dataService.getEntities(section.key).length;
  }

  navigate(section: EntityDef): void {
    this.router.navigate(['/qte', section.route]);
  }
}
