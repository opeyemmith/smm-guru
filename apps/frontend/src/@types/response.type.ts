export interface ApiResponse<T> {
  error?: string;
  success: boolean;
  name: string;
  message: string;
  result: T;
}
