import React from 'react';
import { Clock, Code, Users, CheckSquare } from 'lucide-react';
import { useChallengeTimer, ChallengeStatus } from '../../hooks/useChallengeTimer';
import { ChallengeTimer } from './ChallengeTimer';

export const ChallengeCard = ({ challenge, onStart, onRetry }) => {
  const { 
    status, 
    formattedTime, 
    progress, 
    isExpired, 
    isInProgress,
    isCompleted,
    isNotStarted,
    startChallenge,
    resetChallenge 
  } = useChallengeTimer(challenge.id, challenge.duration_minutes);

  const getChallengeIcon = () => {
    switch (challenge.type) {
      case 'code':
        return Code;
      case 'organization':
        return Users;
      case 'daily_task':
        return CheckSquare;
      default:
        return Code;
    }
  };

  const Icon = getChallengeIcon();

  const handleStartClick = () => {
    if (isNotStarted) {
      startChallenge();
    }
    onStart(challenge);
  };

  const handleRetryClick = () => {
    resetChallenge();
    startChallenge();
    onStart(challenge);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-800">{challenge.title}</h3>
            <p className="text-sm text-gray-500">{challenge.type_label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{challenge.duration_minutes} min</span>
        </div>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-2">{challenge.description}</p>

      {/* Mostrar timer se o desafio foi iniciado */}
      {!isNotStarted && (
        <ChallengeTimer
          status={status}
          formattedTime={formattedTime}
          progress={progress}
          isExpired={isExpired}
          isCompleted={isCompleted}
          className="mb-4"
        />
      )}

      {/* Botões de ação */}
      <div className="flex gap-2">
        {isNotStarted && (
          <button
            onClick={handleStartClick}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Iniciar Desafio
          </button>
        )}

        {isInProgress && (
          <button
            onClick={handleStartClick}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continuar Desafio
          </button>
        )}

        {isExpired && (
          <button
            onClick={handleRetryClick}
            className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Tentar Novamente
          </button>
        )}

        {isCompleted && (
          <button
            onClick={handleStartClick}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Ver Resultado
          </button>
        )}
      </div>
    </div>
  );
};
