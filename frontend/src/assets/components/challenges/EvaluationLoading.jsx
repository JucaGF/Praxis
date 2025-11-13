// src/components/challenges/EvaluationLoading.jsx
import React, { useState, useEffect } from 'react';
import { Loader2, Brain, Code, CheckCircle, Sparkles } from 'lucide-react';

const loadingMessages = [
  { icon: Brain, text: "Analisando sua solução...", duration: 3000 },
  { icon: Code, text: "Verificando qualidade do código...", duration: 3000 },
  { icon: CheckCircle, text: "Avaliando resolução do problema...", duration: 3000 },
  { icon: Sparkles, text: "Calculando sua progressão...", duration: 3000 },
];

export default function EvaluationLoading({ isOpen }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const duration = loadingMessages[currentMessageIndex].duration;
    const timeout = setTimeout(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, duration);

    return () => clearTimeout(timeout);
  }, [isOpen, currentMessageIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const start = performance.now();
    const totalDurationMs = 20000; // ~20s para chegar próximo do limite
    const maxSimulatedProgress = 96;

    const tick = () => {
      const elapsed = performance.now() - start;
      const normalizedTime = Math.min(elapsed / totalDurationMs, 1);
      const easedProgress = 1 - Math.pow(1 - normalizedTime, 3); // ease-out
      const target = Math.min(
        maxSimulatedProgress,
        easedProgress * maxSimulatedProgress
      );

      setProgress((prev) => {
        if (prev >= maxSimulatedProgress) return prev;
        const next = Math.max(prev, target);
        return Math.min(next, maxSimulatedProgress);
      });

      if (normalizedTime < 1) {
        animationFrameRef = requestAnimationFrame(tick);
      }
    };

    let animationFrameRef = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrameRef);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Reset quando abre
      setCurrentMessageIndex(0);
      setProgress(4);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const CurrentIcon = loadingMessages[currentMessageIndex].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 w-full max-w-lg mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 mb-4 relative">
            <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
            <div className="absolute inset-0 rounded-full bg-primary-500/10 animate-ping" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Avaliando sua resposta</h2>
          <p className="text-zinc-400 text-sm">
            A IA está analisando seu desafio. Isso pode levar alguns segundos...
          </p>
        </div>

        {/* Mensagem atual com animação */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
          <CurrentIcon className="w-5 h-5 text-primary-400 flex-shrink-0 animate-pulse" />
          <p className="text-zinc-200 text-sm font-medium animate-fade-in">
            {loadingMessages[currentMessageIndex].text}
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Progresso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-400 h-2.5 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Dica */}
        <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-300 text-center">
            💡 Enquanto espera: A IA avalia não só se funciona, mas também qualidade, boas práticas e clareza!
          </p>
        </div>
      </div>
    </div>
  );
}
