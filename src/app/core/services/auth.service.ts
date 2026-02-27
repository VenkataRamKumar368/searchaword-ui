import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly baseUrl =
    environment.production
      ? 'https://searchaword-backend.onrender.com/api/v1/auth'
      : 'http://localhost:8080/api/v1/auth';

  private readonly tokenKey = 'auth_token';

  // 🔥 Reactive username state
  private usernameSubject = new BehaviorSubject<string | null>(this.extractUsername());
  public username$ = this.usernameSubject.asObservable();

  constructor(private http: HttpClient) {}

  // 🔐 Login
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}/login`,
      { username, password }
    );
  }

  // 📝 Register
  register(username: string, password: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/register`,
      { username, password }
    );
  }

  // 💾 Save token
  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.usernameSubject.next(this.extractUsername()); // 🔥 update immediately
  }

  // 📥 Get token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // 👤 Public method (if needed elsewhere)
  getUsername(): string | null {
    return this.extractUsername();
  }

  // 🔍 Extract username from JWT
  private extractUsername(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.sub ?? null;   // Spring Security uses "sub"
    } catch {
      return null;
    }
  }

  // 🚪 Logout
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.usernameSubject.next(null); // 🔥 clear username immediately
  }

  // ✅ Check login
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}