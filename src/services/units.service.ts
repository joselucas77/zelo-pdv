import { apiRequest } from "@/lib/api-request";

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  decimalPlaces: number;
  lojaId: string;
}

export type UnitFormData = Omit<Unit, "id" | "lojaId">;

export const unitsService = {
  async getUnits(): Promise<Unit[]> {
    return apiRequest("/units");
  },

  async createUnit(data: UnitFormData): Promise<Unit> {
    return apiRequest("/units", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateUnit(id: string, data: UnitFormData): Promise<void> {
    return apiRequest(`/units/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteUnit(id: string): Promise<void> {
    return apiRequest(`/units/${id}`, {
      method: "DELETE",
    });
  },
};
