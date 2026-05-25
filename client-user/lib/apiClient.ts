// client/src/lib/apiClient.ts
import api from "@/lib/axios";

export class ApiClient {
  static async get<T>(url: string, params?: any): Promise<T> {
    const res = await api.get(url, { params });
    return res.data;
  }

  static async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const res = await api.post(url, data, config);
    return res.data;
  }

  static async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const res = await api.put(url, data, config);
    return res.data;
  }

  static async delete<T>(url: string, data?: any): Promise<T> {
    const res = await api.delete(url, { data });
    return res.data;
  }

  static async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const res = await api.patch(url, data, config);
    return res.data;
  }
}
