import { apiRequest } from "@/lib/api-request";

export const categoriesService = {
  async list() {
    return apiRequest("/categories");
  },
  async create(data: { name: string }) {
    return apiRequest("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
