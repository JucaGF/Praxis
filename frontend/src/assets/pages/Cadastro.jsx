// src/pages/Cadastro.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import PraxisLogo from "../components/PraxisLogo";

const GitHubIcon = () => (
  <svg
    className="w-5 h-5 mr-2"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

export default function Cadastro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
  });

  const [cadastroRealizado, setCadastroRealizado] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGitHubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/github-callback`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(`Erro ao conectar com GitHub: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: {
            full_name: formData.nome,
            nome: formData.nome,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      setCadastroRealizado(true);
    } catch (err) {
      setError(`Erro ao criar conta: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para reenviar email de confirmação
  const reenviarEmail = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: formData.email,
      });

      if (error) throw error;

      alert("Email de confirmação reenviado! Verifique sua caixa de entrada.");
    } catch (err) {
      setError(`Erro ao reenviar email: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Renderização do conteúdo
  const renderContent = () => {
    if (cadastroRealizado) {
      return (
        <div className="text-center">
          <div className="mb-6">
            <svg
              className="w-16 h-16 text-green-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Cadastro realizado!
          </h2>
          <p className="text-gray-600 mb-6">
            Verifique seu e-mail ({formData.email}) para confirmar sua conta e
            fazer login.
          </p>

          <div className="space-y-3">
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition w-full"
            >
              Ir para Login
            </Link>

            <button
              onClick={reenviarEmail}
              disabled={loading}
              className="text-sm text-gray-600 hover:text-gray-900 underline cursor-pointer disabled:opacity-50"
            >
              {loading
                ? "Reenviando..."
                : "Não recebeu o email? Clique para reenviar"}
            </button>
          </div>
        </div>
      );
    }

    // Formulário de cadastro
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
            onClick={handleGitHubLogin}
            className="w-full flex items-center justify-center py-3 px-4 rounded-lg shadow-sm text-base font-semibold text-white transition duration-150 ease-in-out bg-gray-800 hover:bg-gray-900 cursor-pointer"
          >
            <GitHubIcon />
            Conecte-se com o GitHub
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-4 text-gray-400 text-sm font-medium">OU</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="nome"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nome Completo
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 text-sm transition duration-150"
              placeholder="Seu nome completo"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 text-sm transition duration-150"
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              value={formData.senha}
              onChange={(e) =>
                setFormData({ ...formData, senha: e.target.value })
              }
              className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 text-sm transition duration-150"
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
              minLength={6}
            />
          </div>

          {error && (
            <div
              className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 text-sm rounded-lg"
              role="alert"
            >
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
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              Já possui uma conta?{" "}
              <Link
                to="/login"
                className="font-semibold text-yellow-600 hover:text-yellow-700"
              >
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
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition cursor-pointer"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
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
      <div
        className="absolute rounded-full bg-yellow-500/70 float-slow z-20"
        style={{
          top: "8%",
          left: "8%",
          width: "24px",
          height: "24px",
          animationDelay: "1s",
        }}
      />
      <div
        className="absolute rounded-lg bg-yellow-600/60 float-slow z-20 rotate-6"
        style={{
          bottom: "20%",
          left: "24%",
          width: "20px",
          height: "20px",
          animationDelay: "2s",
        }}
      />
      <div
        className="absolute rounded-full bg-amber-500/70 float-slow z-20 -rotate-3"
        style={{
          top: "12%",
          right: "12%",
          width: "16px",
          height: "16px",
          animationDelay: "3s",
        }}
      />
      <div
        className="absolute rounded-lg bg-yellow-400/80 float-slow z-20 rotate-8"
        style={{
          top: "32%",
          right: "32%",
          width: "24px",
          height: "24px",
          animationDelay: "4s",
        }}
      />
      <div
        className="absolute rounded-full bg-yellow-500/70 float-slow z-20"
        style={{
          bottom: "32%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "20px",
          height: "20px",
          animationDelay: "5s",
        }}
      />

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
                Desenvolva suas habilidades profissionais com desafios práticos
                e feedback personalizado
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
