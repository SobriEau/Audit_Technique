import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';
import { DictationFieldComponent } from '../shared/components/dictation-field/dictation-field.component';

@Component({
  selector: 'app-qge',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DictationFieldComponent],
  templateUrl: './qge.component.html',
})
export class QgeComponent implements OnInit {
  jsonText = '';

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.jsonText = JSON.stringify(this.dataService.data.Qge ?? {}, null, 2);
  }

  save(): void {
    try {
      this.dataService.data.Qge = JSON.parse(this.jsonText || '{}') as Record<string, unknown>;
      this.dataService.save();
      alert('Qge sauvegardé.');
    } catch (e) {
      alert('JSON invalide : ' + (e instanceof Error ? e.message : String(e)));
    }
  }
}
