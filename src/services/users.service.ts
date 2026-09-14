import { apiRequest } from "@/lib/api-request";
import { User } from "@/prisma/client";

export const usersService = {
  async list() {
    return apiRequest<User[]>("/users");
  },

  async create(data: Partial<User>) {
    return apiRequest<User>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<User>) {
    return apiRequest<User>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiRequest<void>(`/users/${id}`, {
      method: "DELETE",
    });
  },

  async toggleActive(id: string, active: boolean) {
    return this.update(id, { active });
  },
};
