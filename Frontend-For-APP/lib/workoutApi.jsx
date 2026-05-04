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

  const responseText = await response.text();
  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    const message = data?.detail || (typeof data === "string" && data) || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function getSeededWorkouts(category = null, difficulty = null) {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (difficulty) params.append("difficulty", difficulty);
  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchWithAuth(`/workouts/seeded${query}`);
}

export async function getSeededWorkout(workoutId) {
  return fetchWithAuth(`/workouts/seeded/${workoutId}`);
}

export async function saveSeededWorkoutAsRoutine(workoutId) {
  return fetchWithAuth(`/workouts/seeded/${workoutId}/save-as-routine`, {
    method: "POST",
  });
}

export async function getWorkoutLogs() {
  const authHeader = await getAuthHeader();
  return fetchWithAuth("/workout-logs/me", { headers: authHeader });
}

export async function getWorkoutStreak() {
  const authHeader = await getAuthHeader();
  // Send the device's offset so the backend buckets workouts by local date.
  // Date.getTimezoneOffset() is signed opposite of the actual UTC offset, so negate it
  // (PDT → 420 → we send -420, matching "minutes east of UTC").
  const tzOffsetMinutes = -new Date().getTimezoneOffset();
  return fetchWithAuth(
    `/workout-logs/me/streak?tz_offset_minutes=${tzOffsetMinutes}`,
    { headers: authHeader },
  );
}

export async function startWorkout(name, routineId = null, isPublic = false) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth("/workout-logs/", {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({
      name,
      routine_id: routineId,
      is_public: isPublic,
    }),
  });
}

export async function getWorkoutLog(logId) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth(`/workout-logs/${logId}`, { headers: authHeader });
}

export async function updateWorkoutLog(logId, data) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth(`/workout-logs/${logId}`, {
    method: "PUT",
    headers: authHeader,
    body: JSON.stringify(data),
  });
}

export async function deleteWorkoutLog(logId) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth(`/workout-logs/${logId}`, {
    method: "DELETE",
    headers: authHeader,
  });
}

export async function discardWorkoutLog(logId) {
  try {
    await deleteWorkoutLog(logId);
    return { ok: true };
  } catch (e) {
    if (e?.status === 404) return { ok: true };
    throw e;
  }
}

export async function addExerciseToLog(logId, exerciseData) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth(`/workout-logs/${logId}/exercises`, {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify(exerciseData),
  });
}

export async function finalizeWorkout(logId, payload) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth(`/workout-logs/${logId}/finalize`, {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify(payload),
  });
}

export async function deleteExerciseFromLog(logId, exerciseId) {
  return fetchWithAuth(`/workout-logs/${logId}/exercises/${exerciseId}`, {
    method: 'DELETE',
  });
}

export async function saveLogAsRoutine(logId, name = null) {
  const authHeader = await getAuthHeader();
  const params = name ? `?name=${encodeURIComponent(name)}` : "";
  return fetchWithAuth(`/workout-logs/${logId}/save-as-routine${params}`, {
    method: "POST",
    headers: authHeader,
  });
}

export async function getMyRoutines() {
  const authHeader = await getAuthHeader();
  return fetchWithAuth("/routines/me", { headers: authHeader });
}

export async function getRoutine(routineId) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth(`/routines/${routineId}`, { headers: authHeader });
}

export async function createRoutine(name, description = "", isPublic = false, exercises = []) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth("/routines/", {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({
      name,
      description,
      is_public: isPublic,
      exercises,
    }),
  });
}

export async function updateRoutine(routineId, data) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth(`/routines/${routineId}`, {
    method: "PUT",
    headers: authHeader,
    body: JSON.stringify(data),
  });
}

export async function deleteRoutine(routineId) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth(`/routines/${routineId}`, {
    method: "DELETE",
    headers: authHeader,
  });
}

export async function addExerciseToRoutine(routineId, exercises) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth(`/routines/${routineId}/exercises`, {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({ exercises }),
  });
}

export async function copyWorkoutLogAsRoutine(logId) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth(`/routines/${logId}/copy`, {
    method: "POST",
    headers: authHeader,
  });
}

export async function searchExercises(q = "", category = null, equipment = null, target = null, limit = 20) {
  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (category) params.append("category", category);
  if (equipment) params.append("equipment", equipment);
  if (target) params.append("target", target);
  params.append("limit", limit);
  return fetchWithAuth(`/exercises/search?${params.toString()}`);
}

export async function getBodyParts() {
  return fetchWithAuth("/exercises/body-parts");
}

export async function getEquipmentTypes() {
  return fetchWithAuth("/exercises/equipment");
}

export async function getExerciseHistory(exerciseId) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth(`/exercises/${exerciseId}/history`, { headers: authHeader });
}

export async function getExerciseRecords(exerciseId) {
  const authHeader = await getAuthHeader();
  return fetchWithAuth(`/exercises/${exerciseId}/records`, { headers: authHeader });
}