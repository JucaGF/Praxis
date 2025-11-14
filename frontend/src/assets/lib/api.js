import { supabase } from "./supabaseClient";
import logger from "../utils/logger";

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
  
  const method = options.method || "GET";
  logger.debug("API request start", { method, url, hasToken: Boolean(token) });
  
  const response = await fetch(url, { ...options, headers });
  
  // Trata erros HTTP
  if (!response.ok) {
    logger.warn("API request failed", {
      method,
      url,
      status: response.status,
    });
    const errorData = await response
      .json()
      .catch(() => ({ detail: "Erro desconhecido" }));
    
    const errorMessage = errorData.detail || `Erro HTTP: ${response.status}`;
    
    // 401: Não autenticado - Redireciona para login
    if (response.status === 401) {
      
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
    
    // 404: Recurso não encontrado (pode ser usuário novo sem attributes)
    if (response.status === 404) {
      
      // Cria erro customizado para 404
      const notFoundError = new Error(errorMessage);
      notFoundError.status = 404;
      throw notFoundError;
    }
    
    // 500: Erro interno do servidor
    if (response.status === 500) {
      logger.error("API request failed: Internal Server Error", {
        method,
        url,
        status: response.status,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
    
    // 503: Serviço indisponível (ex: IA temporariamente indisponível)
    if (response.status === 503) {
      logger.error("API request failed: Service Unavailable", {
        method,
        url,
        status: response.status,
        error: errorMessage
      });
      const serviceError = new Error(
        errorMessage || "Serviço temporariamente indisponível. Por favor, tente novamente em alguns instantes."
      );
      serviceError.status = 503;
      serviceError.isServiceUnavailable = true;
      throw serviceError;
    }
    
    // Outros erros HTTP
    logger.error("API request failed: Unknown error", {
      method,
      url,
      status: response.status,
      error: errorMessage
    });
    throw new Error(errorMessage);
  }
  
  logger.debug("API request success", {
    method,
    url,
    status: response.status,
  });
  return response.json();
}

export async function fetchUser() {
  return await fetchWithAuth(`${API_URL}/attributes`);
}

export async function fetchProfile() {
  return await fetchWithAuth(`${API_URL}/profile`);
}

export async function fetchSubmissions() {
  return await fetchWithAuth(`${API_URL}/submissions`);
}

export async function fetchSubmissionDetails(submissionId) {
  return await fetchWithAuth(`${API_URL}/submissions/${submissionId}/details`);
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

export async function fetchChallengeResult(challengeId) {
  return await fetchWithAuth(`${API_URL}/submissions?challenge_id=${challengeId}`);
}

export async function submitSolution(submissionData) {
  // Obter o user ID do Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  
  if (!userId) {
    throw new Error("Usuário não autenticado");
  }
  
  // Adicionar profile_id aos dados
  const dataWithProfile = {
    ...submissionData,
    profile_id: userId
  };
  
  logger.event("submission:send", {
    challengeId: submissionData.challenge_id,
    type: submissionData.submitted_code?.type,
  });
  return await fetchWithAuth(`${API_URL}/submissions`, {
    method: "POST",
    body: JSON.stringify(dataWithProfile),
  });
}

export async function updateAttributes(profileId, updates) {
  return await fetchWithAuth(`${API_URL}/attributes/${profileId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteAccount() {
  return await fetchWithAuth(`${API_URL}/account/delete`, {
    method: "DELETE",
  });
}

// ==================== RESUME / ANÁLISE DE CURRÍCULO ====================

/**
 * Faz upload de um currículo (texto)
 * @param {Object} resumeData - Dados do currículo
 * @param {string} resumeData.title - Título do currículo (opcional)
 * @param {string} resumeData.content - Conteúdo do currículo
 */
export async function uploadResume(resumeData) {
  return await fetchWithAuth(`${API_URL}/resumes/upload`, {
    method: "POST",
    body: JSON.stringify(resumeData),
  });
}

/**
 * Faz upload de um currículo (arquivo PDF, DOCX, etc)
 * @param {File} file - Arquivo do currículo
 * @param {string} title - Título do currículo (opcional)
 */
export async function uploadResumeFile(file, title = null) {
  const token = await getAuthToken();
  
  if (!token) {
    throw new AuthenticationError("Não autenticado");
  }
  
  const formData = new FormData();
  formData.append("file", file);
  if (title) {
    formData.append("title", title);
  }
  
  const response = await fetch(`${API_URL}/resumes/upload/file`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      // NÃO adicione Content-Type aqui! O browser adiciona automaticamente com boundary
    },
    body: formData,
  });
  
  // Trata erros HTTP
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: "Erro desconhecido" }));
    
    const errorMessage = errorData.detail || `Erro HTTP: ${response.status}`;
    
    if (response.status === 401) {
      
      await supabase.auth.signOut();
      window.location.href = "/login";
      throw new AuthenticationError(errorMessage);
    }
    
    if (response.status === 403) {
      throw new AuthorizationError(errorMessage);
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * Lista todos os currículos do usuário
 */
export async function listResumes() {
  return await fetchWithAuth(`${API_URL}/resumes/`);
}

/**
 * Busca um currículo específico com análise
 * @param {number} resumeId - ID do currículo
 */
export async function getResumeWithAnalysis(resumeId) {
  return await fetchWithAuth(`${API_URL}/resumes/${resumeId}`);
}

/**
 * Analisa um currículo usando IA
 * @param {number} resumeId - ID do currículo a ser analisado
 */
export async function analyzeResume(resumeId) {
  return await fetchWithAuth(`${API_URL}/resumes/${resumeId}/analyze`, {
    method: "POST",
  });
}

/**
 * Deleta um currículo
 * @param {number} resumeId - ID do currículo a ser deletado
 */
export async function deleteResume(resumeId) {
  return await fetchWithAuth(`${API_URL}/resumes/${resumeId}`, {
    method: "DELETE",
  });
}

/**
 * Conecta ao endpoint SSE de geração de desafios com streaming
 * 
 * @param {Object} callbacks - Callbacks para diferentes eventos
 * @param {Function} callbacks.onStart - Chamado quando inicia
 * @param {Function} callbacks.onProgress - Chamado com progresso (percent, message)
 * @param {Function} callbacks.onChallenge - Chamado quando um desafio é recebido
 * @param {Function} callbacks.onComplete - Chamado quando termina
 * @param {Function} callbacks.onError - Chamado em caso de erro
 * @returns {Function} Função para cancelar/fechar a conexão
 */
/**
 * Analisa um currículo existente com streaming SSE
 * 
 * @param {number} resumeId - ID do currículo a ser analisado
 * @param {Object} callbacks - Callbacks para diferentes eventos
 * @param {Function} callbacks.onStart - Chamado quando inicia
 * @param {Function} callbacks.onProgress - Chamado com progresso (percent, message)
 * @param {Function} callbacks.onFieldChunk - Chamado quando um campo é recebido
 * @param {Function} callbacks.onComplete - Chamado quando termina com análise completa
 * @param {Function} callbacks.onError - Chamado em caso de erro
 * @returns {Function} Função para cancelar/fechar a conexão
 */
export async function analyzeResumeStreaming(resumeId, callbacks) {
  const token = await getAuthToken();
  
  if (!token) {
    callbacks.onError?.({ message: "Não autenticado" });
    return () => {};
  }

  const controller = new AbortController();
  
  try {
    const response = await fetch(`${API_URL}/resumes/${resumeId}/analyze/stream`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "text/event-stream",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    
    let currentEvent = null;
    let currentData = "";

    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          
          buffer += chunk;
          
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              currentEvent = line.substring(6).trim();
            } else if (line.startsWith("data:")) {
              currentData = line.substring(5).trim();
            } else if (line === "" && currentEvent && currentData) {
              
              try {
                const data = JSON.parse(currentData);
                
                switch (currentEvent) {
                  case "start":
                    callbacks.onStart?.(data);
                    break;
                  case "progress":
                    callbacks.onProgress?.(data);
                    break;
                  case "field_chunk":
                    callbacks.onFieldChunk?.(data);
                    break;
                  case "complete":
                    callbacks.onComplete?.(data);
                    break;
                  case "error":
                    callbacks.onError?.(data);
                    break;
                }
              } catch (e) {
                console.error("❌ Erro ao parsear evento SSE:", e, currentData);
              }
              
              currentEvent = null;
              currentData = "";
            }
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("❌ Erro no stream:", error);
          callbacks.onError?.({ message: error.message });
        }
      }
    };

    readStream();
    
    return () => {
      
      controller.abort();
      reader.cancel();
    };
    
  } catch (error) {
    console.error("❌ Erro ao conectar SSE:", error);
    callbacks.onError?.({ message: error.message });
    return () => {};
  }
}

/**
 * Faz upload de arquivo E analisa com streaming SSE em um único passo
 * 
 * @param {File} file - Arquivo do currículo (PDF, DOCX, etc)
 * @param {string} title - Título do currículo (opcional)
 * @param {Object} callbacks - Callbacks para diferentes eventos (mesmos de analyzeResumeStreaming)
 * @returns {Function} Função para cancelar/fechar a conexão
 */
export async function uploadAndAnalyzeResumeFileStreaming(file, title, callbacks) {
  const token = await getAuthToken();
  
  if (!token) {
    callbacks.onError?.({ message: "Não autenticado" });
    return () => {};
  }

  const controller = new AbortController();
  
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (title) {
      formData.append("title", title);
    }

    const response = await fetch(`${API_URL}/resumes/upload/file/analyze`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "text/event-stream",
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    
    let currentEvent = null;
    let currentData = "";

    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          
          buffer += chunk;
          
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              currentEvent = line.substring(6).trim();
            } else if (line.startsWith("data:")) {
              currentData = line.substring(5).trim();
            } else if (line === "" && currentEvent && currentData) {
              
              try {
                const data = JSON.parse(currentData);
                
                switch (currentEvent) {
                  case "start":
                    callbacks.onStart?.(data);
                    break;
                  case "progress":
                    callbacks.onProgress?.(data);
                    break;
                  case "field_chunk":
                    callbacks.onFieldChunk?.(data);
                    break;
                  case "complete":
                    callbacks.onComplete?.(data);
                    break;
                  case "error":
                    callbacks.onError?.(data);
                    break;
                }
              } catch (e) {
                console.error("❌ Erro ao parsear evento SSE:", e, currentData);
              }
              
              currentEvent = null;
              currentData = "";
            }
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("❌ Erro no stream:", error);
          callbacks.onError?.({ message: error.message });
        }
      }
    };

    readStream();
    
    return () => {
      
      controller.abort();
      reader.cancel();
    };
    
  } catch (error) {
    console.error("❌ Erro ao conectar SSE:", error);
    callbacks.onError?.({ message: error.message });
    return () => {};
  }
}

export async function generateChallengesStreaming(callbacks) {
  const token = await getAuthToken();
  
  if (!token) {
    callbacks.onError?.({ message: "Não autenticado" });
    return () => {};
  }

  // Usar fetch com streaming (mais flexível que EventSource)
  const controller = new AbortController();
  
  try {
    const response = await fetch(`${API_URL}/challenges/generate/stream`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "text/event-stream",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    
    // Estado do evento SSE (mantido entre leituras)
    let currentEvent = null;
    let currentData = "";

    // Ler stream
    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            
            break;
          }

          // Decodificar chunk
          const chunk = decoder.decode(value, { stream: true });
          
          buffer += chunk;
          
          // Processar eventos SSE do buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Guarda linha incompleta

          for (const line of lines) {
            if (line.startsWith("event:")) {
              currentEvent = line.substring(6).trim();
            } else if (line.startsWith("data:")) {
              currentData = line.substring(5).trim();
            } else if (line === "" && currentEvent && currentData) {
              // Evento completo, processar IMEDIATAMENTE
              
              try {
                const data = JSON.parse(currentData);
                
                // Chamar callback apropriado
                switch (currentEvent) {
                  case "start":
                    callbacks.onStart?.(data);
                    break;
                  case "progress":
                    callbacks.onProgress?.(data);
                    break;
                  case "challenge_chunk":
                    callbacks.onChallengeChunk?.(data);
                    break;
                  case "challenge":
                    callbacks.onChallenge?.(data);
                    break;
                  case "complete":
                    callbacks.onComplete?.(data);
                    break;
                  case "error":
                    callbacks.onError?.(data);
                    break;
                }
              } catch (e) {
                console.error("❌ Erro ao parsear evento SSE:", e, currentData);
              }
              
              // Resetar estado
              currentEvent = null;
              currentData = "";
            }
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("❌ Erro no stream:", error);
          callbacks.onError?.({ message: error.message });
        }
      }
    };

    readStream();
    
    // Retorna função para cancelar
    return () => {
      
      controller.abort();
      reader.cancel();
    };
    
  } catch (error) {
    console.error("❌ Erro ao conectar SSE:", error);
    callbacks.onError?.({ message: error.message });
    return () => {};
  }
}
