// src/assets/pages/Questionario_soft.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TelaSaudacaoQuestionario from "../components/TelaSaudacaoQuestionario";

export default function QuestionarioSoft({ modoOnboarding = false, onConcluir = null, onVoltar: onVoltarProp = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = modoOnboarding ? {} : location.state?.formData;
  const hardSkills = modoOnboarding ? null : location.state?.hardSkills;

  // Se estiver em modo onboarding, não mostra saudação
  const [mostrarSaudacao, setMostrarSaudacao] = useState(!modoOnboarding);
  const [avaliacoes, setAvaliacoes] = useState({});
  const [mensagem, setMensagem] = useState("");

  const perguntas = [
    {
      categoria: "Comunicação",
      icone: "💬",
      questoes: [
        "Consigo explicar problemas técnicos para pessoas não técnicas",
        "Deixo comentários claros e úteis no código",
        "Escrevo mensagens estruturadas em equipes de desenvolvimento",
      ],
    },
    {
      categoria: "Organização",
      icone: "📋",
      questoes: [
        "Divido tarefas em pequenas etapas e priorizo",
        "Planejo minhas atividades semanalmente",
        "Gerencio múltiplos projetos sem perder prazos",
      ],
    },
    {
      categoria: "Resolução de Problemas",
      icone: "🔍",
      questoes: [
        "Identifico rapidamente a causa raiz dos problemas",
        "Sei investigar e debugar erros de forma eficiente",
        "Resolvo problemas complexos de lógica",
      ],
    },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const avaliarQuestao = (categoria, indice, valor) => {
    setAvaliacoes(prev => ({
      ...prev,
      [`${categoria}-${indice}`]: valor
    }));
  };

  const finalizarQuestionario = (e) => {
    e.preventDefault();

    const totalRespostas = Object.keys(avaliacoes).length;
    const totalPerguntas = perguntas.reduce((acc, cat) => acc + cat.questoes.length, 0);

    if (totalRespostas < totalPerguntas) {
      setMensagem("Por favor, responda todas as perguntas antes de continuar.");
      return;
    }

    // Processar respostas para o formato da API
    const softSkillsProcessed = {};
    Object.keys(avaliacoes).forEach((key) => {
      const [categoria, indice] = key.split('-');
      const questao = perguntas.find(p => p.categoria === categoria)?.questoes[indice];
      if (questao) {
        // Normalizar valor de 0-5 para 0-100
        softSkillsProcessed[questao] = Math.round((avaliacoes[key] / 5) * 100);
      }
    });

    setMensagem("Questionário concluído!");
    
    // Se está em modo onboarding, usa callback
    if (modoOnboarding && onConcluir) {
      setTimeout(() => {
        onConcluir(softSkillsProcessed);
      }, 1000);
    } else {
      // Modo standalone: redireciona para cadastro
      setTimeout(() => {
        navigate("/cadastro", { 
          state: { 
            etapa: "finalizado",
            formData,
            softSkills: softSkillsProcessed,
            hardSkills: hardSkills || null
          } 
        });
      }, 2000);
    }
  };

  const handleVoltar = () => {
    if (!mostrarSaudacao) {
      setMostrarSaudacao(true);
      setMensagem("");
    } else {
      // Se está em modo onboarding, usa callback
      if (modoOnboarding && onVoltarProp) {
        onVoltarProp();
      } else {
        navigate(-1);
      }
    }
  };

  const FundoAnimado = () =>
    Array.from({ length: 120 }).map((_, i) => {
      let left, top;
      let validPosition = false;
      while (!validPosition) {
        left = Math.random() * 100;
        top = Math.random() * 100;
        const isInFormArea = left > 15 && left < 85 && top > 5 && top < 95;
        validPosition = !isInFormArea;
      }
      return (
        <div
          key={i}
          className={`absolute ${["w-3 h-3", "w-4 h-4", "w-5 h-5"][i % 3]} ${
            [
              "bg-yellow-500/60",
              "bg-yellow-600/50",
              "bg-amber-500/60",
              "bg-yellow-400/70",
              "bg-gray-900/40",
            ][i % 5]
          } ${["rounded-full", "rounded-lg"][i % 2]} animate-float`}
          style={{
            top: `${top}%`,
            left: `${left}%`,
            opacity: 0.3 + Math.random() * 0.3,
            zIndex: 1,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      );
    });

  if (mostrarSaudacao) {
    return (
      <TelaSaudacaoQuestionario
        titulo="Questionário de Soft Skills"
        descricao="Agora vamos avaliar suas habilidades interpessoais. Seja honesto nas suas respostas — isso nos ajuda a criar um plano de desenvolvimento completo para você."
        onComecar={() => setMostrarSaudacao(false)}
        onVoltar={modoOnboarding && onVoltarProp ? onVoltarProp : () => navigate(-1)}
      />
    );
  }

  return (
    <div className="relative h-screen bg-white overflow-hidden flex justify-center items-center py-6">
      <FundoAnimado />

      <div className="relative z-10 w-full max-w-5xl mx-4 h-[calc(100vh-3rem)] bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-200 flex flex-col">
        {/* Header fixo */}
        <div className="flex-shrink-0 px-4 md:px-8 pt-6 pb-4 border-b border-gray-100">
          <button
            onClick={handleVoltar}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition text-sm cursor-pointer mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>

          <div className="animate-fade-in opacity-0 [animation-fill-mode:forwards]">
            <div className="flex items-center gap-3">
              <img src="/Logo.png" alt="Praxis" className="w-12 h-12 md:w-16 md:h-16" />
              <div className="text-left flex-1">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                  Habilidades Interpessoais
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                  Avalie de 0 (nunca) a 5 (sempre)
                </p>
              </div>
            </div>
          </div>

          {mensagem && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm font-medium text-center ${
                mensagem.includes("concluído") || mensagem.includes("Criando")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {mensagem}
            </div>
          )}
        </div>

        {/* Área de conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 animate-fade-in opacity-0 [animation-fill-mode:forwards]">
          <form onSubmit={finalizarQuestionario} className="space-y-6 max-w-3xl mx-auto">
            {perguntas.map((grupo, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                {/* Header da categoria */}
                <div className="px-4 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-gray-200">
                  <h3 className="font-semibold text-base flex items-center gap-2 text-gray-900">
                    <span className="text-xl">{grupo.icone}</span>
                    {grupo.categoria}
                  </h3>
                </div>

                {/* Questões */}
                <div className="p-4 bg-white space-y-5">
                  {grupo.questoes.map((questao, j) => (
                    <div key={j} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800 text-sm md:text-base font-medium mb-3">
                        {questao}
                      </p>
                      
                      {/* Escala Likert */}
                      <div className="grid grid-cols-6 gap-1.5 md:gap-2">
                        {[0, 1, 2, 3, 4, 5].map((valor) => {
                          const isSelected = avaliacoes[`${grupo.categoria}-${j}`] === valor;
                          const labels = ["Nunca", "Raramente", "Às vezes", "Frequente", "Muito", "Sempre"];
                          
                          return (
                            <label
                              key={valor}
                              className="cursor-pointer group"
                            >
                              <div className={`
                                flex flex-col items-center justify-center p-2 md:p-3 rounded-lg transition-all duration-200 transform
                                ${isSelected 
                                  ? 'bg-yellow-400 shadow-lg scale-110 border-2 border-yellow-500' 
                                  : 'bg-white hover:bg-yellow-50 group-hover:scale-105 border-2 border-gray-200 hover:border-yellow-300'
                                }
                                active:scale-95
                              `}>
                                <input
                                  type="radio"
                                  name={`${grupo.categoria}-${j}`}
                                  value={valor}
                                  checked={isSelected}
                                  onChange={() => avaliarQuestao(grupo.categoria, j, valor)}
                                  className="sr-only"
                                  required
                                />
                                <span className={`text-base md:text-xl lg:text-2xl font-bold ${
                                  isSelected ? 'text-gray-900' : 'text-gray-600 group-hover:text-yellow-600'
                                }`}>
                                  {valor}
                                </span>
                                <span className={`text-[10px] md:text-xs mt-0.5 md:mt-1 text-center leading-tight ${
                                  isSelected ? 'text-gray-700 font-medium' : 'text-gray-400'
                                }`}>
                                  {labels[valor]}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </form>
        </div>

        {/* Footer fixo com botão */}
        <div className="flex-shrink-0 px-4 md:px-8 py-4 md:py-5 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm">
          <button
            type="submit"
            onClick={finalizarQuestionario}
            className="w-full max-w-lg mx-auto block py-3 md:py-3.5 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold text-sm md:text-base text-gray-900 transition-all hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
          >
            ✨ Finalizar e Criar Conta
          </button>
        </div>
      </div>
    </div>
  );
}

