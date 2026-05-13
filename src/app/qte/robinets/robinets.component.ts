import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { Robinet } from '../../models/data.models';

@Component({
  selector: 'app-robinets',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './robinets.component.html',
  styleUrl: './robinets.component.scss',
})
export class RobinetsComponent implements OnInit {
  robinets: Robinet[] = [];

  constructor(public router: Router, private dataService: DataService) {}

  ngOnInit(): void {
    this.robinets = [...this.dataService.getRobinets()];
  }

  addRobinet(): void {
    const newRobinet: Robinet = {
      Numero: null,
      Emplacement: null,
      Type: null,
      Debit: null,
      Remarques: null,
    };
    this.robinets.push(newRobinet);
    this.dataService.setRobinets([...this.robinets]);
    this.router.navigate(['/qte/robinet', this.robinets.length - 1]);
  }

  edit(idx: number): void {
    this.router.navigate(['/qte/robinet', idx]);
  }

  deleteRobinet(idx: number): void {
    if (confirm('Supprimer ce robinet ?')) {
      this.robinets.splice(idx, 1);
      this.dataService.setRobinets([...this.robinets]);
    }
  }
}
