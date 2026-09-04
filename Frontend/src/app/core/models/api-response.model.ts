export interface ApiResponse<T> {
  status: string;
  message?: string;
  count?: number;
  data: T;
}
