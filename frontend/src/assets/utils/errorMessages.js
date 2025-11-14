/**
 * Utilitário para mapear erros técnicos em mensagens amigáveis para o usuário
 */

/**
 * Mapeia erros para mensagens amigáveis baseado no contexto
 * @param {Error|string} error - O erro capturado
 * @param {string} context - Contexto do erro ('auth', 'signup', 'challenge', 'submission', 'validation', 'general')
 * @returns {string} Mensagem amigável para o usuário
 */
export function getErrorMessage(error, context = 'general') {
  const errorMsg = error?.message || error || '';
  const errorMsgLower = errorMsg.toLowerCase();

  // ==================== ERROS DE AUTENTICAÇÃO ====================
  if (context === 'auth' || context === 'signup') {
    // Credenciais inválidas
    if (errorMsgLower.includes('invalid login credentials') || 
        errorMsgLower.includes('invalid email or password') ||
        errorMsgLower.includes('invalid credentials')) {
      return 'Email ou senha incorretos. Verifique seus dados e tente novamente.';
    }

    // Email não confirmado
    if (errorMsgLower.includes('email not confirmed') ||
        errorMsgLower.includes('email confirmation')) {
      return 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.';
    }

    // Usuário já registrado
    if (errorMsgLower.includes('user already registered') ||
        errorMsgLower.includes('already registered') ||
        errorMsgLower.includes('already exists')) {
      return 'Este email já está cadastrado. Tente fazer login ou recuperar sua senha.';
    }

    // Email inválido
    if (errorMsgLower.includes('invalid email') ||
        errorMsgLower.includes('email is invalid')) {
      return 'Email inválido. Por favor, insira um email válido.';
    }

    // Senha muito fraca
    if (errorMsgLower.includes('password') && 
        (errorMsgLower.includes('weak') || 
         errorMsgLower.includes('short') ||
         errorMsgLower.includes('at least'))) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }

    // Sessão expirada
    if (errorMsgLower.includes('session') && 
        (errorMsgLower.includes('expired') || errorMsgLower.includes('invalid'))) {
      return 'Sua sessão expirou. Por favor, faça login novamente.';
    }

    // Token inválido
    if (errorMsgLower.includes('token') && 
        (errorMsgLower.includes('invalid') || errorMsgLower.includes('expired'))) {
      return 'Link de confirmação inválido ou expirado. Solicite um novo email.';
    }
  }

  // ==================== ERROS DE DESAFIO ====================
  if (context === 'challenge') {
    if (errorMsgLower.includes('not found') || errorMsgLower.includes('404')) {
      return 'Desafio não encontrado. Ele pode ter sido removido ou expirado.';
    }

    if (errorMsgLower.includes('expired')) {
      return 'Este desafio expirou. Gere novos desafios na página inicial.';
    }

    if (errorMsgLower.includes('already completed')) {
      return 'Você já completou este desafio.';
    }
  }

  // ==================== ERROS DE SUBMISSÃO ====================
  if (context === 'submission') {
    if (errorMsgLower.includes('empty') || errorMsgLower.includes('required')) {
      return 'Por favor, preencha todos os campos obrigatórios antes de enviar.';
    }

    if (errorMsgLower.includes('too long') || errorMsgLower.includes('exceeds')) {
      return 'Sua resposta é muito longa. Por favor, reduza o tamanho.';
    }

    if (errorMsgLower.includes('rate limit') || errorMsgLower.includes('too many')) {
      return 'Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.';
    }
  }

  // ==================== ERROS DE VALIDAÇÃO ====================
  if (context === 'validation') {
    if (errorMsgLower.includes('email')) {
      return 'Por favor, insira um email válido.';
    }

    if (errorMsgLower.includes('password')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }

    if (errorMsgLower.includes('required')) {
      return 'Por favor, preencha todos os campos obrigatórios.';
    }
  }

  // ==================== ERROS DE CONEXÃO ====================
  if (errorMsgLower.includes('failed to fetch') || 
      errorMsgLower.includes('network request failed') ||
      errorMsgLower.includes('network error') ||
      errorMsgLower.includes('timeout') ||
      errorMsgLower.includes('timed out') ||
      errorMsgLower.includes('connection') ||
      errorMsgLower.includes('econnrefused')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // ==================== ERROS DE SERVIDOR ====================
  if (errorMsgLower.includes('500') || 
      errorMsgLower.includes('internal server') ||
      errorMsgLower.includes('server error')) {
    return 'Erro no servidor. Por favor, tente novamente em alguns instantes.';
  }

  if (errorMsgLower.includes('503') || 
      errorMsgLower.includes('service unavailable')) {
    return 'Serviço temporariamente indisponível. Tente novamente em breve.';
  }

  // ==================== ERROS DE PERMISSÃO ====================
  if (errorMsgLower.includes('unauthorized') || 
      errorMsgLower.includes('401') ||
      errorMsgLower.includes('forbidden') ||
      errorMsgLower.includes('403')) {
    return 'Você não tem permissão para realizar esta ação. Faça login novamente.';
  }

  // ==================== FALLBACK GENÉRICO ====================
  // Se chegou aqui, retorna mensagem genérica mas amigável
  return 'Ocorreu um erro inesperado. Por favor, tente novamente.';
}

/**
 * Valida email
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida senha
 * @param {string} password 
 * @returns {boolean}
 */
export function isValidPassword(password) {
  return password && password.length >= 6;
}


