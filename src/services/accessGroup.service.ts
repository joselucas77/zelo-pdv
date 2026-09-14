import { apiRequest } from "@/lib/api-request";

export interface AccessGroupDTO {
  id?: string;
  name: string;
  description?: string;
  active: boolean;
  permissions: any;
}

export async function getAccessGroups(): Promise<any[]> {
  return apiRequest("/access-groups");
}

export async function createAccessGroup(data: AccessGroupDTO) {
  return apiRequest("/access-groups", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAccessGroup(
  id: string,
  data: Partial<AccessGroupDTO>,
) {
  return apiRequest(`/access-groups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAccessGroup(id: string) {
  return apiRequest(`/access-groups/${id}`, {
    method: "DELETE",
  });
}
