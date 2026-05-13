import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { Robinet } from '../../models/data.models';

@Component({
  selector: 'app-robinet',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './robinet.component.html',
  styleUrl: './robinet.component.scss',
})
export class RobinetComponent implements OnInit {
  idx = 0;
  robinet: Robinet | null = null;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.idx = parseInt(this.route.snapshot.params['idx'], 10);
    const robinets = this.dataService.getRobinets();

    if (!Number.isInteger(this.idx) || this.idx < 0 || this.idx >= robinets.length) {
      alert('Index de robinet invalide.');
      this.router.navigate(['/qte/robinets']);
      return;
    }

    // Copie locale pour édition non-destructive avant sauvegarde
    this.robinet = { ...robinets[this.idx] };
  }

  save(): void {
    if (!this.robinet) return;
    const robinets = [...this.dataService.getRobinets()];
    robinets[this.idx] = { ...this.robinet };
    this.dataService.setRobinets(robinets);
    this.router.navigate(['/qte/robinets']);
  }

  deleteRobinet(): void {
    if (confirm('Supprimer ce robinet ?')) {
      const robinets = [...this.dataService.getRobinets()];
      robinets.splice(this.idx, 1);
      this.dataService.setRobinets(robinets);
      this.router.navigate(['/qte/robinets']);
    }
  }

  back(): void {
    this.router.navigate(['/qte/robinets']);
  }
}
