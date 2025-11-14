// src/pages/Onboarding.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { updateAttributes } from "../lib/api";

export default function Onboarding() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState("trilha"); // "trilha" | "hardskills" | "softskills" | "salvando"
  const [carreira, setCarreira] = useState("");
  const [hardSkills, setHardSkills] = useState(null);
  const [softSkills, setSoftSkills] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mapeamento de trilhas para questionários
  const trilhaParaQuestionario = {
    "backend": "back",
    "frontend": "front",
    "fullstack": "fullstack",
    "data": "dados",
  };

  const selecionarTrilha = async (trilhaEscolhida) => {
    setCarreira(trilhaEscolhida);
    
    // Atualizar career_goal no Supabase user metadata
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { career_goal: trilhaEscolhida }
        });
      }
    } catch (err) {
      
    }
    
    setEtapa("hardskills");
  };

  const concluirHardSkills = (skillsData) => {
    
    // skillsData agora contém { tech_skills, strong_skills }
    setHardSkills(skillsData);
    
    setEtapa("softskills");
  };

  const concluirSoftSkills = async (skills) => {
    
    setSoftSkills(skills);
    setEtapa("salvando");
    setLoading(true);

    try {
      
      // Obter user ID e verificar se o usuário ainda existe
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("⚠️ Usuário não encontrado ou sessão inválida:", authError);
        // Limpar sessão e redirecionar para login
        await supabase.auth.signOut();
        navigate("/", { replace: true });
        return;
      }

      // Preparar payload
      const payload = {};
      
      if (hardSkills) {
        
        // hardSkills agora é { tech_skills, strong_skills }
        if (hardSkills.tech_skills) {
          payload.tech_skills = hardSkills.tech_skills;
          
        }
        if (hardSkills.strong_skills) {
          payload.strong_skills = hardSkills.strong_skills;
          
        }
      } else {
        
      }
      
      if (skills) {
        payload.soft_skills = skills;
        
      } else {
        
      }

      if (carreira) {
        payload.career_goal = carreira;
        
      }

      // Salvar atributos na API
      const result = await updateAttributes(user.id, payload);

      // Redirecionar para Home
      
      setTimeout(() => {
        
        navigate("/home");
      }, 1000);

    } catch (err) {
      console.error("❌ ERRO CAPTURADO ao salvar atributos:", err);
      console.error("❌ Tipo do erro:", err.name);
      console.error("❌ Mensagem:", err.message);
      console.error("❌ Stack trace:", err.stack);
      
      // Se for erro de autenticação, limpar sessão
      if (err.message?.includes("401") || err.message?.includes("Não autenticado") || err.name === "AuthenticationError") {
        
        await supabase.auth.signOut();
        navigate("/", { replace: true });
        return;
      }
      
      setError(`Erro ao salvar atributos: ${err.message}`);
      setLoading(false);
      
      setEtapa("softskills"); // Volta para a etapa anterior
    }
  };

  const voltarEtapa = () => {
    if (etapa === "softskills") {
      setEtapa("hardskills");
    } else if (etapa === "hardskills") {
      setEtapa("trilha");
    }
  };

  // Renderização dinâmica baseada na etapa
  return (
    <div className="min-h-screen bg-white">
      {etapa === "trilha" && (
        <EscolhaTrilha onSelecionarTrilha={selecionarTrilha} />
      )}
      
      {etapa === "hardskills" && (
        <QuestionarioHardSkillsWrapper
          trilha={carreira}
          tipoQuestionario={trilhaParaQuestionario[carreira]}
          onConcluir={concluirHardSkills}
          onVoltar={voltarEtapa}
        />
      )}
      
      {etapa === "softskills" && (
        <QuestionarioSoftSkillsWrapper
          onConcluir={concluirSoftSkills}
          onVoltar={voltarEtapa}
        />
      )}
      
      {etapa === "salvando" && (
        <TelaSalvando error={error} />
      )}
    </div>
  );
}

// Componente para escolher trilha de carreira
function EscolhaTrilha({ onSelecionarTrilha }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans relative overflow-hidden">
      <style>{`
        @keyframes floatY { 
          0%{transform:translateY(0)} 
          50%{transform:translateY(-8px)} 
          100%{transform:translateY(0)} 
        }
        .float-slow{animation:floatY 8s ease-in-out infinite}
      `}</style>

      {/* Fundo animado */}
      {Array.from({ length: 120 }).map((_, i) => {
        let left = Math.random() * 100;
        let top = Math.random() * 100;
        
        return (
          <div
            key={i}
            className={`absolute ${["w-3 h-3", "w-4 h-4", "w-5 h-5"][i % 3]} ${
              ["bg-yellow-500/70", "bg-yellow-600/60", "bg-amber-500/70", "bg-yellow-400/80", "bg-gray-900/50"][i % 5]
            } ${["rounded-full", "rounded-lg"][i % 2]} float-slow`}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              opacity: 0.4 + Math.random() * 0.4,
              zIndex: 1,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        );
      })}

      <div className="relative z-10 w-full max-w-2xl mx-6">
        <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <img src="/Logo.png" alt="Praxis" className="w-20 h-20 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo ao Praxis!</h2>
            <p className="text-gray-600">
              Escolha sua trilha de carreira para começar
            </p>
          </div>

          <div className="space-y-3">
            {[
              { value: "frontend", label: "Frontend Developer", desc: "React, Vue, Angular" },
              { value: "backend", label: "Backend Developer", desc: "Node.js, Python, Java" },
              { value: "fullstack", label: "Fullstack Developer", desc: "Frontend + Backend" },
              { value: "data", label: "Data Engineer", desc: "Python, SQL, Big Data" },
            ].map((trilha) => (
              <button
                key={trilha.value}
                onClick={() => onSelecionarTrilha(trilha.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{trilha.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 group-hover:text-yellow-600 transition">
                      {trilha.label}
                    </div>
                    <div className="text-sm text-gray-500">{trilha.desc}</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-yellow-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper para questionários de Hard Skills
function QuestionarioHardSkillsWrapper({ trilha, tipoQuestionario, onConcluir, onVoltar }) {
  // Importar dinâmicamente o questionário correto
  const [QuestionarioComponent, setQuestionarioComponent] = useState(null);

  React.useEffect(() => {
    const loadQuestionario = async () => {
      try {
        let module;
        if (tipoQuestionario === "back") {
          module = await import("./Questionario_hard_back.jsx");
        } else if (tipoQuestionario === "front") {
          module = await import("./Questionario_hard_front.jsx");
        } else if (tipoQuestionario === "fullstack") {
          module = await import("./Questionario_hard_fullstack.jsx");
        } else if (tipoQuestionario === "dados") {
          module = await import("./Questionario_hard_dados.jsx");
        }
        
        if (module) {
          setQuestionarioComponent(() => module.default);
        }
      } catch (err) {
        console.error("Erro ao carregar questionário:", err);
      }
    };
    
    loadQuestionario();
  }, [tipoQuestionario]);

  if (!QuestionarioComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  // Renderizar o questionário com prop especial para modo onboarding
  return <QuestionarioComponent modoOnboarding={true} onConcluir={onConcluir} onVoltar={onVoltar} />;
}

// Wrapper para questionário de Soft Skills
function QuestionarioSoftSkillsWrapper({ onConcluir, onVoltar }) {
  const [QuestionarioComponent, setQuestionarioComponent] = useState(null);

  React.useEffect(() => {
    const loadQuestionario = async () => {
      try {
        const module = await import("./Questionario_soft.jsx");
        setQuestionarioComponent(() => module.default);
      } catch (err) {
        console.error("Erro ao carregar questionário:", err);
      }
    };
    
    loadQuestionario();
  }, []);

  if (!QuestionarioComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return <QuestionarioComponent modoOnboarding={true} onConcluir={onConcluir} onVoltar={onVoltar} />;
}

// Tela de salvamento
function TelaSalvando({ error }) {
  const navigate = useNavigate();
  
  const forcarLogout = async () => {
    try {
      
      await supabase.auth.signOut();
      
      // Limpar qualquer storage do Supabase manualmente (caso necessário)
      localStorage.clear();
      sessionStorage.clear();
      
      navigate("/", { replace: true });
    } catch (err) {
      console.error("❌ Erro ao forçar logout:", err);
      alert("Erro ao limpar sessão. Tente limpar os dados do site manualmente nas configurações do navegador.");
    }
  };
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h2>
          <p className="text-red-600 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={forcarLogout}
              className="w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition cursor-pointer"
            >
              🚪 Forçar Logout e Limpar Sessão
            </button>
            
            <p className="text-xs text-gray-500 mt-2">
              Se você apagou sua conta do Supabase diretamente, clique no botão acima para limpar a sessão local.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Salvando suas informações...</h2>
        <p className="text-gray-600">Aguarde um momento</p>
      </div>
    </div>
  );
}
