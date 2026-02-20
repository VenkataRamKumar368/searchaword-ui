import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  DocumentService,
  DocumentListResponse,
  DocumentUploadResponse
} from '../../core/services/document';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class SearchComponent implements OnInit {

  selectedFile!: File;
  word: string = '';

  originalContent: string = '';
  highlightedHtml: string = '';
  count: number = 0;

  currentMatchIndex: number = 0;

  loading: boolean = false;
  documentLoaded: boolean = false;

  documents: DocumentListResponse[] = [];
  selectedDocumentId?: number;

  letterInput: string = '';
  letterResults: string[] = [];
  letterError: string = '';

  constructor(private documentService: DocumentService) {}

  // ============================================
  // INIT
  // ============================================

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments() {
    this.documentService.getAll().subscribe({
      next: (data) => {
        this.documents = data;
      },
      error: (err) => {
        console.error('Failed to load documents', err);
      }
    });
  }

  // ============================================
  // FILE SELECT
  // ============================================

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.resetState();
  }

  resetState() {
    this.documentLoaded = false;
    this.highlightedHtml = '';
    this.originalContent = '';
    this.count = 0;
    this.word = '';
    this.currentMatchIndex = 0;

    this.letterInput = '';
    this.letterResults = [];
    this.letterError = '';
  }

  // ============================================
  // UPLOAD
  // ============================================

  onUpload() {

    if (!this.selectedFile) {
      alert('Please select a file');
      return;
    }

    this.loading = true;

    this.documentService.upload(this.selectedFile)
      .subscribe({
        next: (response: DocumentUploadResponse) => {

          this.originalContent = response.text;
          this.highlightedHtml = this.originalContent;

          this.documentLoaded = true;
          this.selectedDocumentId = response.documentId;

          this.count = 0;
          this.currentMatchIndex = 0;
          this.loading = false;

          this.loadDocuments();
        },
        error: (err) => {
          console.error(err);
          alert('Upload failed');
          this.loading = false;
        }
      });
  }

  // ============================================
  // OPEN EXISTING DOCUMENT
  // ============================================

  openDocument(id: number) {

    this.loading = true;

    this.documentService.getById(id)
      .subscribe({
        next: (doc: DocumentUploadResponse) => {

          this.originalContent = doc.text;
          this.highlightedHtml = this.originalContent;

          this.selectedDocumentId = doc.documentId;
          this.documentLoaded = true;

          this.word = '';
          this.count = 0;
          this.currentMatchIndex = 0;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          alert('Failed to open document');
          this.loading = false;
        }
      });
  }

  // ============================================
  // LETTER SEARCH WITH HIGHLIGHT
  // ============================================

  searchByLetters() {

    if (!this.selectedDocumentId) return;

    this.word = ''; // Prevent conflict with word search
    this.letterError = '';
    this.letterResults = [];

    this.documentService
      .searchWordsByLetters(this.selectedDocumentId, this.letterInput)
      .subscribe({
        next: (results) => {

          this.letterResults = results;

          if (results.length === 0) {
            this.highlightedHtml = this.originalContent;
            this.count = 0;
            this.currentMatchIndex = 0;
            return;
          }

          const escapedWords = results.map(w => this.escapeRegex(w));
          const pattern = `\\b(${escapedWords.join('|')})\\b`;
          const regex = new RegExp(pattern, 'gi');

          const matches = this.originalContent.match(regex);
          this.count = matches ? matches.length : 0;
          this.currentMatchIndex = 0;

          this.highlightedHtml = this.originalContent.replace(
            regex,
            '<mark class="match">$&</mark>'
          );

          setTimeout(() => {
            this.highlightCurrentMatch();
          }, 0);
        },
        error: (err) => {

          if (err.status === 400) {
            this.letterError = 'Please enter valid letters.';
          } else if (err.status === 404) {
            this.letterError = 'Document not found.';
          } else {
            this.letterError = 'Something went wrong.';
          }
        }
      });
  }

  // ============================================
  // DOWNLOAD LETTER SEARCH RESULT
  // ============================================

  downloadLetterSearch(type: string) {

    if (!this.selectedDocumentId || !this.letterInput) {
      alert('Please perform a letter search first.');
      return;
    }

    this.documentService
      .downloadLetterSearch(
        this.selectedDocumentId,
        this.letterInput,
        type
      )
      .subscribe({
        next: (blob: Blob) => {

          const url = window.URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = `letter-search-result.${type}`;

          document.body.appendChild(a);
          a.click();

          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error(err);
          alert('Download failed');
        }
      });
  }

  // ============================================
  // LOCAL WORD SEARCH
  // ============================================

  onSearch() {

    this.letterResults = []; // prevent mixing
    this.letterInput = '';

    if (!this.word) {
      this.highlightedHtml = this.originalContent;
      this.count = 0;
      this.currentMatchIndex = 0;
      return;
    }

    const escapedWord = this.escapeRegex(this.word);
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');

    const matches = this.originalContent.match(regex);
    this.count = matches ? matches.length : 0;
    this.currentMatchIndex = 0;

    this.highlightedHtml = this.originalContent.replace(
      regex,
      '<mark class="match">$&</mark>'
    );

    setTimeout(() => {
      this.highlightCurrentMatch();
    }, 0);
  }

  nextMatch() {
    if (this.count === 0) return;

    this.currentMatchIndex =
      (this.currentMatchIndex + 1) % this.count;

    this.highlightCurrentMatch();
  }

  previousMatch() {
    if (this.count === 0) return;

    this.currentMatchIndex =
      (this.currentMatchIndex - 1 + this.count) % this.count;

    this.highlightCurrentMatch();
  }

  highlightCurrentMatch() {

    const matches = document.querySelectorAll('.match');

    matches.forEach(el => el.classList.remove('active'));

    if (matches[this.currentMatchIndex]) {

      matches[this.currentMatchIndex].classList.add('active');

      matches[this.currentMatchIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}