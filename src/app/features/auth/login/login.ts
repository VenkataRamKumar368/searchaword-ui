import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink   // 🔥 REQUIRED FOR routerLink
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  username = '';
  password = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    this.errorMessage = '';

    this.authService.login(this.username, this.password)
      .subscribe({
        next: (response: any) => {
          const token = response.token;
          this.authService.saveToken(token);
          this.router.navigate(['/search']);
        },
        error: () => {
          this.errorMessage = 'Invalid username or password';
        }
      });
  }
}