import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  toast$ = this.toastSubject.asObservable();

  show(message: ToastMessage) {
    this.toastSubject.next(message);

    // Auto hide after 3 seconds
    setTimeout(() => {
      this.clear();
    }, 3000);
  }

  success(text: string) {
    this.show({ type: 'success', text });
  }

  error(text: string) {
    this.show({ type: 'error', text });
  }

  info(text: string) {
    this.show({ type: 'info', text });
  }

  clear() {
    this.toastSubject.next(null);
  }
}