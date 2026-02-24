import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = `${environment.apiBaseUrl}/auth`;
  private tokenKey = 'auth_token';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // 🔐 Login
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { username, password });
  }

  // 📝 Register
  register(username: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, { username, password });
  }

  // 💾 Save token
  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // 📥 Get token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // 👤 Extract username from JWT
  getUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || null;  // Spring uses "sub" as username
    } catch {
      return null;
    }
  }

  // 🚪 Logout
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  // ✅ Check login
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}