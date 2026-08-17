import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { RichEditorComponent } from '../shared/components/rich-editor/rich-editor.component';
import { PlanManagerComponent } from '../shared/components/plan-manager/plan-manager.component';
import { PhotoEditorComponent } from '../shared/components/photo-editor/photo-editor.component';
import { AssetRef } from '../models/data.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    RichEditorComponent,
    PlanManagerComponent,
    PhotoEditorComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  adresse = '';
  info = '';
  date = '';
  auditeur = '';
  photos: AssetRef[] = [];

  constructor(private dataService: DataService, private router: Router) {}

  ngOnInit(): void {
    const d = this.dataService.data;
    this.adresse = d.Adresse ?? '';
    this.info = d.Info ?? '';
    this.date = d.Date ?? '';
    this.auditeur = d.Auditeur ?? '';
    this.photos = d.Photos ?? [];
  }

  autoSave(): void {
    const d = this.dataService.data;
    d.Adresse = this.adresse || null;
    d.Info = this.info || null;
    d.Date = this.date || null;
    d.Auditeur = this.auditeur || null;
    this.dataService.save();
  }

  /** La galerie générale est enregistrée dès qu'une photo est ajoutée ou retirée. */
  onPhotosChange(): void {
    this.dataService.setPhotos(this.photos);
  }

  nav(path: string): void {
    this.router.navigate([path]);
  }
}
