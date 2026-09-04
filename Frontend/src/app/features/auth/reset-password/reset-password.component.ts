import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: '../login/login.component.css',
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    token: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  loading = false;
  message = '';
  isError = false;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const tokenFromUrl = this.route.snapshot.paramMap.get('token');
    if (tokenFromUrl) {
      this.form.patchValue({ token: tokenFromUrl });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.message = '';
    const { token, password } = this.form.getRawValue();

    this.auth.resetPassword(token!, password!).subscribe({
      next: (res) => {
        this.loading = false;
        this.isError = false;
        this.message = res.message;
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.isError = true;
        this.message = err.error?.message || 'Something went wrong. Please try again.';
      },
    });
  }
}
