import { getToken } from "./tokenStorage";
import { removeToken } from "./tokenStorage";
import { router } from "expo-router";

export const API_BASE_URL = "https://gym-community-app.onrender.com";

export async function getAuthHeader() {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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
    await removeToken();
    router.replace("/");
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}