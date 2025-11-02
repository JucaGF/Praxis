// src/components/challenges/OrganizationChallenge.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function OrganizationChallenge({ challenge }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(challenge.difficulty.time_limit * 60);
  const [answers, setAnswers] = useState({
    architecture: "",
    stack: "",
    justification: ""
  });
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    if (!answers.architecture.trim() || !answers.stack.trim() || !answers.justification.trim()) {
      alert("Preencha todas as seções antes de enviar.");
      return;
    }
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    console.log({
      challenge_id: challenge.id,
      submitted_content: answers,
      notes,
      time_taken_sec: (challenge.difficulty.time_limit * 60) - timeLeft
    });
    alert("Design enviado! (mock)");
    navigate("/home");
  };

  const requirements = challenge.description?.requirements || [
    "Suportar 100.000 requisições por segundo",
    "Latência máxima de resposta: 10ms",
    "Disponibilidade de 99.99%",
    "Capacidade de armazenar 1TB de dados",
    "Suporte para invalidação de cache em tempo real",
    "Tolerância a falhas de nós individuais"
  ];

  const constraints = challenge.description?.constraints || [
    "Budget limitado: priorizar soluções cost-effective",
    "Deve integrar com infraestrutura AWS existente",
    "Equipe pequena de operações: priorizar soluções managed"
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/home" className="text-zinc-400 hover:text-white transition">
              ← Voltar
            </Link>
            <div className="w-px h-6 bg-zinc-700"></div>
            <h1 className="text-lg font-semibold">{challenge.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-zinc-500">Tempo restante</p>
              <p className={`text-lg font-mono font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-primary-400'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-primary-500 text-zinc-900 rounded-lg font-semibold hover:bg-primary-600 transition"
            >
              Enviar Design
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto grid grid-cols-[320px_1fr] gap-6 p-6">
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <h2 className="font-semibold mb-3">Requisitos</h2>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Requisitos Funcionais</h3>
              <ul className="space-y-2">
                {requirements.map((req, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="text-primary-500">•</span>
                    <span className="text-zinc-300">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Restrições</h3>
              <ul className="space-y-2">
                {constraints.map((constraint, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="text-primary-500">•</span>
                    <span className="text-zinc-300">{constraint}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            {challenge.description?.summary || "Projete a arquitetura de um sistema de cache distribuído com requisitos de alta performance"}
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl font-bold text-primary-500">1.</span>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Descreva a Arquitetura do Sistema</h3>
                <p className="text-sm text-zinc-400 mb-3">
                  Descreva os principais componentes da arquitetura, como eles se comunicam e como os dados fluem pelo sistema.
                  Inclua camadas, serviços, bancos de dados, caches, load balancers, etc.
                </p>
              </div>
            </div>
            <textarea
              value={answers.architecture}
              onChange={(e) => setAnswers({...answers, architecture: e.target.value})}
              placeholder="Ex: A arquitetura consiste em três camadas principais: camada de aplicação (servidores web), camada de cache (Redis cluster), e camada de dados (PostgreSQL)..."
              rows={8}
              className="w-full bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <p className="text-xs text-zinc-500 mt-2">{answers.architecture.length} caracteres (mínimo 100)</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl font-bold text-primary-500">2.</span>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Stack Tecnológica</h3>
                <p className="text-sm text-zinc-400 mb-3">
                  Liste as tecnologias específicas que você usaria (ex: Redis, ElastiCache, CloudWatch, ALB, etc.) e explique
                  brevemente por que escolheu cada uma.
                </p>
              </div>
            </div>
            <textarea
              value={answers.stack}
              onChange={(e) => setAnswers({...answers, stack: e.target.value})}
              placeholder={`Ex: 
- Redis Cluster: para cache distribuído com alta disponibilidade
- AWS ElastiCache: serviço managed que reduz overhead operacional
- CloudWatch: monitoramento e alertas...`}
              rows={6}
              className="w-full bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <p className="text-xs text-zinc-500 mt-2">{answers.stack.length} caracteres (mínimo 30)</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl font-bold text-primary-500">3.</span>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Justificativa e Trade-offs</h3>
                <p className="text-sm text-zinc-400 mb-3">
                  Explique as principais decisões de design, os trade-offs considerados e como sua solução atende aos requisitos.
                  Discuta escalabilidade, custos, complexidade operacional, etc.
                </p>
              </div>
            </div>
            <textarea
              value={answers.justification}
              onChange={(e) => setAnswers({...answers, justification: e.target.value})}
              placeholder="Ex: Optei por Redis Cluster ao invés de Memcached porque oferece persistência e estruturas de dados mais ricas. O trade-off é maior complexidade, mas isso é mitigado usando ElastiCache..."
              rows={8}
              className="w-full bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <p className="text-xs text-zinc-500 mt-2">{answers.justification.length} caracteres (mínimo 100)</p>
          </div>
        </div>
      </div>
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-2">Design Concluído!</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Sua solução de arquitetura será revisada por especialistas. Você receberá feedback sobre escalabilidade,
              trade-offs e decisões técnicas.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-1">Observações (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dúvidas, pontos que gostaria de feedback específico, etc."
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-4 py-2 bg-primary-500 text-zinc-900 font-semibold rounded-lg hover:bg-primary-600 transition"
              >
                Finalizar e Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
