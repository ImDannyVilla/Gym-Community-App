import { getToken, saveToken, saveRefreshToken, getRefreshToken, clearAllTokens } from "./tokenStorage";

export const API_BASE_URL = "https://gym-community-app.onrender.com";

export async function getAuthHeader() {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function tryRefreshToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) return false;

  const data = await response.json();
  await saveToken(data.access_token);
  await saveRefreshToken(data.refresh_token);
  return true;
}

export async function apiFetch(endpoint, options = {}) {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newAuthHeader = await getAuthHeader();
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...newAuthHeader,
          ...options.headers,
        },
      });
      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(error.detail || "Request failed");
      }
      return retryResponse.json();
    }
    // Refresh failed — clear tokens so the auth guard redirects to login
    await clearAllTokens();
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}
