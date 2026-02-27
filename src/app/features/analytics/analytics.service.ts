import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SearchTrendResponse {
  date: string;
  count: number;
}

export interface TopQueryResponse {
  queryText: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  // ✅ Use environment-based API base
  private readonly baseUrl = `${environment.apiBaseUrl}/analytics`;

  constructor(private http: HttpClient) {}

  getTrends(from?: string, to?: string): Observable<SearchTrendResponse[]> {

    let params = new HttpParams();

    if (from) {
      params = params.set('from', from);
    }

    if (to) {
      params = params.set('to', to);
    }

    return this.http.get<SearchTrendResponse[]>(
      `${this.baseUrl}/trends`,
      { params }
    );
  }

  getTopQueries(limit: number): Observable<TopQueryResponse[]> {
    return this.http.get<TopQueryResponse[]>(
      `${this.baseUrl}/top-queries`,
      {
        params: new HttpParams().set('limit', limit)
      }
    );
  }
}