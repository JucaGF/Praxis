import React, { useState, useEffect } from 'react';
import { X, Send, Clock, AlertCircle } from 'lucide-react';
import { useChallengeTimer } from '../../hooks/useChallengeTimer';
import { ChallengeTimer } from './ChallengeTimer';

export const ChallengeModal = ({ challenge, isOpen, onClose, onSubmit }) => {
  const [answer, setAnswer] = useState('');
  const { 
    status, 
    formattedTime, 
    progress, 
    isExpired,
    remainingSeconds,
  } = useChallengeTimer(challenge.id, challenge.duration_minutes);

  // Aviso quando faltam 2 minutos
  const [showWarning, setShowWarning] = useState(false);
  
  useEffect(() => {
    if (remainingSeconds <= 120 && remainingSeconds > 0 && !isExpired) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [remainingSeconds, isExpired]);

  const handleSubmit = () => {
    if (answer.trim() && !isExpired) {
      onSubmit(challenge.id, answer);
      setAnswer('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{challenge.title}</h2>
              <p className="text-gray-600">{challenge.type_label}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          
          {/* Timer no topo */}
          <div className="mt-4">
            <ChallengeTimer
              status={status}
              formattedTime={formattedTime}
              progress={progress}
              isExpired={isExpired}
            />
          </div>

          {/* Aviso de tempo */}
          {showWarning && !isExpired && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800 font-medium">
                Atenção! Menos de 2 minutos restantes!
              </span>
            </div>
          )}
        </div>

        {/* Conteúdo do desafio */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Descrição do Desafio</h3>
            <p className="text-gray-700 whitespace-pre-wrap mb-6">{challenge.description}</p>
            
            {challenge.details && (
              <>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Detalhes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{challenge.details}</p>
              </>
            )}
          </div>

          {/* Área de resposta */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sua Resposta
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isExpired}
              placeholder={isExpired ? "Tempo esgotado. Feche e tente novamente." : "Digite sua resposta aqui..."}
              className={`w-full h-48 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                isExpired ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
              }`}
            />
          </div>
        </div>

        {/* Footer com botões */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Fechar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || isExpired}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                !answer.trim() || isExpired
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Send className="w-4 h-4" />
              Enviar Resposta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
