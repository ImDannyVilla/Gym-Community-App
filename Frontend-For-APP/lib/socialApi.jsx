import { API_BASE_URL, getAuthHeader } from "./api";

async function fetchWithAuth(endpoint, options = {}) {
  const authHeader = await getAuthHeader();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }

  return data;
}

// Follow/Unfollow users
export async function followUser(userId) {
  return fetchWithAuth(`/users/${userId}/follow`, { method: "POST" });
}

export async function unfollowUser(userId) {
  return fetchWithAuth(`/users/${userId}/unfollow`, { method: "DELETE" });
}

// Get followers/following lists
export async function getFollowers(userId) {
  return fetchWithAuth(`/users/${userId}/followers`);
}

export async function getFollowing(userId) {
  return fetchWithAuth(`/users/${userId}/following`);
}

// Search users
export async function searchUsers(query, limit = 20) {
  const params = new URLSearchParams({ q: query, limit });
  return fetchWithAuth(`/users/search?${params.toString()}`);
}

// Get user by username
export async function getUserByUsername(username) {
  return fetchWithAuth(`/users/${username}`);
}

// Get current user's profile
export async function getMyProfile() {
  return fetchWithAuth("/users/me");
}

// Update current user's profile
export async function updateMyProfile(profileData) {
  return fetchWithAuth("/users/me/profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}

// Update current user's password
export async function updateMyPassword(currentPassword, newPassword) {
  return fetchWithAuth("/users/me/password", {
    method: "PUT",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

// Change current user's email
export async function changeEmail(newEmail) {
  return fetchWithAuth("/users/change-email", {
    method: "POST",
    body: JSON.stringify({
      new_email: newEmail,
    }),
  });
}

// Public feed (no auth required but passing auth header is harmless)
export async function getPublicFeed(skip = 0, limit = 20) {
  const params = new URLSearchParams({ skip, limit });
  return fetchWithAuth(`/workout-logs/public?${params.toString()}`);
}

// Public posts for a specific user
export async function getUserPublicLogs(userId, skip = 0, limit = 20) {
  const params = new URLSearchParams({ user_id: userId, skip, limit });
  return fetchWithAuth(`/workout-logs/public?${params.toString()}`);
}

// Full detail for a single public workout log (no auth required)
export async function getPublicWorkoutLog(logId) {
  return fetchWithAuth(`/workout-logs/public/${logId}`);
}
