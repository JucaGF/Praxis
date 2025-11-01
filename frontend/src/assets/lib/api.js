import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function getAuthToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Erro ao obter sessão:", error);
    return null;
  }
  return data?.session?.access_token || null;
}

async function fetchWithAuth(url, options = {}) {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ detail: "Erro desconhecido" }));
    throw new Error(err.detail || `Erro HTTP: ${response.status}`);
  }
  return response.json();
}

export async function fetchUser() {
  return await fetchWithAuth(`${API_URL}/attributes`);
}

export async function fetchChallenges(limit = 3) {
  return await fetchWithAuth(`${API_URL}/challenges/active?limit=${limit}`);
}

export async function generateChallenges() {
  return await fetchWithAuth(`${API_URL}/challenges/generate`, {
    method: "POST",
  });
}

export async function fetchChallengeById(id) {
  return await fetchWithAuth(`${API_URL}/challenges/${id}`);
}

export async function submitSolution(submissionData) {
  return await fetchWithAuth(`${API_URL}/submissions`, {
    method: "POST",
    body: JSON.stringify(submissionData),
  });
}

export async function updateAttributes(updates) {
  return await fetchWithAuth(`${API_URL}/attributes`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}
