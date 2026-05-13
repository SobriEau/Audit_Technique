import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { RichEditorComponent } from '../shared/components/rich-editor/rich-editor.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, RichEditorComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  adresse = '';
  info = '';
  date = '';
  auditeur = '';

  constructor(private dataService: DataService, private router: Router) {}

  ngOnInit(): void {
    const d = this.dataService.data;
    this.adresse = d.Adresse ?? '';
    this.info = d.Info ?? '';
    this.date = d.Date ?? '';
    this.auditeur = d.Auditeur ?? '';
  }

  autoSave(): void {
    const d = this.dataService.data;
    d.Adresse = this.adresse || null;
    d.Info = this.info || null;
    d.Date = this.date || null;
    d.Auditeur = this.auditeur || null;
    this.dataService.save();
  }

  nav(path: string): void {
    this.router.navigate([path]);
  }
}
