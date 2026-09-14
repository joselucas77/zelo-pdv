import { apiRequest } from "@/lib/api-request";
import { LojaFormData } from "@/lib/validations/loja";

export async function getLoja(): Promise<LojaFormData> {
  return apiRequest("/lojas");
}

export async function createLoja(data: LojaFormData) {
  return apiRequest("/lojas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLoja(id: string, data: LojaFormData) {
  return apiRequest(`/lojas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
