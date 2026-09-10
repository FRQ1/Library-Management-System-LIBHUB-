import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Service()
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/users`;

  private readonly http = inject(HttpClient);

  // --- own profile ---
  getMe(): Observable<ApiResponse<{ user: User }>> {
    return this.http.get<ApiResponse<{ user: User }>>(`${this.baseUrl}/me`);
  }

  updateMe(payload: { name?: string; email?: string }): Observable<ApiResponse<{ user: User }>> {
    return this.http.patch<ApiResponse<{ user: User }>>(`${this.baseUrl}/me`, payload);
  }

  updateMyPassword(payload: { currentPassword: string; newPassword: string }): Observable<{ status: string; message: string }> {
    return this.http.patch<{ status: string; message: string }>(`${this.baseUrl}/me/password`, payload);
  }

  updateMyPicture(formData: FormData): Observable<ApiResponse<{ user: User }>> {
    return this.http.patch<ApiResponse<{ user: User }>>(`${this.baseUrl}/me/picture`, formData);
  }

  deactivateMe(): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(`${this.baseUrl}/me`);
  }

  // --- admin ---
  getAll(role?: string): Observable<ApiResponse<{ users: User[] }>> {
    let params = new HttpParams();
    if (role?.trim()) {
      params = params.set('role', role.trim());
    }
    return this.http.get<ApiResponse<{ users: User[] }>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<{ user: User }>> {
    return this.http.get<ApiResponse<{ user: User }>>(`${this.baseUrl}/${id}`);
  }

  updateStatus(id: string, isActive: boolean): Observable<ApiResponse<{ user: User }>> {
    return this.http.patch<ApiResponse<{ user: User }>>(`${this.baseUrl}/${id}/status`, { isActive });
  }

  updateRole(id: string, role: string): Observable<ApiResponse<{ user: User }>> {
    return this.http.patch<ApiResponse<{ user: User }>>(`${this.baseUrl}/${id}/role`, { role });
  }

  deleteUser(id: string): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(`${this.baseUrl}/${id}`);
  }
}
