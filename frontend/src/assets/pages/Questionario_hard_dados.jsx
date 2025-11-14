// src/assets/pages/Questionario_hard_dados.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TelaSaudacaoQuestionario from "../components/TelaSaudacaoQuestionario";
import PraxisLogo from "../components/PraxisLogo";

export default function QuestionarioHardDados({ modoOnboarding = false, onConcluir = null, onVoltar: onVoltarProp = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = modoOnboarding ? {} : location.state?.formData;

  const [mostrarSaudacao, setMostrarSaudacao] = useState(true);
  const [etapa, setEtapa] = useState("selecao");
  const [knownSkills, setKnownSkills] = useState([]);
  const [improveSkills, setImproveSkills] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState({});
  const [mensagem, setMensagem] = useState("");

  // Categorização de habilidades por tipo (Engenharia de Dados)
  const habilidadesDisponiveis = {
    "Linguagens de Dados (Código)": {
      tipo: "codigo",
      opcoes: ["SQL", "Python", "R", "Scala"]
    },
    "Processamento de Dados (Código)": {
      tipo: "codigo",
      opcoes: ["Pandas", "PySpark", "Apache Spark", "Apache Kafka"]
    },
    "Bancos de Dados (Código)": {
      tipo: "codigo",
      opcoes: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "BigQuery"]
    },
    "Data Warehousing (Código)": {
      tipo: "codigo",
      opcoes: ["Snowflake", "Redshift", "Data Lake"]
    },
    "ETL & Pipelines (Planejamento)": {
      tipo: "planejamento",
      opcoes: ["Airflow", "ETL Design", "Data Pipeline", "Batch Processing"]
    },
    "Cloud & Infraestrutura (Planejamento)": {
      tipo: "planejamento",
      opcoes: ["AWS", "Google Cloud", "Azure", "Docker"]
    },
    "Modelagem & Arquitetura (Planejamento)": {
      tipo: "planejamento",
      opcoes: ["Modelagem de Dados", "Data Warehouse Design", "Data Architecture"]
    },
    "Documentação & Comunicação (Comunicação)": {
      tipo: "comunicacao",
      opcoes: ["Data Documentation", "Technical Writing", "Data Visualization"]
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const findTipo = (skill) => {
    for (const categoria in habilidadesDisponiveis) {
      if (habilidadesDisponiveis[categoria].opcoes.includes(skill)) {
        return habilidadesDisponiveis[categoria].tipo;
      }
    }
    return null;
  };

  const toggleSkill = (skill) => {
    const tipo = findTipo(skill);
    const isKnown = knownSkills.includes(skill);
    const isImprove = improveSkills.includes(skill);
    
    if (isKnown) {
      setKnownSkills(knownSkills.filter(s => s !== skill));
      const countImprove = improveSkills.filter(s => findTipo(s) === tipo).length;
      if (countImprove === 0) {
        setImproveSkills([...improveSkills, skill]);
      }
    } else if (isImprove) {
      setImproveSkills(improveSkills.filter(s => s !== skill));
    } else {
      const countKnown = knownSkills.filter(s => findTipo(s) === tipo).length;
      const countImprove = improveSkills.filter(s => findTipo(s) === tipo).length;
      
      if (countKnown === 0) {
        setKnownSkills([...knownSkills, skill]);
      } else if (countImprove === 0) {
        setImproveSkills([...improveSkills, skill]);
      }
    }
  };

  const verificarRequisitos = () => {
    const tipos = ['codigo', 'planejamento', 'comunicacao'];
    const valid = tipos.every(tipo => 
      knownSkills.some(s => findTipo(s) === tipo) && 
      improveSkills.some(s => findTipo(s) === tipo)
    );
    
    return { valid, tipos };
  };

  const prosseguirParaAvaliacao = () => {
    const { valid } = verificarRequisitos();
    
    if (!valid) {
      setMensagem("Selecione 1 habilidade que você domina e 1 que deseja melhorar em cada categoria (Código, Planejamento e Comunicação).");
      return;
    }

    setMensagem("");
    setEtapa("avaliacao");
  };

  const avaliarSkill = (skill, valor) => {
    setAvaliacoes(prev => ({
      ...prev,
      [skill]: valor
    }));
  };

  // Mapeia avaliação de 0-5 para porcentagem customizada
  const mapAvaliacaoParaPorcentagem = (avaliacao) => {
    const mapeamento = {
      0: 0,
      1: 13,
      2: 20,
      3: 25,
      4: 38,
      5: 50
    };
    return mapeamento[avaliacao] || 0;
  };

  const finalizarQuestionario = (e) => {
    e.preventDefault();

    const todasSkills = [...knownSkills, ...improveSkills];
    if (Object.keys(avaliacoes).length !== todasSkills.length) {
      setMensagem(`Por favor, avalie todas as ${todasSkills.length} habilidades selecionadas.`);
      return;
    }

    const hardSkillsProcessed = {};
    Object.keys(avaliacoes).forEach(skill => {
      hardSkillsProcessed[skill] = mapAvaliacaoParaPorcentagem(avaliacoes[skill]);
    });

    // Processar strong_skills (apenas as conhecidas/amarelas)
    const strongSkillsProcessed = {};
    knownSkills.forEach(skill => {
      strongSkillsProcessed[skill] = mapAvaliacaoParaPorcentagem(avaliacoes[skill]);
    });

    setMensagem("Questionário concluído! Próxima etapa...");

    // Se está em modo onboarding, usa callback
    if (modoOnboarding && onConcluir) {
      setTimeout(() => {
        onConcluir({ 
          tech_skills: hardSkillsProcessed, 
          strong_skills: strongSkillsProcessed 
        });
      }, 1000);
    } else {
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
        titulo="Questionário de Hard Skills (Engenharia de Dados)"
        descricao="Selecione 1 habilidade que você domina e 1 que deseja melhorar em cada categoria (Código, Planejamento e Comunicação). Total: 6 habilidades. Depois, você irá avaliar seu nível em cada uma delas."
        onComecar={() => setMostrarSaudacao(false)}
        onVoltar={modoOnboarding && onVoltarProp ? onVoltarProp : () => navigate(-1)}
      />
    );
  }

  const tipos = ['codigo', 'planejamento', 'comunicacao'];
  const tipoStatus = tipos.map(tipo => ({
    tipo,
    known: knownSkills.filter(s => findTipo(s) === tipo).length,
    improve: improveSkills.filter(s => findTipo(s) === tipo).length
  }));

  return (
    <div className="relative h-screen bg-white overflow-hidden flex justify-center items-center py-6">
      <FundoAnimado />

      <div className="relative z-10 w-full max-w-5xl mx-4 h-[calc(100vh-3rem)] bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-200 flex flex-col transition-all duration-500 ease-in-out">
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
            <div className="flex items-center gap-3 mb-4">
              <PraxisLogo className="h-12 md:h-16" />
              <div className="text-left flex-1">
                {etapa === "selecao" ? (
                  <>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                      Escolha suas Habilidades
                    </h2>
                    <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                      1 que domina (amarelo) + 1 para melhorar (laranja) por categoria
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
            
            {etapa === "selecao" && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 bg-yellow-100 px-3 py-1.5 rounded-full shadow-sm">
                    <span className="text-lg font-bold text-yellow-600">{knownSkills.length}</span>
                    <span className="text-xs text-gray-600">Domina</span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-orange-100 px-3 py-1.5 rounded-full shadow-sm">
                    <span className="text-lg font-bold text-orange-600">{improveSkills.length}</span>
                    <span className="text-xs text-gray-600">Melhorar</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {tipoStatus.map(({ tipo, known, improve }) => {
                    const complete = known === 1 && improve === 1;
                    const tipoCores = {
                      codigo: { bg: 'bg-blue-100', text: 'text-blue-700', label: '💻 Código' },
                      planejamento: { bg: 'bg-purple-100', text: 'text-purple-700', label: '📋 Planejamento' },
                      comunicacao: { bg: 'bg-green-100', text: 'text-green-700', label: '💬 Comunicação' }
                    };
                    const cores = tipoCores[tipo];
                    return (
                      <span key={tipo} className={`px-2.5 py-1 rounded-full font-medium transition ${complete ? `${cores.bg} ${cores.text}` : 'bg-gray-100 text-gray-400'}`}>
                        {complete ? '✓' : '○'} {cores.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

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

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 animate-fade-in opacity-0 [animation-fill-mode:forwards]">
          {etapa === "selecao" && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {Object.entries(habilidadesDisponiveis).map(([categoria, { tipo, opcoes }]) => {
                const tipoCores = {
                  codigo: "bg-blue-50 border-blue-200 text-blue-700",
                  planejamento: "bg-purple-50 border-purple-200 text-purple-700",
                  comunicacao: "bg-green-50 border-green-200 text-green-700"
                };
                
                return (
                  <div key={categoria} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                    <div className={`px-4 py-3 border-b ${tipoCores[tipo]}`}>
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {tipo === "codigo" && "💻"}
                        {tipo === "planejamento" && "📋"}
                        {tipo === "comunicacao" && "💬"}
                        {categoria}
                      </h3>
                    </div>
                    
                    <div className="p-3 md:p-4 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {opcoes.map(skill => {
                          const isKnown = knownSkills.includes(skill);
                          const isImprove = improveSkills.includes(skill);
                          const skillTipo = findTipo(skill);
                          const countKnown = knownSkills.filter(s => findTipo(s) === skillTipo).length;
                          const countImprove = improveSkills.filter(s => findTipo(s) === skillTipo).length;
                          const canSelectKnown = countKnown < 1;
                          const canSelectImprove = countImprove < 1;
                          const isDisabled = !isKnown && !isImprove && !canSelectKnown && !canSelectImprove;
                          
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkill(skill)}
                              disabled={isDisabled}
                              className={`
                                flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-200 transform relative
                                ${isKnown
                                  ? 'bg-yellow-400 border-2 border-yellow-500 shadow-lg text-gray-900 font-semibold scale-105' 
                                  : isImprove
                                    ? 'bg-orange-400 border-2 border-orange-500 shadow-lg text-gray-900 font-semibold scale-105'
                                    : isDisabled
                                      ? 'bg-gray-50 border-2 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                      : 'bg-white border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 text-gray-700 hover:shadow-md hover:scale-105'
                                }
                                ${!isDisabled && 'cursor-pointer active:scale-95'}
                              `}
                            >
                              {(isKnown || isImprove) && (
                                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-white border-2 border-current rounded-full text-[10px] font-bold shadow-sm">
                                  {isKnown ? 'Domina' : 'Melhorar'}
                                </span>
                              )}
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                                isKnown
                                  ? 'bg-yellow-600 scale-110' 
                                  : isImprove
                                    ? 'bg-orange-600 scale-110'
                                    : 'bg-gray-100 border-2 border-gray-300'
                              }`}>
                                {(isKnown || isImprove) && (
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

          {etapa === "avaliacao" && (
            <div className="space-y-4 md:space-y-5 max-w-3xl mx-auto">
              {[...knownSkills, ...improveSkills].map((skill, index) => {
                const isKnown = knownSkills.includes(skill);
                return (
                  <div key={skill} className={`bg-white border-2 rounded-xl p-4 md:p-5 hover:shadow-lg transition-all ${isKnown ? 'border-yellow-300' : 'border-orange-300'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-sm font-bold text-gray-900 flex-shrink-0 ${isKnown ? 'bg-yellow-400' : 'bg-orange-400'}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm md:text-base">{skill}</p>
                        <span className={`text-xs font-medium ${isKnown ? 'text-yellow-600' : 'text-orange-600'}`}>
                          {isKnown ? 'Domina' : 'Melhorar'}
                        </span>
                      </div>
                    </div>
                    
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
                                ? `${isKnown ? 'bg-yellow-400 border-yellow-500' : 'bg-orange-400 border-orange-500'} shadow-lg scale-110 border-2` 
                                : `bg-gray-50 hover:${isKnown ? 'bg-yellow-50' : 'bg-orange-50'} group-hover:scale-105 border-2 border-transparent hover:${isKnown ? 'border-yellow-300' : 'border-orange-300'}`
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
                                isSelected ? 'text-gray-900' : `text-gray-600 group-hover:${isKnown ? 'text-yellow-600' : 'text-orange-600'}`
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
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-4 md:px-8 py-4 md:py-5 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm">
          {etapa === "selecao" ? (
            <button
              onClick={prosseguirParaAvaliacao}
              className="w-full max-w-lg mx-auto block py-3 md:py-3.5 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold text-sm md:text-base text-gray-900 transition-all hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={!verificarRequisitos().valid}
            >
              {verificarRequisitos().valid
                ? '🎯 Prosseguir para Avaliação' 
                : 'Selecione 1 domina + 1 melhorar em cada categoria'
              }
            </button>
          ) : (
            <button
              type="submit"
              onClick={finalizarQuestionario}
              className="w-full max-w-lg mx-auto block py-3 md:py-3.5 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold text-sm md:text-base text-gray-900 transition-all hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
            >
              Finalizar e Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
} // end QuestionarioHardDados
