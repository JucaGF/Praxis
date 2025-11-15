/**
 * Logger utilitário - Sistema de logging para o frontend
 * 
 * Este módulo fornece um sistema de logging simples e centralizado
 * para o frontend da aplicação.
 * 
 * Funcionalidades:
 * - Níveis de log (debug, info, warn, error)
 * - Formatação de mensagens com timestamp
 * - Filtro por ambiente (debug desabilitado em produção)
 * - Eventos customizados
 * 
 * Níveis de log:
 * - debug: Mensagens de debug (apenas em desenvolvimento)
 * - info: Informações gerais
 * - warn: Avisos
 * - error: Erros
 * 
 * Uso:
 * ```javascript
 * import logger from './utils/logger';
 * 
 * logger.debug('Mensagem de debug');
 * logger.info('Informação importante');
 * logger.warn('Aviso');
 * logger.error('Erro');
 * logger.event('user_action', { action: 'click', target: 'button' });
 * ```
 */

/**
 * Mapa de níveis de log para métodos do console.
 * 
 * @type {Record<string, string>}
 */
const LEVEL_MAP = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

/**
 * Verifica se um nível de log deve ser registrado.
 * 
 * @param {string} level - Nível de log (debug, info, warn, error)
 * @returns {boolean} True se deve registrar, False caso contrário
 */
const shouldLog = (level) => {
  if (typeof window === 'undefined') return false;
  const env = import.meta.env.MODE || 'development';
  if (env === 'production' && level === 'debug') {
    return false;
  }
  return true;
};

/**
 * Formata uma mensagem de log com timestamp.
 * 
 * @param {string} level - Nível de log
 * @param {string} message - Mensagem a formatar
 * @returns {string} Mensagem formatada
 */
const formatMessage = (level, message) => {
  const ts = new Date().toISOString();
  return `[Praxis][${level.toUpperCase()}][${ts}] ${message}`;
};

/**
 * Emite uma mensagem de log no console.
 * 
 * @param {string} level - Nível de log
 * @param {string} message - Mensagem a logar
 * @param {...any} details - Detalhes adicionais
 */
const emit = (level, message, ...details) => {
  if (!shouldLog(level)) return;
  const consoleMethod = LEVEL_MAP[level] || 'log';
  console[consoleMethod](formatMessage(level, message), ...details);
};

/**
 * Logger utilitário para o frontend.
 * 
 * Fornece métodos para logging em diferentes níveis,
 * além de um método especial para eventos.
 * 
 * @type {Object}
 * @property {function(string, ...any): void} debug - Log de debug
 * @property {function(string, ...any): void} info - Log de informação
 * @property {function(string, ...any): void} warn - Log de aviso
 * @property {function(string, ...any): void} error - Log de erro
 * @property {function(string, Object): void} event - Log de evento
 */
const logger = {
  /**
   * Registra uma mensagem de debug.
   * 
   * Apenas em desenvolvimento (desabilitado em produção).
   * 
   * @param {string} message - Mensagem de debug
   * @param {...any} details - Detalhes adicionais
   */
  debug: (message, ...details) => emit('debug', message, ...details),
  
  /**
   * Registra uma mensagem de informação.
   * 
   * @param {string} message - Mensagem de informação
   * @param {...any} details - Detalhes adicionais
   */
  info: (message, ...details) => emit('info', message, ...details),
  
  /**
   * Registra uma mensagem de aviso.
   * 
   * @param {string} message - Mensagem de aviso
   * @param {...any} details - Detalhes adicionais
   */
  warn: (message, ...details) => emit('warn', message, ...details),
  
  /**
   * Registra uma mensagem de erro.
   * 
   * @param {string} message - Mensagem de erro
   * @param {...any} details - Detalhes adicionais
   */
  error: (message, ...details) => emit('error', message, ...details),
  
  /**
   * Registra um evento customizado.
   * 
   * Útil para rastreamento de ações do usuário.
   * 
   * @param {string} name - Nome do evento
   * @param {Object} payload - Payload do evento (opcional)
   */
  event: (name, payload = {}) =>
    emit('info', `event:${name}`, payload),
};

export default logger;


