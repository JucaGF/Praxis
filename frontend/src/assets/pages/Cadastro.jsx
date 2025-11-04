// src/pages/Cadastro.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import PraxisLogo from "../components/PraxisLogo";

const LinkedInIcon = () => (
  <svg
    className="w-5 h-5 mr-2"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4.98 3.5c0 1.381-1.11 2.5-2.489 2.5C1.11 6 0 4.881 0 3.5S1.11 1 2.491 1C3.869 1 4.98 2.119 4.98 3.5zm-2.5 5.5H5v14H2.48v-14zM8.254 8h5.084v2.18h.073c.712-1.34 2.457-2.18 4.93-2.18 5.27 0 6.24 3.46 6.24 7.96v9.04h-5.08V16.7c0-1.85-.353-3.12-1.996-3.12-1.638 0-1.87 1.25-1.87 3.09v6.33H8.254V8z" />
  </svg>
);

export default function Cadastro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    career_goal: "",
  });
  
  const [etapa, setEtapa] = useState("cadastro"); // "cadastro" | "questionario" | "finalizado"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Se não houver trilha de carreira, abre o questionário
    if (!formData.career_goal) {
      setEtapa("questionario");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.senha,
      options: {
        data: {
          full_name: formData.nome,
          nome: formData.nome,
          career_goal: formData.career_goal,
        },
      },
    });

    setLoading(false);

    if (authError) {
      setError(`Erro ao criar conta: ${authError.message}`);
      setEtapa("cadastro");
    } else {
      setEtapa("finalizado");
    }
  };

  const selecionarCarreira = (trilhaEscolhida) => {
    const novosDados = { ...formData, career_goal: trilhaEscolhida };
    setFormData(novosDados);
    
    // Simula o submit com a carreira escolhida
    const mockEvent = { preventDefault: () => {} };
    const tempFormData = formData;
    formData.career_goal = trilhaEscolhida;
    handleSubmit(mockEvent);
    setFormData(tempFormData);
  };

  // Renderização do conteúdo baseado na etapa
  const renderContent = () => {
    if (etapa === "finalizado") {
      return (
        <div className="text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro realizado!</h2>
          <p className="text-gray-600 mb-6">
            Verifique seu e-mail ({formData.email}) para confirmar sua conta e fazer login.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition"
          >
            Ir para Login
          </Link>
        </div>
      );
    }

    if (etapa === "questionario") {
      return (
        <div>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Escolha sua trilha</h2>
            <p className="text-sm text-gray-600">
              Selecione a área que você deseja focar seus estudos
            </p>
          </div>

          <div className="space-y-3">
            {[
              { value: "frontend", label: "Frontend Developer", icon: "💻", desc: "React, Vue, Angular" },
              { value: "backend", label: "Backend Developer", icon: "⚙️", desc: "Node.js, Python, Java" },
              { value: "fullstack", label: "Fullstack Developer", icon: "🚀", desc: "Frontend + Backend" },
              { value: "mobile", label: "Mobile Developer", icon: "📱", desc: "React Native, Flutter" },
              { value: "data", label: "Data Science", icon: "📊", desc: "Python, ML, Analytics" },
              { value: "devops", label: "DevOps", icon: "🔧", desc: "CI/CD, Cloud, Docker" },
            ].map((trilha) => (
              <button
                key={trilha.value}
                onClick={() => selecionarCarreira(trilha.value)}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
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

          <button
            onClick={() => setEtapa("cadastro")}
            className="mt-6 w-full text-center text-sm text-gray-600 hover:text-gray-900"
          >
            ← Voltar
          </button>
        </div>
      );
    }

    // Etapa de cadastro (formulário inicial)
    return (
      <>
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <PraxisLogo className="h-16" />
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Crie sua conta e comece a evoluir.
          </p>
        </div>

        <div className="mb-6">
          <button
            type="button"
            className="w-full flex items-center justify-center py-3 px-4 rounded-lg shadow-sm text-base font-semibold text-white transition duration-150 ease-in-out bg-blue-600 hover:bg-blue-700"
          >
            <LinkedInIcon />
            Conecte-se com o LinkedIn
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-4 text-gray-400 text-sm font-medium">OU</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 text-sm transition duration-150"
              placeholder="Seu nome completo"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 text-sm transition duration-150"
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 text-sm transition duration-150"
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 text-sm rounded-lg" role="alert">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-sm font-semibold transition duration-150 ${
                loading
                  ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-600 shadow-sm text-white cursor-pointer"
              }`}
            >
              {loading ? "Criando conta..." : "Continuar"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              Já possui uma conta?{" "}
              <Link to="/login" className="font-semibold text-yellow-600 hover:text-yellow-700">
                Entrar agora
              </Link>
            </p>
          </div>
        </form>

        <div className="pt-6 border-t border-gray-100 mt-8 text-center">
          <h1 className="text-xs text-gray-400 font-semibold tracking-widest uppercase">
            SIMULE | PRATIQUE | EVOLUA
          </h1>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans relative overflow-hidden">
      {/* Botão Voltar */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar
      </Link>

      <style>{`
        @keyframes floatY { 
          0%{transform:translateY(0)} 
          50%{transform:translateY(-8px)} 
          100%{transform:translateY(0)} 
        }
        .float-slow{animation:floatY 8s ease-in-out infinite}
      `}</style>

      {/* FORMAS GEOMÉTRICAS */}
      {Array.from({ length: 120 }).map((_, i) => {
        let left, top;
        let validPosition = false;

        while (!validPosition) {
          left = Math.random() * 100;
          top = Math.random() * 100;

          const isInFormArea = left > 12 && left < 46 && top > 7 && top < 92;
          const isInTextArea = left > 60 && top > 70;
          const isNearPhotos =
            (left > 70 && left < 90 && top > 10 && top < 25) ||
            (left > 85 && top > 60 && top < 80) ||
            (left > 15 && left < 35 && top > 75) ||
            (left < 20 && top < 25);

          validPosition = !isInFormArea && !isInTextArea && !isNearPhotos;
        }

        return (
          <div
            key={i}
            className={`absolute ${
              ["w-3 h-3", "w-4 h-4", "w-5 h-5", "w-6 h-6"][i % 4]
            } ${
              [
                "bg-yellow-500/70",
                "bg-yellow-600/60",
                "bg-amber-500/70",
                "bg-yellow-400/80",
                "bg-gray-900/50",
                "bg-yellow-700/50",
              ][i % 6]
            } ${["rounded-full", "rounded-lg"][i % 2]} float-slow`}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
              opacity: 0.6 + Math.random() * 0.3,
              zIndex: 1,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        );
      })}

      {/* FORMAS GEOMÉTRICAS PEQUENAS */}
      <div className="absolute rounded-full bg-yellow-500/70 float-slow z-20" style={{ top: "8%", left: "8%", width: "24px", height: "24px", animationDelay: "1s" }} />
      <div className="absolute rounded-lg bg-yellow-600/60 float-slow z-20 rotate-6" style={{ bottom: "20%", left: "24%", width: "20px", height: "20px", animationDelay: "2s" }} />
      <div className="absolute rounded-full bg-amber-500/70 float-slow z-20 -rotate-3" style={{ top: "12%", right: "12%", width: "16px", height: "16px", animationDelay: "3s" }} />
      <div className="absolute rounded-lg bg-yellow-400/80 float-slow z-20 rotate-8" style={{ top: "32%", right: "32%", width: "24px", height: "24px", animationDelay: "4s" }} />
      <div className="absolute rounded-full bg-yellow-500/70 float-slow z-20" style={{ bottom: "32%", left: "50%", transform: "translateX(-50%)", width: "20px", height: "20px", animationDelay: "5s" }} />

      {/* CONTEÚDO PRINCIPAL */}
      <div className="w-full max-w-7xl mx-6 lg:mx-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-30">
        {/* Área de cadastro */}
        <div className="flex items-center">
          <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-100">
            {renderContent()}
          </div>
        </div>

        {/* Frases */}
        <aside className="flex items-end justify-end">
          <div className="w-full max-w-md relative h-[560px] flex items-end justify-end">
            <div className="absolute right-0 bottom-4 text-right z-30">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-1">
                PREPARE-SE
              </h2>
              <h3 className="text-3xl md:text-4xl font-bold text-yellow-500 tracking-tight mb-4">
                PARA O FUTURO
              </h3>
              <p className="text-sm text-gray-600 max-w-xs ml-auto leading-relaxed">
                Desenvolva suas habilidades profissionais com desafios práticos e feedback personalizado
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
