import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  private apiUrl = 'http://localhost:8080/api/v1/documents/search';

  constructor(private http: HttpClient) {}

  search(file: File, word: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('word', word);

    return this.http.post<any>(this.apiUrl, formData);
  }
}