// src/assets/pages/Questionario_hard_front.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TelaSaudacaoQuestionario from "../components/TelaSaudacaoQuestionario";

export default function QuestionarioHardFront({ modoOnboarding = false, onConcluir = null, onVoltar: onVoltarProp = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = modoOnboarding ? {} : location.state?.formData;

  const [mostrarSaudacao, setMostrarSaudacao] = useState(true);
  const [etapa, setEtapa] = useState("selecao"); // "selecao" | "avaliacao"
  const [skillsSelecionadas, setSkillsSelecionadas] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState({});
  const [mensagem, setMensagem] = useState("");

  // Categorização de habilidades por tipo (Frontend)
  const habilidadesDisponiveis = {
    "Linguagens & Fundamentos (Código)": {
      tipo: "codigo",
      opcoes: ["HTML", "CSS", "JavaScript", "TypeScript"]
    },
    "Frameworks & Bibliotecas (Código)": {
      tipo: "codigo",
      opcoes: ["React", "Vue.js", "Angular", "Next.js", "Svelte"]
    },
    "Estilização & UI (Código)": {
      tipo: "codigo",
      opcoes: ["Tailwind CSS", "Styled Components", "Sass/SCSS", "Bootstrap"]
    },
    "Ferramentas de Build (Código)": {
      tipo: "codigo",
      opcoes: ["Vite", "Webpack", "npm/yarn"]
    },
    "Design & UX (Planejamento)": {
      tipo: "planejamento",
      opcoes: ["Design Responsivo", "Acessibilidade (a11y)", "UI/UX Principles", "Figma/Design Tools"]
    },
    "Performance & Otimização (Planejamento)": {
      tipo: "planejamento",
      opcoes: ["Web Performance", "SEO", "Lazy Loading", "Code Splitting"]
    },
    "Controle de Versão & Colaboração (Planejamento)": {
      tipo: "planejamento",
      opcoes: ["Git", "Code Review", "Metodologias Ágeis"]
    },
    "Documentação & Comunicação (Comunicação)": {
      tipo: "comunicacao",
      opcoes: ["Documentação de Componentes", "Storybook", "Technical Writing"]
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Função para selecionar/desselecionar skill
  const toggleSkill = (skill) => {
    if (skillsSelecionadas.includes(skill)) {
      setSkillsSelecionadas(skillsSelecionadas.filter(s => s !== skill));
    } else if (skillsSelecionadas.length < 5) {
      setSkillsSelecionadas([...skillsSelecionadas, skill]);
    }
  };

  // Verifica requisitos mínimos
  const verificarRequisitos = () => {
    const tipos = skillsSelecionadas.map(skill => {
      for (const categoria in habilidadesDisponiveis) {
        if (habilidadesDisponiveis[categoria].opcoes.includes(skill)) {
          return habilidadesDisponiveis[categoria].tipo;
        }
      }
      return null;
    });

    const temCodigo = tipos.includes("codigo");
    const temPlanejamento = tipos.includes("planejamento");
    const temComunicacao = tipos.includes("comunicacao");

    return { temCodigo, temPlanejamento, temComunicacao };
  };

  // Passa para etapa de avaliação
  const prosseguirParaAvaliacao = () => {
    const { temCodigo, temPlanejamento, temComunicacao } = verificarRequisitos();
    
    if (skillsSelecionadas.length !== 5) {
      setMensagem("Selecione exatamente 5 habilidades.");
      return;
    }
    
    if (!temCodigo) {
      setMensagem("Você precisa selecionar pelo menos 1 habilidade de Código.");
      return;
    }
    
    if (!temPlanejamento) {
      setMensagem("Você precisa selecionar pelo menos 1 habilidade de Planejamento.");
      return;
    }
    
    if (!temComunicacao) {
      setMensagem("Você precisa selecionar pelo menos 1 habilidade de Comunicação.");
      return;
    }

    setMensagem("");
    setEtapa("avaliacao");
  };

  // Função para avaliar uma skill
  const avaliarSkill = (skill, valor) => {
    setAvaliacoes(prev => ({
      ...prev,
      [skill]: valor
    }));
  };

  // Finalizar questionário
  const finalizarQuestionario = (e) => {
    e.preventDefault();

    if (Object.keys(avaliacoes).length !== 5) {
      setMensagem("Por favor, avalie todas as 5 habilidades selecionadas.");
      return;
    }

    // Processar para formato da API (normalizar de 0-5 para 0-100)
    const hardSkillsProcessed = {};
    Object.keys(avaliacoes).forEach(skill => {
      hardSkillsProcessed[skill] = Math.round((avaliacoes[skill] / 5) * 100);
    });

    setMensagem("Questionário concluído! Próxima etapa...");

    // Se está em modo onboarding, usa callback
    if (modoOnboarding && onConcluir) {
      setTimeout(() => {
        onConcluir(hardSkillsProcessed);
      }, 1000);
    } else {
      // Modo standalone: redireciona para questionário de soft skills
      setTimeout(() => {
        navigate("/questionario-soft", { 
          state: { 
            formData,
            hardSkills: hardSkillsProcessed
          } 
        });
      }, 2000);
    }
  };

  const handleVoltar = () => {
    if (etapa === "avaliacao") {
      setEtapa("selecao");
      setMensagem("");
    } else if (etapa === "selecao") {
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

  // Fundo animado reutilizável com animação Tailwind
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

  // Tela de boas-vindas
  if (mostrarSaudacao) {
    return (
      <TelaSaudacaoQuestionario
        titulo="Questionário de Hard Skills (Frontend)"
        descricao="Escolha 5 habilidades técnicas nas quais você possui mais experiência. Depois, você irá avaliar seu nível em cada uma delas."
        onComecar={() => setMostrarSaudacao(false)}
        onVoltar={modoOnboarding && onVoltarProp ? onVoltarProp : () => navigate(-1)}
      />
    );
  }

  const { temCodigo, temPlanejamento, temComunicacao } = verificarRequisitos();

  return (
    <div className="relative h-screen bg-white overflow-hidden flex justify-center items-center py-6">
      <FundoAnimado />

      {/* Container centralizado */}
      <div className="relative z-10 w-full max-w-5xl mx-4 h-[calc(100vh-3rem)] bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-200 flex flex-col transition-all duration-500 ease-in-out">
        {/* Header fixo - não faz scroll */}
        <div className="flex-shrink-0 px-4 md:px-8 pt-6 pb-4 border-b border-gray-100">
          {/* Botão voltar */}
          <button
            onClick={handleVoltar}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition text-sm cursor-pointer mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>

          {/* Logo e título */}
          <div className="animate-fade-in opacity-0 [animation-fill-mode:forwards]">
            <div className="flex items-center gap-3 mb-4">
              <img src="/Logo.png" alt="Praxis" className="w-12 h-12 md:w-16 md:h-16" />
              <div className="text-left flex-1">
                {etapa === "selecao" ? (
                  <>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                      Escolha suas Habilidades
                    </h2>
                    <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                      Selecione 5 habilidades principais
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                      Avalie seu Nível
                    </h2>
                    <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                      De 0 (iniciante) a 5 (expert)
                    </p>
                  </>
                )}
              </div>
            </div>
            
            {/* Contador e badges de requisitos */}
            {etapa === "selecao" && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full shadow-sm">
                  <span className="text-xl md:text-2xl font-bold text-yellow-600">{skillsSelecionadas.length}</span>
                  <span className="text-sm text-gray-700">/ 5</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`px-2.5 py-1 rounded-full font-medium transition ${temCodigo ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                    {temCodigo ? '✓' : '○'} Código
                  </span>
                  <span className={`px-2.5 py-1 rounded-full font-medium transition ${temPlanejamento ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>
                    {temPlanejamento ? '✓' : '○'} Planejamento
                  </span>
                  <span className={`px-2.5 py-1 rounded-full font-medium transition ${temComunicacao ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {temComunicacao ? '✓' : '○'} Comunicação
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mensagens */}
          {mensagem && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm font-medium text-center ${
                mensagem.includes("concluído") || mensagem.includes("Próxima")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {mensagem}
            </div>
          )}
        </div>

        {/* Área de conteúdo scrollável - ocupa todo espaço restante */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 animate-fade-in opacity-0 [animation-fill-mode:forwards]">
          {/* ETAPA 1: SELEÇÃO DE SKILLS */}
          {etapa === "selecao" && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {Object.entries(habilidadesDisponiveis).map(([categoria, { tipo, opcoes }]) => {
                // Definir cor do badge baseado no tipo
                const tipoCores = {
                  codigo: "bg-blue-50 border-blue-200 text-blue-700",
                  planejamento: "bg-purple-50 border-purple-200 text-purple-700",
                  comunicacao: "bg-green-50 border-green-200 text-green-700"
                };
                
                return (
                  <div key={categoria} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                    {/* Header da categoria */}
                    <div className={`px-4 py-3 border-b ${tipoCores[tipo]}`}>
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {tipo === "codigo" && "💻"}
                        {tipo === "planejamento" && "📋"}
                        {tipo === "comunicacao" && "💬"}
                        {categoria}
                      </h3>
                    </div>
                    
                    {/* Grid de opções */}
                    <div className="p-3 md:p-4 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {opcoes.map(skill => {
                          const isSelected = skillsSelecionadas.includes(skill);
                          const isDisabled = !isSelected && skillsSelecionadas.length >= 5;
                          
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkill(skill)}
                              disabled={isDisabled}
                              className={`
                                flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-200 transform
                                ${isSelected 
                                  ? 'bg-yellow-400 border-2 border-yellow-500 shadow-lg text-gray-900 font-semibold scale-105' 
                                  : isDisabled
                                    ? 'bg-gray-50 border-2 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                    : 'bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 text-gray-700 hover:shadow-md hover:scale-105'
                                }
                                ${!isDisabled && 'cursor-pointer active:scale-95'}
                              `}
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                                isSelected 
                                  ? 'bg-yellow-600 scale-110' 
                                  : 'bg-gray-100 border-2 border-gray-300'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-xs md:text-sm flex-1">{skill}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ETAPA 2: AVALIAÇÃO */}
          {etapa === "avaliacao" && (
            <div className="space-y-4 md:space-y-5 max-w-3xl mx-auto">
              {skillsSelecionadas.map((skill, index) => (
                <div key={skill} className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 hover:shadow-lg transition-all hover:border-yellow-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm font-bold text-gray-900 flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm md:text-base">{skill}</p>
                  </div>
                  
                  {/* Escala Likert melhorada e responsiva */}
                  <div className="grid grid-cols-6 gap-1.5 md:gap-2">
                    {[0, 1, 2, 3, 4, 5].map(valor => {
                      const isSelected = avaliacoes[skill] === valor;
                      const labels = ["Nulo", "Básico", "Iniciante", "Médio", "Avançado", "Expert"];
                      
                      return (
                        <label
                          key={valor}
                          className="cursor-pointer group"
                        >
                          <div className={`
                            flex flex-col items-center justify-center p-2 md:p-3 rounded-lg transition-all duration-200 transform
                            ${isSelected 
                              ? 'bg-yellow-400 shadow-lg scale-110 border-2 border-yellow-500' 
                              : 'bg-gray-50 hover:bg-yellow-50 group-hover:scale-105 border-2 border-transparent hover:border-yellow-300'
                            }
                            active:scale-95
                          `}>
                            <input
                              type="radio"
                              name={skill}
                              value={valor}
                              checked={isSelected}
                              onChange={() => avaliarSkill(skill, valor)}
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
          )}
        </div>

        {/* Footer fixo com botão - não faz scroll */}
        <div className="flex-shrink-0 px-4 md:px-8 py-4 md:py-5 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm">
          {etapa === "selecao" ? (
            <button
              onClick={prosseguirParaAvaliacao}
              className="w-full max-w-lg mx-auto block py-3 md:py-3.5 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold text-sm md:text-base text-gray-900 transition-all hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={skillsSelecionadas.length !== 5}
            >
              {skillsSelecionadas.length === 5 
                ? '🎯 Prosseguir para Avaliação' 
                : `Selecione mais ${5 - skillsSelecionadas.length} habilidade${5 - skillsSelecionadas.length > 1 ? 's' : ''}`
              }
            </button>
          ) : (
            <button
              type="submit"
              onClick={finalizarQuestionario}
              className="w-full max-w-lg mx-auto block py-3 md:py-3.5 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold text-sm md:text-base text-gray-900 transition-all hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
            >
              ✨ Finalizar e Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

