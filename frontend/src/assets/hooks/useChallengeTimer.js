import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'praxis_challenge_timers';

// Status possíveis do desafio
export const ChallengeStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  EXPIRED: 'expired',
  COMPLETED: 'completed', // Para uso futuro
};

// Carregar timers do localStorage
const loadTimers = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Erro ao carregar timers:', error);
    return {};
  }
};

// Salvar timers no localStorage
const saveTimers = (timers) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  } catch (error) {
    console.error('Erro ao salvar timers:', error);
  }
};

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
