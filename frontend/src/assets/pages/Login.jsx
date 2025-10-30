import React, { useState, useEffect } from "react";
// Importar useAuth e useNavigate para redirecionamento
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

const LinkedInIcon = () => (
  // ... (SVG Code) ...
  <svg
    className="w-5 h-5 mr-2"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4.98 3.5c0 1.381-1.11 2.5-2.489 2.5C1.11 6 0 4.881 0 3.5S1.11 1 2.491 1C3.869 1 4.98 2.119 4.98 3.5zm-2.5 5.5H5v14H2.48v-14zM8.254 8h5.084v2.18h.073c.712-1.34 2.457-2.18 4.93-2.18 5.27 0 6.24 3.46 6.24 7.96v9.04h-5.08V16.7c0-1.85-.353-3.12-1.996-3.12-1.638 0-1.87 1.25-1.87 3.09v6.33H8.254V8z" />
  </svg>
);

export default function Login() {
  // Substituímos o estado local isLoggedIn pelo useAuth
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redireciona se o usuário já estiver logado
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/home"); // ← MUDAR DE "/" PARA "/home"
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(
        `Erro ao entrar: ${authError.message}. Verifique seu e-mail e senha.`
      );
    }
    // Se o login for bem-sucedido, o 'useAuth' detectará a mudança e o useEffect acima fará o redirecionamento.
  };

  // Se o hook de auth estiver carregando o estado inicial, mostre um loading.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 font-sans">
        <p className="text-xl font-medium text-gray-700">Carregando...</p>
      </div>
    );
  }

  // O restante do seu componente de Login (HTML)
  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans relative overflow-hidden">
      {/* ... (Seu código de estilos, formas geométricas e CONTEÚDO PRINCIPAL) ... */}

      <style>{`
          @keyframes floatY { 
            0%{transform:translateY(0)} 
            50%{transform:translateY(-8px)} 
            100%{transform:translateY(0)} 
          }
          .float-slow{animation:floatY 8s ease-in-out infinite}
        `}</style>

      {/* FORMAS GEOMÉTRICAS - AUMENTADO PARA 120 FORMAS */}
      {/* ... (Seu código das formas geométricas) ... */}
      {Array.from({ length: 120 }).map((_, i) => {
        let left, top;
        let validPosition = false;

        while (!validPosition) {
          left = Math.random() * 100;
          top = Math.random() * 100;

          // ÁREAS PROTEGIDAS:
          const isInLoginArea = left > 12 && left < 46 && top > 7 && top < 92;
          const isInTextArea = left > 60 && top > 70;
          const isNearPhotos =
            (left > 70 && left < 90 && top > 10 && top < 25) ||
            (left > 85 && top > 60 && top < 80) ||
            (left > 15 && left < 35 && top > 75) ||
            (left < 20 && top < 25);

          validPosition = !isInLoginArea && !isInTextArea && !isNearPhotos;
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

      {/* FORMAS GEOMÉTRICAS PEQUENAS NO LUGAR DAS FOTOS - MESMO TAMANHO DAS OUTRAS */}

      {/* Forma 1 - Círculo Pequeno (no lugar do Arda) */}
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

      {/* Forma 2 - Retângulo Pequeno (no lugar do Hakim) */}
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

      {/* Forma 3 - Círculo Pequeno (no lugar do Kenan) */}
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

      {/* Forma 4 - Retângulo Pequeno (no lugar do Igor) */}
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

      {/* Forma 5 - Círculo Pequeno (no lugar do Marlon) */}
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
        {/* Área de login */}
        <div className="flex items-center">
          <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-100">
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Praxis</h2>
              <p className="text-sm text-gray-500 font-medium">
                Seu trabalho na sua frente.
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
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Usuário (E-mail)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 text-sm transition duration-150"
                  placeholder="Seu e-mail"
                  disabled={loading}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Senha
                  </label>
                  <a
                    href="#"
                    className="text-sm font-medium text-yellow-600 hover:text-yellow-700"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 text-sm transition duration-150"
                  placeholder="Sua senha"
                  disabled={loading}
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
                      : "bg-yellow-500 hover:bg-yellow-600 shadow-sm text-white"
                  } `}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-600">
                  Não possui uma conta?{" "}
                  <Link
                    to="/cadastro"
                    className="font-semibold text-yellow-600 hover:text-yellow-700"
                  >
                    Cadastre-se agora
                  </Link>
                </p>
              </div>
            </form>

            <div className="pt-6 border-t border-gray-100 mt-8 text-center">
              <h1 className="text-xs text-gray-400 font-semibold tracking-widest uppercase">
                SIMULE | PRATIQUE | EVOLUA
              </h1>
            </div>
          </div>
        </div>

        {/* Frases */}
        <aside className="flex items-end justify-end">
          <div className="w-full max-w-md relative h-[560px] flex items-end justify-end">
            <div className="absolute right-0 bottom-4 text-right z-30">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-1">
                SUA MISSÃO
              </h2>
              <h3 className="text-3xl md:text-4xl font-bold text-yellow-500 tracking-tight mb-4">
                NOSSA MISSÃO
              </h3>
              <p className="text-sm text-gray-600 max-w-xs ml-auto leading-relaxed">
                Potencialize suas habilidades profissionais em simulações reais
                de tarefa
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
