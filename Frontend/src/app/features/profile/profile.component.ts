import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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
  private userService = inject(UserService);
  private toast = inject(ToastService);
  public auth = inject(AuthService);

  // Deactivate account modal state
  showDeactivateModal = signal<boolean>(false);
  deactivating = signal<boolean>(false);

  profileForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  passwordForm = new FormGroup({
    currentPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  selectedFile: File | null = null;
  previewUrl = signal<string | null>(null);

  profileMessage = signal<string>('');
  profileError = signal<boolean>(false);
  profileLoading = signal<boolean>(false);

  passwordMessage = signal<string>('');
  passwordError = signal<boolean>(false);
  passwordLoading = signal<boolean>(false);

  pictureLoading = signal<boolean>(false);
  pictureMessage = signal<string>('');
  pictureError = signal<boolean>(false);

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

    this.profileLoading.set(true);
    this.profileMessage.set('');

    const name = this.profileForm.get('name')?.value || '';
    const email = this.profileForm.get('email')?.value || '';

    this.userService.updateMe({ name, email }).subscribe({
      next: (res) => {
        this.profileLoading.set(false);
        this.profileError.set(false);
        this.profileMessage.set('Profile updated successfully.');
        this.toast.success('Profile updated successfully.');
        this.auth.updateStoredUser(res.data.user);
      },
      error: (err) => {
        this.profileLoading.set(false);
        this.profileError.set(true);
        this.profileMessage.set(err.error?.message || 'Could not update your profile.');
        this.toast.error(this.profileMessage());
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordLoading.set(true);
    this.passwordMessage.set('');

    const currentPassword = this.passwordForm.get('currentPassword')?.value || '';
    const newPassword = this.passwordForm.get('newPassword')?.value || '';

    this.userService
      .updateMyPassword({ currentPassword, newPassword })
      .subscribe({
        next: () => {
          this.passwordLoading.set(false);
          this.passwordError.set(false);
          this.passwordMessage.set('Password changed successfully.');
          this.toast.success('Password changed successfully.');
          this.passwordForm.reset();
        },
        error: (err) => {
          this.passwordLoading.set(false);
          this.passwordError.set(true);
          this.passwordMessage.set(err.error?.message || 'Could not change your password.');
          this.toast.error(this.passwordMessage());
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    if (!file) {
      this.selectedFile = null;
      this.previewUrl.set(null);
      return;
    }

    const validation = validateProfilePictureFile(file);
    if (!validation.isValid) {
      this.pictureError.set(true);
      this.pictureMessage.set(validation.error || 'Invalid file.');
      this.toast.error(this.pictureMessage());
      input.value = '';
      return;
    }

    this.pictureError.set(false);
    this.pictureMessage.set('');
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(this.selectedFile);
  }

  uploadPicture(): void {
    if (!this.selectedFile) return;

    this.pictureLoading.set(true);
    this.pictureMessage.set('');

    const formData = new FormData();
    formData.append('profilePicture', this.selectedFile);

    this.userService.updateMyPicture(formData).subscribe({
      next: (res) => {
        this.pictureLoading.set(false);
        this.pictureError.set(false);
        this.pictureMessage.set('Profile picture updated.');
        this.toast.success('Profile picture updated.');
        this.auth.updateStoredUser(res.data.user);
        this.selectedFile = null;
      },
      error: (err) => {
        this.pictureLoading.set(false);
        this.pictureError.set(true);
        this.pictureMessage.set(err.error?.message || 'Could not upload your picture.');
        this.toast.error(this.pictureMessage());
      },
    });
  }

  promptDeactivate(): void {
    this.showDeactivateModal.set(true);
  }

  cancelDeactivate(): void {
    this.showDeactivateModal.set(false);
  }

  confirmDeactivate(): void {
    this.deactivating.set(true);
    this.showDeactivateModal.set(false);

    this.userService.deactivateMe().subscribe({
      next: () => {
        this.deactivating.set(false);
        this.toast.success('Your account has been deactivated.');
        this.auth.logout();
      },
      error: (err) => {
        this.deactivating.set(false);
        this.toast.error(err.error?.message || 'Could not deactivate your account.');
      },
    });
  }
}


