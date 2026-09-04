import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './verify-email.component.html',
  styleUrl: '../login/login.component.css',
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  success = false;
  message = '';

  constructor(private route: ActivatedRoute, private auth: AuthService) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.loading = false;
      this.message = 'No verification token provided.';
      return;
    }

    this.auth.verifyEmail(token).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = true;
        this.message = res.message;
      },
      error: (err) => {
        this.loading = false;
        this.success = false;
        this.message = err.error?.message || 'Verification failed. The link may have expired.';
      },
    });
  }
}
