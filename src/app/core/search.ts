import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SearchResponse {
  text: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  private apiUrl = `${environment.apiBaseUrl}/api/v1/documents/search`;

  constructor(private http: HttpClient) {}

  search(file: File, word: string): Observable<SearchResponse> {

    const formData = new FormData();
    formData.append('file', file);
    formData.append('word', word);

    return this.http.post<SearchResponse>(this.apiUrl, formData);
  }
}