import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DocumentUploadResponse {
  documentId: number;
  fileName: string;
  sha256: string;
  cached: boolean;
  text: string;
}

export interface DocumentListResponse {
  id: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  // Base API URL from environment
  private baseUrl = `${environment.apiBaseUrl}/documents`;

  constructor(private http: HttpClient) {}

  // ============================================
  // Upload Document
  // ============================================

  upload(file: File): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<DocumentUploadResponse>(
      `${this.baseUrl}/upload`,
      formData
    );
  }

  // ============================================
  // Get All Documents
  // ============================================

  getAll(): Observable<DocumentListResponse[]> {
    return this.http.get<DocumentListResponse[]>(this.baseUrl);
  }

  // ============================================
  // Get Document By ID
  // ============================================

  getById(id: number): Observable<DocumentUploadResponse> {
    return this.http.get<DocumentUploadResponse>(
      `${this.baseUrl}/${id}`
    );
  }

  // ============================================
  // Letter-Based Word Search
  // ============================================

  searchWordsByLetters(
    documentId: number,
    letters: string
  ): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.baseUrl}/${documentId}/letter-search`,
      {
        params: { letters }
      }
    );
  }

  // ============================================
  // Download Letter Search Result (TXT / PDF)
  // ============================================

  downloadLetterSearch(
    documentId: number,
    letters: string,
    type: string
  ): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/${documentId}/letter-search/download`,
      {
        params: { letters, type },
        responseType: 'blob'
      }
    );
  }
}