import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book } from '../models/book.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly baseUrl = `${environment.apiUrl}/books`;

  constructor(private http: HttpClient) {}

  getAll(params?: { search?: string; category?: string }): Observable<ApiResponse<{ books: Book[] }>> {
    let httpParams = new HttpParams();
    if (params?.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }
    if (params?.category?.trim()) {
      httpParams = httpParams.set('category', params.category.trim());
    }
    return this.http.get<ApiResponse<{ books: Book[] }>>(this.baseUrl, { params: httpParams });
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

