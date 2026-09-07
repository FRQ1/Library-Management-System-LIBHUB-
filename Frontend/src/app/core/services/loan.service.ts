import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Loan } from '../models/loan.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly baseUrl = `${environment.apiUrl}/loans`;

  constructor(private http: HttpClient) {}

  getAll(status?: string): Observable<ApiResponse<{ loans: Loan[] }>> {
    let params = new HttpParams();
    if (status?.trim()) {
      params = params.set('status', status.trim());
    }
    return this.http.get<ApiResponse<{ loans: Loan[] }>>(this.baseUrl, { params });
  }

  getOverdue(): Observable<ApiResponse<{ loans: Loan[] }>> {
    return this.http.get<ApiResponse<{ loans: Loan[] }>>(`${this.baseUrl}/overdue`);
  }

  getMyLoans(): Observable<ApiResponse<{ loans: Loan[] }>> {
    return this.http.get<ApiResponse<{ loans: Loan[] }>>(`${this.baseUrl}/my`);
  }

  checkout(payload: { bookId: string; memberId: string; days?: number }): Observable<ApiResponse<{ loan: Loan }>> {
    return this.http.post<ApiResponse<{ loan: Loan }>>(this.baseUrl, payload);
  }

  renew(id: string, days?: number): Observable<ApiResponse<{ loan: Loan }>> {
    return this.http.patch<ApiResponse<{ loan: Loan }>>(`${this.baseUrl}/${id}/renew`, { days });
  }

  returnBook(id: string): Observable<ApiResponse<{ loan: Loan }>> {
    return this.http.patch<ApiResponse<{ loan: Loan }>>(`${this.baseUrl}/${id}/return`, {});
  }
}
