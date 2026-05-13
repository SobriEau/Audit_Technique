import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RichEditorComponent } from '../../shared/components/rich-editor/rich-editor.component';
import { QTE_SECTIONS } from '../../models/data.models';

@Component({
  selector: 'app-qte-index',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, RichEditorComponent],
  templateUrl: './qte-index.component.html',
  styleUrl: './qte-index.component.scss',
})
export class QteIndexComponent implements OnInit {
  info = '';
  sections = QTE_SECTIONS;

  constructor(public router: Router, private dataService: DataService) {}

  ngOnInit(): void {
    this.info = this.dataService.data.Qte?.Info ?? '';
  }

  saveInfo(): void {
    if (!this.dataService.data.Qte) this.dataService.data.Qte = {};
    this.dataService.data.Qte.Info = this.info || null;
    this.dataService.save();
  }

  navigate(section: { key: string; isCrud?: boolean }): void {
    if (section.isCrud) {
      // Robinets → composant CRUD dédié
      this.router.navigate(['/qte/robinets']);
    } else {
      // Autres sections → éditeur JSON générique
      this.router.navigate(['/qte', section.key]);
    }
  }
}
