import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  DocumentService,
  DocumentListResponse,
  DocumentUploadResponse
} from '../../core/services/document';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class SearchComponent implements OnInit {

  username: string | null = null;

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

  constructor(
    private documentService: DocumentService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  // ============================================
  // INIT
  // ============================================

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.loadDocuments();
  }

  // ============================================
  // LOGOUT
  // ============================================

  // logout(): void {
  //   this.toastService.info('Logged out successfully');
  //   this.authService.logout();
  // }

  // ============================================
  // LOAD DOCUMENTS
  // ============================================

  loadDocuments() {
    this.documentService.getAll().subscribe({
      next: (data) => {
        this.documents = data;
      },
      error: () => {
        this.toastService.error('Failed to load documents');
      }
    });
  }

  // ============================================
// FILE SELECT
// ============================================

onFileSelected(event: any) {

  const file: File = event.target.files?.[0];

  if (!file) {
    return;
  }

  const MAX_SIZE = 3 * 1024 * 1024; // 3MB
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  // 🔥 Validate file type
  if (!allowedTypes.includes(file.type)) {
    this.toastService.error('Unsupported file type. Only PDF, DOCX, TXT allowed.');
    event.target.value = '';
    return;
  }

  // 🔥 Validate file size
  if (file.size > MAX_SIZE) {
    this.toastService.error('File too large. Maximum allowed size is 3MB.');
    event.target.value = '';
    return;
  }

  this.selectedFile = file;
  this.resetState();
  }

// ============================================
// RESET STATE
// ============================================

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
    this.toastService.info('Please select a file');
    return;
  }

  // 🔥 Client-side size protection (3MB)
  const MAX_SIZE = 3 * 1024 * 1024;

  if (this.selectedFile.size > MAX_SIZE) {
    this.toastService.error('File too large. Maximum allowed size is 3MB.');
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

        this.toastService.success('Upload successful — local DB updated');
        this.loadDocuments();
      },

      error: (err) => {

        this.loading = false;

        console.error('Upload error:', err);

        if (err?.status === 413) {
          this.toastService.error('File too large. Maximum allowed size is 3MB.');
        }

        else if (err?.status === 409) {
          this.toastService.error('Duplicate document already uploaded.');
        }

        else if (err?.status === 400) {
          this.toastService.error(err?.error?.message || 'Invalid file.');
        }

        else {
          this.toastService.error(
            err?.error?.message || 'Upload failed. Please try again.'
          );
        }
      }
    });
  }
  // ============================================
  // OPEN DOCUMENT
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

          this.toastService.success('Document loaded');
        },
        error: () => {
          this.loading = false;
          this.toastService.error('Failed to open document');
        }
      });
  }

  // ============================================
  // LETTER SEARCH
  // ============================================

  searchByLetters() {

    if (!this.selectedDocumentId) return;

    this.word = '';
    this.letterError = '';
    this.letterResults = [];

    this.documentService
      .searchWordsByLetters(this.selectedDocumentId, this.letterInput)
      .subscribe({
        next: (results) => {

          this.letterResults = results;

          if (results.length === 0) {
            this.toastService.info('No matching words found');
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

          this.toastService.success(`${results.length} matching words found`);

          setTimeout(() => {
            this.highlightCurrentMatch();
          }, 0);
        },
        error: (err) => {

          if (err.status === 400) {
            this.toastService.error('Please enter valid letters.');
          } else if (err.status === 404) {
            this.toastService.error('Document not found.');
          } else {
            this.toastService.error('Something went wrong.');
          }
        }
      });
  }

  // ============================================
  // DOWNLOAD LETTER SEARCH
  // ============================================

  downloadLetterSearch(type: string) {

    if (!this.selectedDocumentId || !this.letterInput) {
      this.toastService.info('Perform letter search first');
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

          this.toastService.success('Download started');
        },
        error: () => {
          this.toastService.error('Download failed');
        }
      });
  }

  // ============================================
  // LOCAL WORD SEARCH
  // ============================================

  onSearch() {

    this.letterResults = [];
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

    if (this.count === 0) {
      this.toastService.info('No matches found');
    }

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