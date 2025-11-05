// src/components/challenges/DailyTaskChallenge.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function DailyTaskChallenge({ challenge }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(challenge.difficulty.time_limit * 60);
  const [responseText, setResponseText] = useState("");
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
    if (!responseText.trim()) {
      alert("Escreva sua resposta antes de enviar.");
      return;
    }
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    console.log({
      challenge_id: challenge.id,
      submitted_content: responseText,
      notes,
      time_taken_sec: (challenge.difficulty.time_limit * 60) - timeLeft
    });
    alert("Resposta enviada! (mock)");
    navigate("/home");
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
              ← Voltar
            </Link>
            <div className="w-px h-6 bg-zinc-700"></div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-500 rounded flex items-center justify-center">
                <span className="text-zinc-900 text-sm">📄</span>
              </div>
              <h1 className="text-lg font-semibold">{challenge.title}</h1>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-500 text-zinc-900 rounded-lg font-semibold hover:bg-primary-600 transition flex items-center gap-2"
          >
            <span>📨</span> Enviar para Revisão
          </button>
        </div>
      </header>

      {/* Main layout: 3 columns */}
      <div className="max-w-7xl mx-auto grid grid-cols-[280px_1fr_320px] gap-6 p-6 h-[calc(100vh-80px)]">
        
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
              {challenge.description?.context || challenge.description?.details || "Complete a tarefa seguindo as instruções."}
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
            <div className="bg-zinc-800 rounded p-3 text-xs space-y-1">
              <p><span className="text-zinc-500">De:</span> carlos.silva@email.com</p>
              <p><span className="text-zinc-500">Assunto:</span> Problema com pedido #8472</p>
              <p><span className="text-zinc-500">Data:</span> 31 Out 2025, 14:32</p>
            </div>
            <div className="mt-3 bg-zinc-800/50 rounded p-3 text-xs text-zinc-400 leading-relaxed max-h-48 overflow-y-auto">
              {challenge.description?.email_content || `Prezados,

Estou extremamente frustrado. Fiz um pedido há 5 dias (pedido #8472) e até agora não recebi nenhuma atualização sobre o envio. Quando tento rastrear, o sistema diz que o código de rastreamento é inválido.

Já tentei entrar em contato pelo chat 3 vezes, mas ninguém me respondeu. Preciso deste produto urgentemente para um evento no fim de semana.

Se não conseguirem resolver, vou ter que cancelar e solicitar reembolso.

Att,
Carlos Silva`}
            </div>
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
              <button className="p-2 hover:bg-zinc-700 rounded transition text-zinc-400 hover:text-white" title="Lista">
                ≡
              </button>
              <button className="p-2 hover:bg-zinc-700 rounded transition text-zinc-400 hover:text-white" title="Lista numerada">
                ≣
              </button>
              <div className="w-px h-6 bg-zinc-700 mx-1"></div>
              <button className="p-2 hover:bg-zinc-700 rounded transition text-zinc-400 hover:text-white" title="Link">
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
            <span>⏱️ {formatTime(timeLeft)}</span>
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
