import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { PageHeaderComponent } from '../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-qge',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './qge.component.html',
  styleUrl: './qge.component.scss',
})
export class QgeComponent implements OnInit {
  jsonText = '';

  constructor(private dataService: DataService, private router: Router) {}

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

  back(): void {
    this.router.navigate(['/home']);
  }
}
