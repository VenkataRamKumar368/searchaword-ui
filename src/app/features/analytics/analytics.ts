import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Chart, registerables } from 'chart.js';

import {
  AnalyticsService,
  SearchTrendResponse,
  TopQueryResponse
} from './analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.css']
})
export class AnalyticsComponent implements OnInit {

  from: string = '';
  to: string = '';
  topLimit: number = 10;

  trends: SearchTrendResponse[] = [];
  topQueries: TopQueryResponse[] = [];

  totalInRange: number = 0;

  loading: boolean = false;
  error: string = '';

  private chart: Chart | undefined;

  constructor(private analyticsService: AnalyticsService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.error = '';

    this.analyticsService.getTrends(
      this.from || undefined,
      this.to || undefined
    ).subscribe({
      next: (data: SearchTrendResponse[]) => {
        this.trends = data ?? [];

        this.totalInRange = this.trends.reduce(
          (sum: number, t: SearchTrendResponse) => sum + t.count,
          0
        );

        this.loading = false;

        // 🔥 Render chart after data loads
        setTimeout(() => {
          this.renderChart();
        });
      },
      error: () => {
        this.error = 'Failed to load trend data';
        this.loading = false;
      }
    });

    this.analyticsService.getTopQueries(this.topLimit)
      .subscribe({
        next: (data: TopQueryResponse[]) => {
          this.topQueries = data ?? [];
        }
      });
  }

  private renderChart(): void {

    if (!this.trends.length) return;

    // Destroy previous chart if exists
    if (this.chart) {
      this.chart.destroy();
    }

    const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.trends.map(t => t.date),
        datasets: [
          {
            label: 'Search Count',
            data: this.trends.map(t => t.count),
            borderColor: '#000',
            backgroundColor: 'rgba(0,0,0,0.05)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}