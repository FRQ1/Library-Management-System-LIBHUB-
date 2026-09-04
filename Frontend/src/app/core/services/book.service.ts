import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book } from '../models/book.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly baseUrl = `${environment.apiUrl}/books`;

  constructor(private http: HttpClient) {}

  getAll(params?: { search?: string; category?: string }): Observable<ApiResponse<{ books: Book[] }>> {
    let query = '';
    if (params?.search || params?.category) {
      const parts: string[] = [];
      if (params.search) parts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.category) parts.push(`category=${encodeURIComponent(params.category)}`);
      query = `?${parts.join('&')}`;
    }
    return this.http.get<ApiResponse<{ books: Book[] }>>(`${this.baseUrl}${query}`);
  }

  getById(id: string): Observable<ApiResponse<{ book: Book }>> {
    return this.http.get<ApiResponse<{ book: Book }>>(`${this.baseUrl}/${id}`);
  }

  create(formData: FormData): Observable<ApiResponse<{ book: Book }>> {
    return this.http.post<ApiResponse<{ book: Book }>>(this.baseUrl, formData);
  }

  update(id: string, formData: FormData): Observable<ApiResponse<{ book: Book }>> {
    return this.http.patch<ApiResponse<{ book: Book }>>(`${this.baseUrl}/${id}`, formData);
  }

  delete(id: string): Observable<ApiResponse<{ book: Book }>> {
    return this.http.delete<ApiResponse<{ book: Book }>>(`${this.baseUrl}/${id}`);
  }
}
