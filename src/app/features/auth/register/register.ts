import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  register() {
    this.error = '';
    this.loading = true;

    if (!this.username || !this.password) {
      this.error = 'Username and password are required';
      this.loading = false;
      return;
    }

    // Step 1: Register
    this.authService.register(this.username, this.password)
      .subscribe({
        next: () => {
          // Step 2: Auto login
          this.loginAfterRegister();
        },
        error: (err) => {
          this.error = err.error?.message || 'Registration failed';
          this.loading = false;
        }
      });
  }

  private loginAfterRegister() {
    this.authService.login(this.username, this.password)
      .subscribe({
        next: (response: any) => {
          this.authService.saveToken(response.token);
          this.router.navigate(['/search']);
        },
        error: () => {
          this.error = 'Auto login failed. Please login manually.';
          this.loading = false;
        }
      });
  }
}