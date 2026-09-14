const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = "Erro ao comunicar com o servidor.";
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Falha ao fazer parse do JSON, mantem o erro padrão
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
