import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reservation } from '../models/reservation.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly baseUrl = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  getAll(status?: string): Observable<ApiResponse<{ reservations: Reservation[] }>> {
    let params = new HttpParams();
    if (status?.trim()) {
      params = params.set('status', status.trim());
    }
    return this.http.get<ApiResponse<{ reservations: Reservation[] }>>(this.baseUrl, { params });
  }

  getMyReservations(): Observable<ApiResponse<{ reservations: Reservation[] }>> {
    return this.http.get<ApiResponse<{ reservations: Reservation[] }>>(`${this.baseUrl}/my`);
  }

  create(bookId: string): Observable<ApiResponse<{ reservation: Reservation }>> {
    return this.http.post<ApiResponse<{ reservation: Reservation }>>(this.baseUrl, { bookId });
  }

  markReady(id: string): Observable<ApiResponse<{ reservation: Reservation }>> {
    return this.http.patch<ApiResponse<{ reservation: Reservation }>>(`${this.baseUrl}/${id}/ready`, {});
  }

  cancel(id: string): Observable<ApiResponse<{ reservation: Reservation }>> {
    return this.http.delete<ApiResponse<{ reservation: Reservation }>>(`${this.baseUrl}/${id}`);
  }
}
