import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink   // 🔥 REQUIRED FOR routerLink TO WORK
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private http: HttpClient, private router: Router) {}

  register() {
    this.error = '';
    this.loading = true;

    if (!this.username || !this.password) {
      this.error = 'Username and password are required';
      this.loading = false;
      return;
    }

    // Step 1: Register
    this.http.post('http://localhost:8080/api/auth/register', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: () => {
        // Step 2: Immediately login
        this.loginAfterRegister();
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed';
        this.loading = false;
      }
    });
  }

  private loginAfterRegister() {
    this.http.post<any>('http://localhost:8080/api/auth/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        this.router.navigate(['/search']);
      },
      error: () => {
        this.error = 'Auto login failed. Please login manually.';
        this.loading = false;
      }
    });
  }
}