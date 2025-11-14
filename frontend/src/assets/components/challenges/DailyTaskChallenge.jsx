// src/components/challenges/DailyTaskChallenge.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useChallengeTimer } from "../../hooks/useChallengeTimer";
import { submitSolution } from "../../lib/api";
import { prepareDailyTaskSubmission, validateSubmission, getValidationMessage } from "../../utils/submissionHelpers";
import EvaluationLoading from "./EvaluationLoading";
import logger from "../../utils/logger";

export default function DailyTaskChallenge({ challenge }) {
  const navigate = useNavigate();
  
  // Debug: ver estrutura do enunciado
  
  // Usar o hook de timer persistente
  const durationMinutes = challenge.difficulty?.time_limit || 120;
  const { 
    remainingSeconds,
    formattedTime,
    isExpired,
    isInProgress,
    startChallenge,
    completeChallenge
  } = useChallengeTimer(challenge.id, durationMinutes);
  
  const [responseText, setResponseText] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState(null);

  // Inicia o desafio automaticamente se ainda não foi iniciado
  useEffect(() => {
    if (!isInProgress && !isExpired) {
      startChallenge();
    }
  }, [isInProgress, isExpired, startChallenge]);

  const handleSubmit = () => {
    if (!responseText.trim()) {
      alert("Escreva sua resposta antes de enviar.");
      return;
    }
    setShowSubmitModal(true);
  };

  const confirmSubmit = async () => {
    setError(null);
    
    // Validar submissão
    const isValid = validateSubmission('dailytask', { content: responseText });
    if (!isValid) {
      setError(getValidationMessage('dailytask'));
      return;
    }
    
    setIsSubmitting(true);
    setShowSubmitModal(false);
    
    try {
      // Calcular tempo gasto
      const timeTakenSeconds = (durationMinutes * 60) - remainingSeconds;
      
      // Preparar dados da submissão
      const submissionData = prepareDailyTaskSubmission({
        challengeId: challenge.id,
        content: responseText,
        timeTaken: timeTakenSeconds,
        notes
      });
      
      logger.info("daily-task:submission:start", {
        challengeId: challenge.id,
        contentLength: submissionData.submitted_code?.content?.length || 0,
        timeTakenSeconds,
      });
      
      // Enviar para o backend
      setIsEvaluating(true);
      const result = await submitSolution(submissionData);
      
      logger.info("daily-task:submission:success", {
        challengeId: challenge.id,
        submissionId: result?.submission_id,
        status: result?.status,
      });
      
      // Marcar desafio como completado (resultado já está no banco)
      completeChallenge();
      
      // Dispara evento para recarregar dados na home e no perfil
      window.dispatchEvent(new Event('reloadHomeData'));
      window.dispatchEvent(new Event('reloadProfileData'));
      
      // Navegar para a página de resultado com os dados
      navigate('/challenge-result', { 
        state: { 
          result,
          challenge,
          timeTaken: timeTakenSeconds
        } 
      });
      
    } catch (err) {
      logger.error("daily-task:submission:error", {
        challengeId: challenge.id,
        error: err,
      });
      
      // Mensagens mais específicas baseadas no tipo de erro
      let errorMessage = "Erro ao avaliar o desafio. Tente novamente.";
      
      if (err.isServiceUnavailable || err.status === 503) {
        errorMessage = "O serviço de avaliação está temporariamente indisponível. Por favor, aguarde alguns instantes e tente novamente.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsEvaluating(false);
      setIsSubmitting(false);
    }
  };

  const applyFormatting = (format) => {
    const textarea = document.getElementById("richTextEditor");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = responseText.substring(start, end);
    
    if (!selectedText) return;

    let formattedText = selectedText;
    if (format === 'bold') formattedText = `**${selectedText}**`;
    if (format === 'italic') formattedText = `*${selectedText}*`;
    
    const newText = responseText.substring(0, start) + formattedText + responseText.substring(end);
    setResponseText(newText);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/home" className="text-zinc-400 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="w-px h-6 bg-zinc-700"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-500 rounded flex items-center justify-center">
                <span className="text-zinc-900 text-sm">📄</span>
              </div>
              <h1 className="text-lg font-semibold">{challenge.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-zinc-500">Tempo restante</p>
              <p className={`text-lg font-mono font-bold ${remainingSeconds < 300 ? 'text-red-400' : isExpired ? 'text-red-500' : 'text-primary-400'}`}>
                {formattedTime}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isExpired}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                isExpired 
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' 
                  : 'bg-primary-500 text-zinc-900 hover:bg-primary-600'
              }`}
            >
              <span>📨</span> {isExpired ? 'Tempo Esgotado' : 'Enviar para Revisão'}
            </button>
          </div>
        </div>
      </header>

      {/* Main layout: 3 columns */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6 p-6 h-[calc(100vh-80px)]">
        
        {/* Left sidebar - Task details with checkboxes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-sm">
                A
              </div>
              <div className="text-sm">
                <p className="font-medium">Gerente de Projeto</p>
                <p className="text-zinc-500 text-xs">Atua</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {challenge.description?.context || challenge.description?.details || challenge.description?.text || "Complete a tarefa seguindo as instruções."}
            </p>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-primary-500">⚡</span>
              <h3 className="font-semibold text-sm">Detalhes da Tarefa</h3>
            </div>
            <div className="space-y-2">
              {(challenge.description?.objectives || [
                "Ser empático e compreensivo",
                "Resolver o problema apresentado",
                "Manter tom profissional e amigável"
              ]).map((objective, idx) => (
                <label key={idx} className="flex items-start gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-zinc-400 group-hover:text-zinc-300">{objective}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4 mt-4">
            <h3 className="font-semibold text-sm mb-2">📧 E-mail do Cliente</h3>
            {challenge.description?.enunciado?.type === 'email' ? (
              <>
                <div className="bg-zinc-800 rounded p-3 text-xs space-y-1">
                  <p><span className="text-zinc-500">De:</span> {challenge.description.enunciado.de || "cliente@email.com"}</p>
                  <p><span className="text-zinc-500">Assunto:</span> {challenge.description.enunciado.assunto || "Assunto do email"}</p>
                  <p><span className="text-zinc-500">Data:</span> {challenge.description.enunciado.data || "Data"}</p>
                </div>
                <div className="mt-3 bg-zinc-800/50 rounded p-3 text-xs text-zinc-400 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {challenge.description.enunciado.corpo || "Conteúdo do email não disponível"}
                </div>
              </>
            ) : (
              <>
                <div className="bg-zinc-800 rounded p-3 text-xs space-y-1">
                  <p><span className="text-zinc-500">De:</span> carlos.silva@email.com</p>
                  <p><span className="text-zinc-500">Assunto:</span> Problema com pedido #8472</p>
                  <p><span className="text-zinc-500">Data:</span> 31 Out 2025, 14:32</p>
                </div>
                <div className="mt-3 bg-zinc-800/50 rounded p-3 text-xs text-zinc-400 leading-relaxed max-h-48 overflow-y-auto">
                  {challenge.description?.email_content || challenge.description?.context || `Prezados,

Estou extremamente frustrado. Fiz um pedido há 5 dias (pedido #8472) e até agora não recebi nenhuma atualização sobre o envio. Quando tento rastrear, o sistema diz que o código de rastreamento é inválido.

Já tentei entrar em contato pelo chat 3 vezes, mas ninguém me respondeu. Preciso deste produto urgentemente para um evento no fim de semana.

Se não conseguirem resolver, vou ter que cancelar e solicitar reembolso.

Att,
Carlos Silva`}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center - Rich text editor */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col overflow-hidden">
          <div className="border-b border-zinc-800 p-3">
            <h2 className="text-sm font-semibold mb-3">Editor de Rich Text</h2>
            <p className="text-xs text-zinc-500 mb-3">Escreva sua resposta ao cliente usando as ferramentas de formatação</p>
            
            {/* Toolbar */}
            <div className="flex items-center gap-1 bg-zinc-800 p-1.5 rounded">
              <button 
                onClick={() => applyFormatting('bold')}
                className="p-2 hover:bg-zinc-700 rounded transition text-zinc-400 hover:text-white"
                title="Negrito"
              >
                <strong>B</strong>
              </button>
              <button 
                onClick={() => applyFormatting('italic')}
                className="p-2 hover:bg-zinc-700 rounded transition text-zinc-400 hover:text-white"
                title="Itálico"
              >
                <em>I</em>
              </button>
              <div className="w-px h-6 bg-zinc-700 mx-1"></div>
              <button className="p-2 hover:bg-zinc-700 rounded transition text-zinc-400 hover:text-white cursor-pointer" title="Lista">
                ≡
              </button>
              <button className="p-2 hover:bg-zinc-700 rounded transition text-zinc-400 hover:text-white cursor-pointer" title="Lista numerada">
                ≣
              </button>
              <div className="w-px h-6 bg-zinc-700 mx-1"></div>
              <button className="p-2 hover:bg-zinc-700 rounded transition text-zinc-400 hover:text-white cursor-pointer" title="Link">
                🔗
              </button>
            </div>
          </div>

          <textarea
            id="richTextEditor"
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Escreva sua resposta aqui..."
            className="flex-1 bg-zinc-900 text-zinc-100 p-4 resize-none focus:outline-none text-sm leading-relaxed"
          />

          <div className="border-t border-zinc-800 p-3 flex items-center justify-between text-xs text-zinc-500">
            <span>{responseText.length} caracteres</span>
            <span className={remainingSeconds < 300 ? 'text-red-400 font-bold' : isExpired ? 'text-red-500 font-bold' : ''}>
              ⏱️ {formattedTime} {isExpired && '(Esgotado)'}
            </span>
          </div>
        </div>

        {/* Right sidebar - Tips */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💡</span>
            <h3 className="font-semibold">Dica de Atendimento</h3>
          </div>
          
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
            Ao responder este tipo de situação, é importante:
          </p>

          <ul className="space-y-3 text-sm">
            {(challenge.description?.tips || [
              "Reconhecer a frustração do cliente e demonstrar empatia genuína",
              "Apresentar soluções concretas, não apenas desculpas",
              "Fornecer ações claras e prazos realistas",
              "Oferecer um gesto de boa vontade quando apropriado"
            ]).map((tip, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span className="text-zinc-400">{tip}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
            <p className="text-xs text-primary-400">
              <strong>Lembre-se:</strong> um cliente frustrado que tem seu problema resolvido com excelência pode se tornar um dos seus maiores defensores.
            </p>
          </div>
        </div>
      </div>

      {/* Submit modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-2">Resposta Concluída!</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Será feita uma análise da sua resposta por uma IA e você receberá feedback sobre empatia, clareza e profissionalismo.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-1">Observações (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dificuldades encontradas, dúvidas, etc."
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setError(null);
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-primary-500 text-zinc-900 font-semibold rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Enviando..." : "Finalizar e Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation loading overlay */}
      <EvaluationLoading isOpen={isEvaluating} />
    </div>
  );
}
