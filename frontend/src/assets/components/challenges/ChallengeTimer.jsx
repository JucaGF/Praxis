import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ChallengeStatus } from '../../hooks/useChallengeTimer';

export const ChallengeTimer = ({ status, formattedTime, progress, isExpired, isCompleted, className = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case ChallengeStatus.IN_PROGRESS:
        return {
          icon: Clock,
          text: 'Em andamento',
          textColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          progressColor: isExpired ? 'bg-red-500' : 'bg-blue-500',
        };
      case ChallengeStatus.EXPIRED:
        return {
          icon: XCircle,
          text: 'Tempo esgotado',
          textColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          progressColor: 'bg-red-500',
        };
      case ChallengeStatus.COMPLETED:
        return {
          icon: CheckCircle,
          text: 'Concluído',
          textColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          progressColor: 'bg-green-500',
        };
      default:
        return {
          icon: AlertCircle,
          text: 'Não iniciado',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          progressColor: 'bg-gray-500',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.textColor}`} />
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.text}
          </span>
        </div>
        {(status === ChallengeStatus.IN_PROGRESS || status === ChallengeStatus.EXPIRED) && (
          <span className={`text-sm font-mono font-bold ${config.textColor}`}>
            {formattedTime}
          </span>
        )}
      </div>
      
      {(status === ChallengeStatus.IN_PROGRESS || status === ChallengeStatus.EXPIRED) && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${config.progressColor} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};
