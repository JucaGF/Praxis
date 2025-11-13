// src/pages/ChallengeResult.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Trophy, TrendingUp, TrendingDown, Minus, ArrowLeft, History, RefreshCw } from "lucide-react";

export default function ChallengeResult() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { result, challenge, timeTaken } = location.state || {};
  
  // Se não houver dados, redirecionar
  if (!result || !challenge) {
    navigate('/home');
    return null;
  }
  
  // Dispara evento para recarregar dados na home quando navega de volta
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Dispara evento para recarregar dados na home
      window.dispatchEvent(new Event('reloadHomeData'));
    };
    
    // Quando o componente desmonta (navega para outra página), dispara o evento
    return () => {
      handleBeforeUnload();
    };
  }, []);

  // Adaptar formato do backend
  // Backend retorna: { submission_id, status, score, metrics, feedback, target_skill, delta_applied, updated_skill_value }
  const feedbackData = {
    nota_geral: result.score || 0,
    metricas: result.metrics || {},
    feedback_detalhado: result.feedback || "Sem feedback disponível"
  };
  
  // Construir skill_changes se houver progressão
  const skill_changes = [];
  
  // NOVO FORMATO: Múltiplas skills
  if (result.skills_progression) {
    const { deltas, new_values } = result.skills_progression;
    
    Object.keys(deltas || {}).forEach(skill_name => {
      const delta = deltas[skill_name];
      const new_value = new_values[skill_name];
      const old_value = new_value - delta;
      
      skill_changes.push({
        skill_name,
        old_value,
        new_value
      });
    });
  }
  // FALLBACK: Formato antigo (1 skill) para compatibilidade
  else if (result.target_skill && result.delta_applied !== null && result.updated_skill_value !== null) {
    const oldValue = result.updated_skill_value - result.delta_applied;
    skill_changes.push({
      skill_name: result.target_skill,
      old_value: oldValue,
      new_value: result.updated_skill_value
    });
  }
  
  const { nota_geral, metricas, feedback_detalhado } = feedbackData;
  
  // Formatar tempo gasto
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Determinar cor baseada na nota
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "bg-blue-500/10 border-blue-500/30";
    if (score >= 40) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar para Home</span>
          </Link>
          <h1 className="text-lg font-bold">Resultado da Avaliação</h1>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Challenge Info Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{challenge.title}</h2>
              <div className="flex items-center gap-4 text-sm text-zinc-400">
                <span className="flex items-center gap-1">
                  🏷️ {challenge.category}
                </span>
                <span className="flex items-center gap-1">
                  ⏱️ Tempo: {formatTime(timeTaken)}
                </span>
                <span className="flex items-center gap-1">
                  📊 {challenge.difficulty?.level || 'Médio'}
                </span>
              </div>
            </div>
            <div className={`flex items-center justify-center w-24 h-24 rounded-2xl border-2 ${getScoreBg(nota_geral)}`}>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(nota_geral)}`}>
                  {nota_geral}
                </div>
                <div className="text-xs text-zinc-500 mt-1">/ 100</div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(metricas || {}).map(([key, value]) => {
            const metricNames = {
              corretude: 'Corretude',
              qualidade_codigo: 'Qualidade do Código',
              boas_praticas: 'Boas Práticas',
              empatia: 'Empatia',
              clareza: 'Clareza',
              profissionalismo: 'Profissionalismo',
              escalabilidade: 'Escalabilidade',
              viabilidade: 'Viabilidade',
              trade_offs: 'Trade-offs'
            };
            
            const displayName = metricNames[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            return (
              <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-300">{displayName}</span>
                  <span className={`text-lg font-bold ${getScoreColor(value)}`}>{value}</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      value >= 80 ? 'bg-emerald-500' :
                      value >= 60 ? 'bg-blue-500' :
                      value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${value}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Feedback */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            💬 Feedback Detalhado
          </h3>
          <div className="prose prose-invert max-w-none">
            <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {feedback_detalhado}
            </div>
          </div>
        </div>

        {/* Skill Progression */}
        {skill_changes && skill_changes.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              📈 Progressão de Habilidades
            </h3>
            <div className="space-y-4">
              {skill_changes.map((change, idx) => {
                const delta = change.new_value - change.old_value;
                const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
                const colorClass = delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-zinc-400';
                
                return (
                  <div key={idx} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-white">{change.skill_name}</span>
                        <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                          <span>{delta > 0 ? '+' : ''}{delta.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                            <span>Anterior: {change.old_value.toFixed(1)}</span>
                            <span>Atual: {change.new_value.toFixed(1)}</span>
                          </div>
                          <div className="relative w-full bg-zinc-700 rounded-full h-2">
                            {/* Barra antiga (fundo) */}
                            <div
                              className="absolute h-2 rounded-full bg-zinc-600"
                              style={{ width: `${change.old_value}%` }}
                            ></div>
                            {/* Barra nova (frente) */}
                            <div
                              className={`absolute h-2 rounded-full transition-all ${
                                delta > 0 ? 'bg-emerald-500' : delta < 0 ? 'bg-red-500' : 'bg-zinc-500'
                              }`}
                              style={{ width: `${change.new_value}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/perfil#historico"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-zinc-900 font-semibold rounded-lg hover:bg-primary-600 transition"
          >
            <History className="w-5 h-5" />
            Ver Histórico Completo
          </Link>
          <button
            onClick={() => navigate('/home')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-zinc-300 font-semibold rounded-lg hover:bg-zinc-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Home
          </button>
        </div>

        {/* Motivational Message */}
        <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 border border-primary-500/30 rounded-xl p-6 text-center">
          <p className="text-lg text-zinc-300">
            {nota_geral >= 80 
              ? "🎉 Excelente trabalho! Continue assim e suas habilidades vão decolar!"
              : nota_geral >= 60
              ? "👏 Bom trabalho! Você está no caminho certo. Continue praticando!"
              : nota_geral >= 40
              ? "💪 Continue se esforçando! Cada desafio é uma oportunidade de aprender."
              : "📚 Não desanime! Aprender é um processo. Revise o feedback e tente novamente!"
            }
          </p>
        </div>
      </div>
    </div>
  );
}
