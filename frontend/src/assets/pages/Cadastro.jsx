// src/pages/Cadastro.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Cadastro() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    career_goal: "",
  });

  const [etapa, setEtapa] = useState("cadastro"); // cadastro | questionario | finalizado
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Scroll automático para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- Envio do formulário ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem("");

    if (!formData.career_goal) {
      setEtapa("questionario");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
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

    if (error) {
      setMensagem(`Erro ao cadastrar: ${error.message}`);
      setEtapa("cadastro");
      return;
    }

    setMensagem(
      `Cadastro de ${formData.nome} realizado com sucesso! Verifique seu e-mail (${formData.email}) para confirmar sua conta e fazer login.`
    );
    setEtapa("finalizado");
  };

  const selecionarCarreira = (trilhaEscolhida) => {
    const novosDados = { ...formData, career_goal: trilhaEscolhida };
    setFormData(novosDados);
    handleSubmit({ preventDefault: () => {} });
  };

  const handleVoltar = () => {
    navigate("/");
  };

  return (
    <div className="relative h-screen bg-white overflow-hidden">
      {/* BOTÃO VOLTAR - SEM MOLDURA COMO NA IMAGEM */}
      <button
        onClick={handleVoltar}
        className="fixed top-6 left-6 z-[100] text-gray-600 hover:text-gray-800 font-medium transition flex items-center gap-2 text-sm"
      >
        <svg
          className="w-4 h-4"
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
      </button>

      {/* FORMAS GEOMÉTRICAS - DISTRIBUÍDAS POR TODA A TELA */}
      {Array.from({ length: 180 }).map((_, i) => {
        let left, top;
        let validPosition = false;

        // Distribui formas por toda a tela, incluindo área à direita
        while (!validPosition) {
          left = Math.random() * 100;
          top = Math.random() * 100;

          // Permite formas em praticamente toda a tela, exceto uma pequena área central
          const isInFormArea = left > 38 && left < 53 && top > 10 && top < 90;
          validPosition = !isInFormArea;
        }

        return (
          <div
            key={i}
            className={`absolute ${
              [
                "w-3 h-3",
                "w-4 h-4",
                "w-5 h-5",
                "w-6 h-6",
                "w-2 h-2",
                "w-7 h-7",
              ][i % 6]
            } ${
              [
                "bg-yellow-500/70",
                "bg-yellow-600/60",
                "bg-amber-500/70",
                "bg-yellow-400/80",
                "bg-gray-900/50",
                "bg-yellow-700/50",
                "bg-amber-600/60",
                "bg-yellow-300/70",
              ][i % 8]
            } ${
              ["rounded-full", "rounded-lg", "rounded-md"][i % 3]
            } float-slow`}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
              opacity: 0.5 + Math.random() * 0.4,
              zIndex: 1,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        );
      })}

      {/* CONTAINER PRINCIPAL */}
      <div className="relative z-10 flex flex-col justify-center items-start w-full max-w-md h-screen p-8 ml-28 md:ml-52 bg-white shadow-2xl md:rounded-r-[3rem] border-r border-gray-200">
        <div className="w-full max-h-[90vh] overflow-hidden flex flex-col justify-center">
          <img
            src="/logo.png"
            alt="Praxis"
            className="w-44 h-44 mb-8 self-center"
          />

          {/* Mensagem */}
          {mensagem && etapa !== "finalizado" && (
            <div
              className={`p-3 mb-6 rounded-lg text-sm font-medium ${
                mensagem.includes("sucesso")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {mensagem}
            </div>
          )}

          {/* ETAPA 1 - Cadastro */}
          {etapa === "cadastro" && (
            <form onSubmit={handleSubmit} className="w-full space-y-5">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Crie sua conta Praxis
              </h2>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Digite seu nome"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Digite seu email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Senha
                </label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) =>
                    setFormData({ ...formData, senha: e.target.value })
                  }
                  placeholder="Crie uma senha (mínimo 6 caracteres)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-medium transition text-sm ${
                  loading
                    ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                    : "bg-yellow-400 hover:bg-yellow-500 text-black cursor-pointer"
                }`}
              >
                {loading ? "Aguarde..." : "Criar conta"}
              </button>

              <p className="text-xs text-gray-600 text-center">
                Já tem conta?{" "}
                <Link to="/login" className="text-yellow-600 hover:underline">
                  Faça login
                </Link>
              </p>
            </form>
          )}

          {/* ETAPA 2 - Questionário */}
          {etapa === "questionario" && (
            <div className="w-full text-center">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">
                Qual trilha de carreira você quer seguir?
              </h2>
              <p className="text-gray-600 mb-8 text-sm">
                Escolha a área que melhor representa seu objetivo profissional.
              </p>

              <div className="flex flex-col gap-4">
                {[
                  "Desenvolvedor Frontend",
                  "Desenvolvedor Backend",
                  "Desenvolvedor Full Stack",
                  "Engenheiro de Dados",
                ].map((opcao) => (
                  <button
                    key={opcao}
                    onClick={() => selecionarCarreira(opcao)}
                    disabled={loading}
                    className="border border-yellow-400 hover:bg-yellow-400 hover:text-black text-yellow-600 font-medium py-3 rounded-lg transition disabled:bg-gray-100 disabled:text-gray-400 text-sm cursor-pointer"
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ETAPA 3 - Confirmação */}
          {etapa === "finalizado" && (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-green-600 mb-4">
                Quase lá! Confirme seu e-mail
              </h2>
              <p className="text-gray-700 text-sm">{mensagem}</p>
              <p className="mt-4 text-xs text-gray-500">
                Após a confirmação, você pode acessar sua área de evolução na
                Praxis 🚀
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block bg-yellow-400 hover:bg-yellow-500 text-black py-2 px-6 rounded-lg font-medium transition text-sm cursor-pointer"
              >
                Ir para o Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
