// src/components/challenges/OrganizationChallenge.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useChallengeTimer } from "../../hooks/useChallengeTimer";
import { submitSolution } from "../../lib/api";
import { prepareOrganizationSubmission, validateSubmission, getValidationMessage } from "../../utils/submissionHelpers";
import EvaluationLoading from "./EvaluationLoading";
import logger from "../../utils/logger";

export default function OrganizationChallenge({ challenge }) {
  const navigate = useNavigate();
  
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
  
  // Inicializa respostas baseado no template_code do desafio
  const initializeAnswers = () => {
    const initialAnswers = {};
    if (challenge.template_code && Array.isArray(challenge.template_code)) {
      challenge.template_code.forEach(section => {
        section.fields.forEach(field => {
          initialAnswers[field.id] = "";
        });
      });
    }
    return initialAnswers;
  };
  
  const [answers, setAnswers] = useState(initializeAnswers());
  const [implementation, setImplementation] = useState(""); // Nova seção fixa
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

  const handleFieldChange = (fieldId, value) => {
    setAnswers(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = () => {
    // Valida se todos os campos obrigatórios foram preenchidos
    const allFieldsFilled = Object.values(answers).every(value => value && value.trim());
    const implementationFilled = implementation && implementation.trim();
    
    if (!allFieldsFilled || !implementationFilled) {
      alert("Preencha todas as seções antes de enviar.");
      return;
    }
    setShowSubmitModal(true);
  };

  const confirmSubmit = async () => {
    setError(null);
    
    // Validar submissão
    const isValid = validateSubmission('organization', { 
      sections: answers, 
      implementation 
    });
    if (!isValid) {
      setError(getValidationMessage('organization'));
      return;
    }
    
    setIsSubmitting(true);
    setShowSubmitModal(false);
    
    try {
      // Calcular tempo gasto
      const timeTakenSeconds = (durationMinutes * 60) - remainingSeconds;
      
      // Preparar dados da submissão
      const submissionData = prepareOrganizationSubmission({
        challengeId: challenge.id,
        sections: answers,
        implementation,
        timeTaken: timeTakenSeconds,
        notes
      });
      
      logger.info("organization:submission:start", {
        challengeId: challenge.id,
        sectionCount: Object.keys(answers).length,
        implementationLength: submissionData.submitted_code?.implementation?.length || 0,
        timeTakenSeconds,
      });
      
      // Enviar para o backend
      setIsEvaluating(true);
      const result = await submitSolution(submissionData);
      
      logger.info("organization:submission:success", {
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
      logger.error("organization:submission:error", {
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

  // Extrai requisitos funcionais e não funcionais
  const functionalReqs = challenge.description?.enunciado?.funcionais || [];
  const nonFunctionalReqs = challenge.description?.enunciado?.nao_funcionais || [];

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
                <span className="text-zinc-900 text-sm">🏗️</span>
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
              {isExpired && (
                <p className="text-xs text-red-400 mt-1">Tempo esgotado</p>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={isExpired}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                isExpired 
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' 
                  : 'bg-primary-500 text-zinc-900 hover:bg-primary-600'
              }`}
            >
              {isExpired ? 'Tempo Esgotado' : 'Enviar Design'}
            </button>
          </div>
        </div>
      </header>

      {/* Main content: 2 columns */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 p-6">
        
        {/* Left sidebar - Requirements */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-primary-500">📋</span>
              Requisitos
            </h2>
            
            {functionalReqs.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Funcionais</h3>
                <ul className="space-y-2">
                  {functionalReqs.map((req, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="text-primary-500">•</span>
                      <span className="text-zinc-300">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {nonFunctionalReqs.length > 0 && (
              <div className="pt-4 border-t border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Não Funcionais</h3>
                <ul className="space-y-2">
                  {nonFunctionalReqs.map((req, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="text-primary-500">•</span>
                      <span className="text-zinc-300">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Dicas */}
          {(challenge.description?.hints || []).length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary-500">💡</span>
                Dicas
              </h3>
              <ul className="space-y-2">
                {challenge.description.hints.map((hint, idx) => (
                  <li key={idx} className="text-sm text-zinc-400">{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right side - Form sections */}
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            {challenge.description?.text || "Complete as seções abaixo para projetar sua solução"}
          </p>

          {/* Renderiza seções dinamicamente baseado no template_code */}
          {challenge.template_code && Array.isArray(challenge.template_code) && challenge.template_code.map((section, sectionIdx) => (
            <div key={section.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl font-bold text-primary-500">{sectionIdx + 1}.</span>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{section.label}</h3>
                </div>
              </div>
              
              <div className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      {field.label}
                    </label>
                    
                    {field.type === 'textarea' ? (
                      <>
                        <textarea
                          value={answers[field.id] || ""}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder || "Escreva sua resposta aqui..."}
                          rows={6}
                          className="w-full bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        />
                        <p className="text-xs text-zinc-500 mt-1">{(answers[field.id] || "").length} caracteres</p>
                      </>
                    ) : field.type === 'dropdown' ? (
                      <select
                        value={answers[field.id] || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="w-full bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Selecione uma opção...</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={answers[field.id] || ""}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ""}
                        className="w-full bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Seção fixa: Como Implementar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl font-bold text-primary-500">
                {(challenge.template_code?.length || 0) + 1}.
              </span>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Como Implementar</h3>
                <p className="text-sm text-zinc-400 mb-3">
                  Descreva os passos práticos de implementação, bibliotecas/frameworks específicos, configurações,
                  comandos, ou código exemplo que você usaria. Seja o mais específico possível.
                </p>
              </div>
            </div>
            <textarea
              value={implementation}
              onChange={(e) => setImplementation(e.target.value)}
              placeholder="Ex: 
1. Instalar Redis: docker run -d -p 6379:6379 redis
2. Configurar cliente no Node.js: npm install ioredis
3. Criar wrapper de cache com TTL...
              "
              rows={10}
              className="w-full bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono"
            />
            <p className="text-xs text-zinc-500 mt-2">{implementation.length} caracteres (mínimo 100)</p>
          </div>
        </div>
      </div>

      {/* Submit modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-2">Design Concluído!</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Sua solução de arquitetura será revisada por especialistas. Você receberá feedback sobre escalabilidade,
              trade-offs e decisões técnicas.
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
                placeholder="Dúvidas, pontos que gostaria de feedback específico, etc."
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

