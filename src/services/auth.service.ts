import { apiRequest } from "@/lib/api-request";
import type { LoginFormValues } from "@/lib/validations/auth";

export const authService = {
  async login(data: LoginFormValues) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async logout() {
    return apiRequest("/auth/logout", {
      method: "POST",
    });
  },
};
