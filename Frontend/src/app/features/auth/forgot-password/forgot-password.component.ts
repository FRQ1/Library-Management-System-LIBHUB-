import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../login/login.component.css',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  loading = false;
  message = '';
  isError = false;

  constructor(private auth: AuthService) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.message = '';

    this.auth.forgotPassword(this.form.getRawValue().email!).subscribe({
      next: (res) => {
        this.loading = false;
        this.isError = false;
        this.message = res.message;
      },
      error: (err) => {
        this.loading = false;
        this.isError = true;
        this.message = err.error?.message || 'Something went wrong. Please try again.';
      },
    });
  }
}
