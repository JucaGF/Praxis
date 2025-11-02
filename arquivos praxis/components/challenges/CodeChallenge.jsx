// src/components/challenges/CodeChallenge.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function CodeChallenge({ challenge }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(challenge.difficulty.time_limit * 60); // segundos
  const [selectedFile, setSelectedFile] = useState(Object.keys(challenge.template_code || {})[0] || "");
  const [code, setCode] = useState(challenge.template_code?.[selectedFile] || "");
  const [commitMessage, setCommitMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Atualiza código ao trocar de arquivo
  useEffect(() => {
    if (selectedFile && challenge.template_code) {
      setCode(challenge.template_code[selectedFile] || "");
    }
  }, [selectedFile, challenge.template_code]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    // TODO: enviar para o backend
    console.log({
      challenge_id: challenge.id,
      submitted_code: { [selectedFile]: code },
      commit_message: commitMessage,
      notes,
      time_taken_sec: (challenge.difficulty.time_limit * 60) - timeLeft
    });
    alert("Submissão enviada! (mock)");
    navigate("/home");
  };

  const fileList = challenge.template_code ? Object.keys(challenge.template_code) : [];

  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-white">
      {/* Header */}
      <header className="bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/home" className="text-zinc-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-primary-400">{challenge.title}</h1>
            <p className="text-sm text-zinc-500">{challenge.description?.summary || challenge.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-zinc-500">Tempo restante</p>
            <p className={`text-xl font-mono font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-primary-400'}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-500 text-zinc-900 rounded-lg font-semibold hover:bg-primary-600 transition"
          >
            Enviar para Revisão
          </button>
        </div>
      </header>

      {/* Main content: 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: Explorer */}
        <div className="w-56 bg-zinc-950 border-r border-zinc-800 overflow-y-auto">
          <div className="p-3 border-b border-zinc-800">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Explorer</p>
          </div>
          <div className="p-2">
            <div className="mb-2">
              <p className="text-xs text-zinc-500 px-2 mb-1">src</p>
              {fileList.filter(f => f.includes("App.jsx")).map(file => (
                <button
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded transition ${
                    selectedFile === file 
                      ? 'bg-zinc-800 text-primary-400' 
                      : 'text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  📄 {file.split('/').pop()}
                </button>
              ))}
            </div>
            <div>
              <p className="text-xs text-zinc-500 px-2 mb-1">src/components</p>
              {fileList.filter(f => f.includes("Button.jsx") || f.includes("Header.jsx")).map(file => (
                <button
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded transition ${
                    selectedFile === file 
                      ? 'bg-zinc-800 text-primary-400' 
                      : 'text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  📄 {file.split('/').pop()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Code editor */}
        <div className="flex-1 flex flex-col">
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center gap-2">
            <span className="text-sm text-zinc-400">{selectedFile}</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-zinc-900 text-zinc-100 font-mono text-sm p-4 resize-none focus:outline-none"
            spellCheck={false}
            style={{ tabSize: 2 }}
          />
        </div>

        {/* Right sidebar: Instructions */}
        <div className="w-80 bg-zinc-950 border-l border-zinc-800 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
              <p className="text-sm font-medium text-primary-400 mb-1">💡 Dica</p>
              <p className="text-xs text-zinc-300">
                {challenge.description?.details || "Verifique os comentários no código e siga as instruções."}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-2">Detalhes da Tarefa</h3>
              <ol className="space-y-2 text-sm text-zinc-400">
                {(challenge.description?.objectives || []).map((obj, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-primary-400 font-bold">{idx + 1}.</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Habilidades Aprimoradas</h3>
              <div className="flex flex-wrap gap-2">
                {['React', 'TypeScript', 'Debugging', 'Problem Solving'].map(skill => (
                  <span key={skill} className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-2">Tarefa Concluída! Descreva sua alteração.</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Escreva uma mensagem de commit clara e adicione observações sobre sua solução.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-1">Mensagem de Commit</label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="ex: fix: corrigir onClick no Button"
                className="w-full px-3 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-1">Observações (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descreva sua abordagem, desafios encontrados, etc."
                rows={4}
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
                Finalizar e Enviar para Revisão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
