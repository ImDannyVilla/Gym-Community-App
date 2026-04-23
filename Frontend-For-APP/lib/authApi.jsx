import { API_BASE_URL } from "./api";

export async function registerUser({ email, username, password, full_name }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      username,
      password,
      full_name
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Registration failed");
  }

  return data;
}

/*
export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }

  return data;
}*/

export async function loginUser({ email, password }) {
  // OAuth2 standard requires "username" and "password" as form fields instead of the JSON I had - DV
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }

  // Returns { access_token: "...", token_type: "bearer" }
  return data;
}

export async function forgotPasswordEmail({ email }) {
  const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to send reset link");
  }

  return data;
}

export async function forgotEmailUsername({ username }) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-email?username=${encodeURIComponent(username)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to find email");
  }

  return data;
}

export async function updatePassword({ new_password }, token) {
  const response = await fetch(`${API_BASE_URL}/auth/update-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ new_password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to update password");
  }

  return data;
}

export async function resendConfirmation({ email }) {
  const response = await fetch(`${API_BASE_URL}/auth/resend-confirmation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Failed to resend confirmation");
  }

  return data;
}