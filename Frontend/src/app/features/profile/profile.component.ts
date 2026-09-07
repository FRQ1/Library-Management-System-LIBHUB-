import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { UserAvatarPipe } from '../../core/pipes/media-url.pipe';
import { validateProfilePictureFile } from '../../core/utils/file-validation';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, UserAvatarPipe, ConfirmModalComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  public auth = inject(AuthService);

  // Deactivate account modal state
  showDeactivateModal = false;
  deactivating = false;

  profileForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  profileMessage = '';
  profileError = false;
  profileLoading = false;

  passwordMessage = '';
  passwordError = false;
  passwordLoading = false;

  pictureLoading = false;
  pictureMessage = '';
  pictureError = false;

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.patchValue({ name: user.name, email: user.email });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileLoading = true;
    this.profileMessage = '';

    this.userService.updateMe(this.profileForm.getRawValue() as { name: string; email: string }).subscribe({
      next: (res) => {
        this.profileLoading = false;
        this.profileError = false;
        this.profileMessage = 'Profile updated successfully.';
        this.toast.success('Profile updated successfully.');
        this.auth.updateStoredUser(res.data.user);
      },
      error: (err) => {
        this.profileLoading = false;
        this.profileError = true;
        this.profileMessage = err.error?.message || 'Could not update your profile.';
        this.toast.error(this.profileMessage);
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordLoading = true;
    this.passwordMessage = '';

    this.userService
      .updateMyPassword(this.passwordForm.getRawValue() as { currentPassword: string; newPassword: string })
      .subscribe({
        next: () => {
          this.passwordLoading = false;
          this.passwordError = false;
          this.passwordMessage = 'Password changed successfully.';
          this.toast.success('Password changed successfully.');
          this.passwordForm.reset();
        },
        error: (err) => {
          this.passwordLoading = false;
          this.passwordError = true;
          this.passwordMessage = err.error?.message || 'Could not change your password.';
          this.toast.error(this.passwordMessage);
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    if (!file) {
      this.selectedFile = null;
      this.previewUrl = null;
      return;
    }

    const validation = validateProfilePictureFile(file);
    if (!validation.isValid) {
      this.pictureError = true;
      this.pictureMessage = validation.error || 'Invalid file.';
      this.toast.error(this.pictureMessage);
      input.value = '';
      return;
    }

    this.pictureError = false;
    this.pictureMessage = '';
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(this.selectedFile);
  }

  uploadPicture(): void {
    if (!this.selectedFile) return;

    this.pictureLoading = true;
    this.pictureMessage = '';

    const formData = new FormData();
    formData.append('profilePicture', this.selectedFile);

    this.userService.updateMyPicture(formData).subscribe({
      next: (res) => {
        this.pictureLoading = false;
        this.pictureError = false;
        this.pictureMessage = 'Profile picture updated.';
        this.toast.success('Profile picture updated.');
        this.auth.updateStoredUser(res.data.user);
        this.selectedFile = null;
      },
      error: (err) => {
        this.pictureLoading = false;
        this.pictureError = true;
        this.pictureMessage = err.error?.message || 'Could not upload your picture.';
        this.toast.error(this.pictureMessage);
      },
    });
  }

  promptDeactivate(): void {
    this.showDeactivateModal = true;
  }

  cancelDeactivate(): void {
    this.showDeactivateModal = false;
  }

  confirmDeactivate(): void {
    this.deactivating = true;
    this.showDeactivateModal = false;

    this.userService.deactivateMe().subscribe({
      next: () => {
        this.deactivating = false;
        this.toast.success('Your account has been deactivated.');
        this.auth.logout();
      },
      error: (err) => {
        this.deactivating = false;
        this.toast.error(err.error?.message || 'Could not deactivate your account.');
      },
    });
  }
}

