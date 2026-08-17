import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-qus',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './qus.component.html',
})
export class QusComponent implements OnInit {
  jsonText = '';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.jsonText = JSON.stringify(this.dataService.data.Qus ?? {}, null, 2);
  }

  save(): void {
    try {
      this.dataService.data.Qus = JSON.parse(this.jsonText || '{}') as Record<string, unknown>;
      this.dataService.save();
      alert('Qus sauvegardé.');
    } catch (e) {
      alert('JSON invalide : ' + (e instanceof Error ? e.message : String(e)));
    }
  }
}
