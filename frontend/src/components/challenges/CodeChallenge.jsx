// src/components/challenges/CodeChallenge.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useChallengeTimer } from "../../hooks/useChallengeTimer";

// Componente recursivo para renderizar a árvore de arquivos
function FileTreeNode({ tree, level, parentPath, selectedFile, expandedFolders, onFileClick, onFolderToggle, getFileIcon }) {
  return (
    <>
      {Object.keys(tree).sort().map(name => {
        const item = tree[name];
        const currentPath = parentPath ? `${parentPath}/${name}` : name;
        const indent = level * 12; // 12px por nível

        if (item.type === 'folder') {
          const isExpanded = expandedFolders[currentPath] !== false; // Expandido por padrão
          
          return (
            <div key={currentPath}>
              <button
                onClick={() => onFolderToggle(currentPath)}
                className="w-full text-left px-2 py-1 text-sm text-zinc-300 hover:bg-zinc-800/50 transition flex items-center gap-1"
                style={{ paddingLeft: `${8 + indent}px` }}
              >
                <span className="text-zinc-500 text-xs">{isExpanded ? '▼' : '▶'}</span>
                <span className="text-zinc-400">📁</span>
                <span>{name}</span>
              </button>
              {isExpanded && (
                <FileTreeNode
                  tree={item.children}
                  level={level + 1}
                  parentPath={currentPath}
                  selectedFile={selectedFile}
                  expandedFolders={expandedFolders}
                  onFileClick={onFileClick}
                  onFolderToggle={onFolderToggle}
                  getFileIcon={getFileIcon}
                />
              )}
            </div>
          );
        } else {
          // É um arquivo
          const isSelected = selectedFile === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => onFileClick(item.path)}
              className={`w-full text-left px-2 py-1 text-sm transition flex items-center gap-2 ${
                isSelected
                  ? 'bg-zinc-800 text-primary-400'
                  : 'text-zinc-300 hover:bg-zinc-800/50'
              }`}
              style={{ paddingLeft: `${20 + indent}px` }}
            >
              <span className="text-base">{getFileIcon(name)}</span>
              <span>{name}</span>
            </button>
          );
        }
      })}
    </>
  );
}

export default function CodeChallenge({ challenge }) {
  const navigate = useNavigate();
  
  // Usar fs (file system) para desafios de código
  const fs = challenge.fs || {};
  const fileList = fs.files || [];
  const filesContent = fs.contents || {};
  
  // Se não houver arquivos, criar um arquivo padrão
  const defaultFileList = fileList.length > 0 ? fileList : ["main.js"];
  const defaultFilesContent = Object.keys(filesContent).length > 0 ? filesContent : {
    "main.js": "// Escreva seu código aqui\n\nconsole.log('Hello, World!');"
  };
  
  // Arquivo inicial: usar fs.open se disponível, senão o primeiro da lista
  const initialFile = fs.open || defaultFileList[0] || "";
  
  console.log("📁 Arquivos disponíveis:", defaultFileList);
  console.log("📄 Conteúdo dos arquivos:", defaultFilesContent);
  console.log("📂 Arquivo inicial:", initialFile);
  
  // Usar o hook de timer persistente
  const durationMinutes = challenge.difficulty?.time_limit || 120;
  const { 
    remainingSeconds,
    formattedTime,
    isExpired,
    isInProgress,
    startChallenge
  } = useChallengeTimer(challenge.id, durationMinutes);
  
  const [selectedFile, setSelectedFile] = useState(initialFile);
  const [codeFiles, setCodeFiles] = useState(defaultFilesContent);
  const [commitMessage, setCommitMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Inicia o desafio automaticamente se ainda não foi iniciado
  useEffect(() => {
    if (!isInProgress && !isExpired) {
      startChallenge();
    }
  }, [isInProgress, isExpired, startChallenge]);

  const handleFileChange = (fileName) => {
    console.log("📄 Mudando para arquivo:", fileName);
    setSelectedFile(fileName);
  };

  const handleEditorChange = (value) => {
    setCodeFiles(prev => ({
      ...prev,
      [selectedFile]: value || ""
    }));
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    // TODO: enviar para o backend
    const timeTakenSeconds = (durationMinutes * 60) - remainingSeconds;
    console.log({
      challenge_id: challenge.id,
      submitted_code: codeFiles,
      commit_message: commitMessage,
      notes,
      time_taken_sec: timeTakenSeconds
    });
    alert("Submissão enviada! (mock)");
    navigate("/home");
  };

  // Detecta a linguagem do arquivo baseado na extensão
  const getLanguage = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown'
    };
    return langMap[ext] || 'javascript';
  };

  // Constrói árvore de arquivos hierárquica
  const buildFileTree = (files) => {
    const tree = {};
    
    files.forEach(filePath => {
      const parts = filePath.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // É um arquivo
          current[part] = { type: 'file', path: filePath };
        } else {
          // É uma pasta
          if (!current[part]) {
            current[part] = { type: 'folder', children: {} };
          }
          current = current[part].children;
        }
      });
    });
    
    return tree;
  };

  const fileTree = buildFileTree(defaultFileList);
  const [expandedFolders, setExpandedFolders] = useState({});

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // Ícone baseado na extensão do arquivo
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['js', 'jsx'].includes(ext)) return '📜';
    if (['ts', 'tsx'].includes(ext)) return '📘';
    if (['py'].includes(ext)) return '🐍';
    if (['java'].includes(ext)) return '☕';
    if (['html'].includes(ext)) return '🌐';
    if (['css', 'scss'].includes(ext)) return '🎨';
    if (['json'].includes(ext)) return '📋';
    return '📄';
  };

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
            <p className="text-sm text-zinc-500">{challenge.description?.text || "Desafio de código"}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-zinc-500">Tempo restante</p>
            <p className={`text-xl font-mono font-bold ${remainingSeconds < 300 ? 'text-red-400' : isExpired ? 'text-red-500' : 'text-primary-400'}`}>
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
            {isExpired ? 'Tempo Esgotado' : 'Enviar para Revisão'}
          </button>
        </div>
      </header>

      {/* Main content: 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: Explorer */}
        <div className="w-56 bg-zinc-950 border-r border-zinc-800 overflow-y-auto">
          <div className="p-3 border-b border-zinc-800">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">EXPLORER</p>
          </div>
          <div className="py-2">
            <FileTreeNode 
              tree={fileTree}
              level={0}
              parentPath=""
              selectedFile={selectedFile}
              expandedFolders={expandedFolders}
              onFileClick={handleFileChange}
              onFolderToggle={toggleFolder}
              getFileIcon={getFileIcon}
            />
          </div>
        </div>

        {/* Center: Monaco Editor */}
        <div className="flex-1 flex flex-col">
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center gap-2">
            <span className="text-sm text-zinc-400">{selectedFile || "Selecione um arquivo"}</span>
          </div>
          <Editor
            height="100%"
            language={getLanguage(selectedFile)}
            value={codeFiles[selectedFile] || ""}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on'
            }}
          />
        </div>

        {/* Right sidebar: Instructions */}
        <div className="w-80 bg-zinc-950 border-l border-zinc-800 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4 p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
              <p className="text-sm font-medium text-primary-400 mb-1">💡 Dica</p>
              <p className="text-xs text-zinc-300">
                {challenge.description?.text || "Verifique os comentários no código e siga as instruções."}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-2">Detalhes da Tarefa</h3>
              <div className="text-sm text-zinc-400 space-y-2">
                {challenge.description?.eval_criteria && challenge.description.eval_criteria.map((criterion, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-primary-400 font-bold">{idx + 1}.</span>
                    <span>{criterion}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Habilidades Aprimoradas</h3>
              <div className="flex flex-wrap gap-2">
                {['React', 'JavaScript', 'Debugging', 'Problem Solving'].map(skill => (
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

