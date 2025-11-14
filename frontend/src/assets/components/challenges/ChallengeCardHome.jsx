// src/components/challenges/ChallengeCardHome.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useChallengeTimer, ChallengeStatus } from '../../hooks/useChallengeTimer';
import { Difficulty, Meta, Skill, Card } from '../ui';
import { fetchChallengeResult } from '../../lib/api';

// Ícone baseado na categoria
function getChallengeIcon(category) {
  const icons = {
    'code': '{ }',
    'daily-task': '✉',
    'organization': '◇'
  };
  return icons[category] || '●';
}

// Nome amigável da categoria
function getChallengeCategoryName(category) {
  const names = {
    'code': 'Código',
    'daily-task': 'Comunicação',
    'organization': 'Planejamento'
  };
  return names[category] || 'Desafio';
}

export default function ChallengeCardHome({ challenge, expanded, onToggle }) {
  const { 
    status: timerStatus, 
    formattedTime, 
    progress,
    isExpired, 
    isInProgress,
    isCompleted: timerCompleted,
    isNotStarted,
    startChallenge,
    resetChallenge
  } = useChallengeTimer(challenge.id, challenge.duration_minutes || 60  );

  // Verifica se o desafio foi concluído (via backend ou timer)
  const isCompleted = challenge.status === 'completed' || timerCompleted;

  const [result, setResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);

  // Buscar resultado do banco quando o desafio estiver completado
  // Usa useRef para evitar múltiplas requisições
  const hasFetchedRef = useRef(false);
  
  useEffect(() => {
    // Se já temos dados da submissão no challenge, usa eles (não precisa buscar)
    if (challenge.submission && !result) {
      setResult({
        score: challenge.submission.score || challenge.submission.points,
        target_skill: challenge.submission.tags,
        delta_applied: null,
      });
      hasFetchedRef.current = true;
      return;
    }

    // Caso contrário, busca do backend apenas uma vez
    if (isCompleted && !result && !loadingResult && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      setLoadingResult(true);
      fetchChallengeResult(challenge.id)
        .then((submissions) => {
          // Pegar a última submissão (mais recente)
          if (submissions && submissions.length > 0) {
            const latest = submissions[0];
            setResult({
              score: latest.score || latest.points,
              target_skill: latest.tags,
              delta_applied: null, // Não temos essa info na lista
            });
          }
        })
        .catch((err) => {
          console.error("Erro ao buscar resultado:", err);
          hasFetchedRef.current = false; // Permite retentar em caso de erro
        })
        .finally(() => {
          setLoadingResult(false);
        });
    }
  }, [isCompleted, challenge.id, challenge.submission, result, loadingResult]);
  
  // Reset ref quando o challenge muda
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [challenge.id]);

  const handleStartClick = (e) => {
    e.stopPropagation();
    if (isNotStarted) {
      startChallenge();
    }
    // Navegação será tratada pelo Link
  };

  const handleRetryClick = (e) => {
    e.stopPropagation();
    resetChallenge();
    startChallenge();
    // Navegação será tratada pelo Link
  };

  // Status badge
  const getStatusBadge = () => {
    // Se o desafio foi concluído (backend), sempre mostra como concluído
    if (isCompleted) {
      const score = challenge.submission?.score || challenge.submission?.points || result?.score;
      return (
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200 mb-3">
          <span>Concluído</span>
          {score && (
            <span className="font-bold">{score}/100</span>
          )}
        </div>
      );
    }

    if (isNotStarted) return null;
    
    const statusConfig = {
      [ChallengeStatus.IN_PROGRESS]: {
        text: 'Em andamento',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
      },
      [ChallengeStatus.EXPIRED]: {
        text: 'Tempo esgotado',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
      },
      [ChallengeStatus.COMPLETED]: {
        text: 'Concluído',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
      },
    };

    const config = statusConfig[timerStatus] || {};
    
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} mb-3`}>
        <span>{config.text}</span>
        {(isInProgress || isExpired) && (
          <span className="font-mono font-bold">{formattedTime}</span>
        )}
        {isCompleted && result && (
          <span className="font-bold">{result.score}/100</span>
        )}
      </div>
    );
  };

  // Timer progress bar (se estiver em progresso ou expirado, mas NÃO completado)
  const getTimerProgressBar = () => {
    // Não mostra barra se o desafio foi completado
    if (isCompleted) return null;
    
    // Mostra apenas se estiver em progresso ou expirado
    if (!isInProgress && !isExpired) return null;

    return (
      <div className="mb-3">
        <div className="w-full bg-zinc-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              isExpired ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <Card
      role="button"
      aria-expanded={expanded}
      onClick={onToggle}
      className={
        "p-5 cursor-pointer transition-all duration-300 ease-in-out animate-fade-in " +
        (expanded 
          ? "ring-2 ring-primary-300" 
          : "hover:scale-[1.02]")
      }
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-primary-100 text-primary-800 grid place-content-center border border-primary-200 text-sm font-semibold">
            {getChallengeIcon(challenge.category)}
          </div>
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            {getChallengeCategoryName(challenge.category)}
          </span>
        </div>
        <Difficulty level={challenge.difficulty} />
      </div>

      {/* Status badge e timer */}
      {getStatusBadge()}
      {getTimerProgressBar()}

      {/* Resultado visual (se completado) */}
      {isCompleted && result && (
        <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-green-700 mb-1">Nota Final</div>
              <div className="text-2xl font-bold text-green-800">{result.score}<span className="text-sm text-green-600">/100</span></div>
            </div>
            {result.target_skill && result.delta_applied !== null && (
              <div className="text-right">
                <div className="text-xs font-medium text-green-700 mb-1">{result.target_skill}</div>
                <div className={`text-lg font-bold ${result.delta_applied >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {result.delta_applied >= 0 ? '+' : ''}{result.delta_applied}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <h3 className="mt-4 text-lg font-semibold text-zinc-900">{challenge.title}</h3>
      <p className="mt-1.5 text-sm text-zinc-600">{challenge.desc}</p>

      <div className="mt-4"><Meta icon="⏲️">{challenge.time}</Meta></div>

      <div className="mt-3 flex flex-wrap gap-2">
        {challenge.skills.map((s) => <Skill key={s}>{s}</Skill>)}
      </div>

      {/* Área extra quando expandido */}
      {expanded && (
        <div className="pt-4 mt-4 border-t border-zinc-200">
          <p className="text-sm text-zinc-700">
            <span className="font-medium">Objetivo:</span> resolver o desafio aplicando as skills acima e
            registrando suas decisões técnicas.
          </p>

          <div className="mt-3 grid gap-2 text-sm text-zinc-700">
            <div>
              <span className="font-medium">Pré-requisitos:</span>{" "}
              {challenge.skills.join(", ")}
            </div>
            <div>
              <span className="font-medium">O que será avaliado:</span> clareza do código, testes básicos,
              comunicação (README) e performance quando aplicável.
            </div>
            <div>
              <span className="font-medium">Passos sugeridos:</span> entender o bug/feature, planejar,
              implementar, testar e documentar.
            </div>
          </div>

          {/* Ações extras quando expandido */}
          <div className="mt-5 flex flex-wrap gap-3">
            {isNotStarted && (
              <Link to={`/desafio/${challenge.id}`} onClick={handleStartClick}>
                <button className="rounded-lg px-4 py-2.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer">
                  Começar desafio
                </button>
              </Link>
            )}

            {isInProgress && (
              <Link to={`/desafio/${challenge.id}`} onClick={(e) => e.stopPropagation()}>
                <button className="rounded-lg px-4 py-2.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer">
                  Continuar desafio
                </button>
              </Link>
            )}

            {isExpired && (
              <Link to={`/desafio/${challenge.id}`} onClick={handleRetryClick}>
                <button className="rounded-lg px-4 py-2.5 text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 transition cursor-pointer">
                  Tentar novamente
                </button>
              </Link>
            )}

            {isCompleted && (
              <Link to={`/desafio/${challenge.id}`} onClick={(e) => e.stopPropagation()}>
                <button className="rounded-lg px-4 py-2.5 text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition cursor-pointer">
                  Ver resultado
                </button>
              </Link>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="rounded-lg px-4 py-2.5 text-sm font-medium border border-zinc-200 hover:bg-zinc-50 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
