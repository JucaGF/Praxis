import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Obtém o token de autenticação atual do Supabase
 */
async function getAuthToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Erro ao obter sessão:", error);
    return null;
  }
  return data?.session?.access_token || null;
}

/**
 * Erro customizado para problemas de autenticação
 */
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.status = 401;
  }
}

/**
 * Erro customizado para problemas de autorização (sem permissão)
 */
class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.status = 403;
  }
}

/**
 * Wrapper para fetch com autenticação automática e tratamento de erros
 * 
 * Funcionalidades:
 * - Adiciona token JWT automaticamente
 * - Detecta erro 401 e redireciona para login
 * - Detecta erro 403 e lança erro específico
 * - Mensagens de erro amigáveis
 */
async function fetchWithAuth(url, options = {}) {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { ...options, headers });
  
  // Trata erros HTTP
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: "Erro desconhecido" }));
    
    const errorMessage = errorData.detail || `Erro HTTP: ${response.status}`;
    
    // 401: Não autenticado - Redireciona para login
    if (response.status === 401) {
      console.warn("Sessão expirada ou inválida. Redirecionando para login...");
      
      // Limpa sessão do Supabase
      await supabase.auth.signOut();
      
      // Redireciona para login
      window.location.href = "/login";
      
      throw new AuthenticationError(errorMessage);
    }
    
    // 403: Sem permissão
    if (response.status === 403) {
      throw new AuthorizationError(errorMessage);
    }
    
    // Outros erros
    throw new Error(errorMessage);
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

export async function deleteAccount() {
  return await fetchWithAuth(`${API_URL}/account/delete`, {
    method: "DELETE",
  });
}
