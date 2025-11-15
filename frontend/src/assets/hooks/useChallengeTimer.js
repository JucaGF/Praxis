/**
 * Hook useChallengeTimer - Gerenciamento de timer de desafios
 * 
 * Este hook gerencia o estado e o timer de um desafio específico.
 * Mantém o estado no localStorage para persistência entre recarregamentos.
 * 
 * Funcionalidades:
 * - Timer em tempo real (atualiza a cada segundo)
 * - Persistência no localStorage
 * - Status do desafio (not_started, in_progress, expired, completed)
 * - Formatação de tempo (MM:SS ou H:MM:SS)
 * - Progresso visual (percentual)
 * - Controle de início, reset e conclusão
 * 
 * Uso:
 * ```javascript
 * import { useChallengeTimer, ChallengeStatus } from '../hooks/useChallengeTimer';
 * 
 * const {
 *   status,
 *   formattedTime,
 *   progress,
 *   isExpired,
 *   isInProgress,
 *   startChallenge,
 *   resetChallenge,
 * } = useChallengeTimer(challengeId, durationMinutes);
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Chave do localStorage para armazenar timers.
 * 
 * @type {string}
 */
const STORAGE_KEY = 'praxis_challenge_timers';

/**
 * Status possíveis do desafio.
 * 
 * @type {Object}
 * @property {string} NOT_STARTED - Desafio não iniciado
 * @property {string} IN_PROGRESS - Desafio em progresso
 * @property {string} EXPIRED - Tempo expirado
 * @property {string} COMPLETED - Desafio completado
 */
export const ChallengeStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  EXPIRED: 'expired',
  COMPLETED: 'completed', // Para uso futuro
};

/**
 * Carrega timers do localStorage.
 * 
 * @returns {Object} Dicionário com timers de desafios
 */
const loadTimers = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Erro ao carregar timers:', error);
    return {};
  }
};

/**
 * Salva timers no localStorage.
 * 
 * @param {Object} timers - Dicionário com timers de desafios
 */
const saveTimers = (timers) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  } catch (error) {
    console.error('Erro ao salvar timers:', error);
  }
};

/**
 * Hook para gerenciar o timer de um desafio.
 * 
 * Este hook gerencia o estado e o timer de um desafio específico.
 * Mantém o estado no localStorage para persistência entre recarregamentos.
 * 
 * @param {number|string} challengeId - ID do desafio
 * @param {number} durationMinutes - Duração do desafio em minutos
 * @returns {Object} Objeto com estado e funções do timer
 * @property {string} status - Status atual do desafio
 * @property {number} elapsedSeconds - Segundos decorridos
 * @property {number} remainingSeconds - Segundos restantes
 * @property {string} formattedTime - Tempo formatado (MM:SS ou H:MM:SS)
 * @property {number} progress - Progresso do timer (0-100)
 * @property {number|null} completedAt - Timestamp de conclusão (null se não completado)
 * @property {function(): void} startChallenge - Inicia o desafio
 * @property {function(): void} resetChallenge - Reseta o desafio (tentar novamente)
 * @property {function(): void} completeChallenge - Marca o desafio como completado
 * @property {boolean} isExpired - True se o tempo expirou
 * @property {boolean} isInProgress - True se o desafio está em progresso
 * @property {boolean} isCompleted - True se o desafio foi completado
 * @property {boolean} isNotStarted - True se o desafio não foi iniciado
 */
export const useChallengeTimer = (challengeId, durationMinutes) => {
  const [timers, setTimers] = useState(loadTimers);
  const intervalRef = useRef(null);

  // Obter dados do desafio específico
  const challengeData = timers[challengeId] || {
    status: ChallengeStatus.NOT_STARTED,
    startTime: null,
    elapsedSeconds: 0,
    durationMinutes: durationMinutes,
  };

  const { status, startTime, elapsedSeconds } = challengeData;
  const totalSeconds = durationMinutes * 60;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

  // Iniciar desafio
  const startChallenge = useCallback(() => {
    const now = Date.now();
    setTimers((prev) => {
      const updated = {
        ...prev,
        [challengeId]: {
          status: ChallengeStatus.IN_PROGRESS,
          startTime: now,
          elapsedSeconds: 0,
          durationMinutes: durationMinutes,
        },
      };
      saveTimers(updated);
      return updated;
    });
  }, [challengeId, durationMinutes]);

  // Retomar desafio (recalcula tempo decorrido)
  const updateElapsedTime = useCallback(() => {
    if (status === ChallengeStatus.IN_PROGRESS && startTime) {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      
      setTimers((prev) => {
        const updated = { ...prev };
        const currentChallenge = updated[challengeId];
        
        if (currentChallenge) {
          currentChallenge.elapsedSeconds = elapsed;
          
          // Verificar se o tempo expirou
          if (elapsed >= totalSeconds) {
            currentChallenge.status = ChallengeStatus.EXPIRED;
            currentChallenge.elapsedSeconds = totalSeconds;
          }
          
          saveTimers(updated);
        }
        
        return updated;
      });
    }
  }, [challengeId, status, startTime, totalSeconds]);

  // Atualizar tempo a cada segundo
  useEffect(() => {
    if (status === ChallengeStatus.IN_PROGRESS) {
      updateElapsedTime();
      
      intervalRef.current = setInterval(() => {
        updateElapsedTime();
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [status, updateElapsedTime]);

  // Resetar desafio (tentar novamente)
  // IMPORTANTE: Não reseta se o desafio foi completado (status vem do backend)
  const resetChallenge = useCallback(() => {
    setTimers((prev) => {
      const currentChallenge = prev[challengeId];
      // Se o desafio foi completado, não reseta (status vem do backend)
      if (currentChallenge?.status === ChallengeStatus.COMPLETED) {
        return prev;
      }
      const updated = { ...prev };
      delete updated[challengeId];
      saveTimers(updated);
      return updated;
    });
  }, [challengeId]);

  // Marcar como concluído (resultado fica no banco)
  const completeChallenge = useCallback(() => {
    setTimers((prev) => {
      const updated = {
        ...prev,
        [challengeId]: {
          ...prev[challengeId],
          status: ChallengeStatus.COMPLETED,
          completedAt: Date.now(),
        },
      };
      saveTimers(updated);
      return updated;
    });
  }, [challengeId]);

  // Formatar tempo restante
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // Se tiver mais de 1 hora, mostrar formato H:MM:SS
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Senão, mostrar formato MM:SS
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    status,
    elapsedSeconds,
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    progress: (elapsedSeconds / totalSeconds) * 100,
    completedAt: challengeData.completedAt || null,
    startChallenge,
    resetChallenge,
    completeChallenge,
    isExpired: status === ChallengeStatus.EXPIRED,
    isInProgress: status === ChallengeStatus.IN_PROGRESS,
    isCompleted: status === ChallengeStatus.COMPLETED,
    isNotStarted: status === ChallengeStatus.NOT_STARTED,
  };
};
