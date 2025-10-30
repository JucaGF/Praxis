import React, { useState } from "react";
// Importar o cliente Supabase
import { supabase } from "../lib/supabaseClient";
// Importe o link se você estiver usando react-router-dom para a navegação de login/cadastro
import { Link } from "react-router-dom";

// Se você estiver usando o LoadingSpinner.jsx, importe ele aqui
// import LoadingSpinner from "../components/LoadingSpinner";

export default function Cadastro() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    profissao: "", // Mantemos para o questionário
  });

  const [etapa, setEtapa] = useState("cadastro"); // "cadastro" | "questionario" | "finalizado"
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false); // Novo estado para loading

  // Envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem("");

    // Se não houver profissão, abre o questionário
    if (!formData.profissao) {
      setEtapa("questionario");
      return;
    }

    setLoading(true);

    // --- INTEGRAÇÃO SUPABASE ---
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.senha,
      options: {
        data: {
          nome: formData.nome, // Metadado: nome
          profissao: formData.profissao, // Metadado: profissao
        },
      },
    });
    // --- FIM INTEGRAÇÃO SUPABASE ---

    setLoading(false);

    if (error) {
      // Exemplo de tratamento de erro do Supabase
      setMensagem(`Erro ao cadastrar: ${error.message}.`);
      setEtapa("cadastro"); // Volta para a primeira tela em caso de erro
      return;
    }

    // Sucesso - o Supabase envia um email de confirmação por padrão
    setMensagem(
      `Cadastro de ${formData.nome} realizado com sucesso! Verifique seu e-mail (${formData.email}) para confirmar sua conta e fazer login.`
    );
    setEtapa("finalizado");
  };

  // Escolha da profissão no questionário
  const selecionarProfissao = (profissaoEscolhida) => {
    // 1. Atualiza o formData com a profissão escolhida
    const novosDados = { ...formData, profissao: profissaoEscolhida };
    setFormData(novosDados);

    // 2. Chama a função de submissão com a profissão preenchida
    // Criamos um mock de evento para re-utilizar o handleSubmit
    handleSubmit({ preventDefault: () => {} });
  };

  // Seu código de renderização do componente...
  return (
    <div className="flex min-h-screen">
      {/* ... (LADO ESQUERDO permanece o mesmo) ... */}
      <div className="hidden md:flex w-[35%] bg-yellow-400 text-black flex-col relative overflow-hidden">
        <div className="flex flex-col h-full items-center">
          {/* --- Primeiro terço: Título --- */}
          <div className="flex-1 flex justify-center items-center px-6 w-full">
            <h1 className="text-4xl font-bold leading-snug text-center max-w-md">
              Veja seu potencial sendo elevado ao máximo
            </h1>
          </div>
          {/* --- Segundo terço: Descrição --- */}
          <div className="flex-1 flex justify-center items-center px-6 w-full">
            <p className="text-lg text-center max-w-md">
              Prepare-se para o mercado de trabalho com a{" "}
              <span className="font-semibold">Praxis</span> — a plataforma que
              simula tarefas, fornece feedbacks e ajuda você a evoluir
              continuamente.
            </p>
          </div>
          {/* --- Terceiro terço: Escada Lateral do Sucesso --- */}
          <div className="flex-1 flex justify-start items-center px-6 pb-8 w-full">
            <div className="relative w-[420px] h-80 flex items-end ml-12">
              <div className="relative">
                <div className="absolute bottom-0 left-0 w-72 h-6 bg-black rounded-r-sm animate-step-1"></div>
                <div className="absolute bottom-12 left-8 w-64 h-6 bg-black rounded-r-sm animate-step-2"></div>
                <div className="absolute bottom-24 left-16 w-56 h-6 bg-black rounded-r-sm animate-step-3"></div>
                <div className="absolute bottom-36 left-24 w-48 h-6 bg-black rounded-r-sm animate-step-4"></div>
                <div className="absolute bottom-48 left-32 w-40 h-6 bg-black rounded-r-sm animate-step-5"></div>
                <div className="absolute bottom-56 left-[11.5rem] flex flex-col items-center">
                  <svg
                    className="w-20 h-20 text-black animate-pulse-glow"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- LADO DIREITO --- */}
      <div className="w-full md:w-[65%] flex flex-col justify-center items-center bg-white p-10">
        <div className="w-full max-w-sm">
          {/* Exibir mensagem de erro ou sucesso */}
          {mensagem && etapa !== "finalizado" && (
            <div
              className={`p-3 mb-4 rounded-lg text-sm font-medium ${
                mensagem.includes("sucesso")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {mensagem}
            </div>
          )}

          {/* === ETAPA 1: FORMULÁRIO DE CADASTRO === */}
          {etapa === "cadastro" && (
            <>
              <h2 className="text-3xl font-semibold mb-8 text-center text-gray-800">
                Crie sua conta Praxis
              </h2>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Digite seu nome"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Digite seu email"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={(e) =>
                      setFormData({ ...formData, senha: e.target.value })
                    }
                    placeholder="Crie uma senha (mínimo 6 caracteres)"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>

                {/* Botão de criar conta */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-medium transition ${
                    loading
                      ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                      : "bg-yellow-400 hover:bg-yellow-500 text-black"
                  }`}
                >
                  {loading ? "Aguarde..." : "Criar conta"}
                </button>
              </form>
            </>
          )}

          {/* === ETAPA 2: QUESTIONÁRIO DE PROFISSÃO === */}
          {etapa === "questionario" && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Qual área você quer seguir?
              </h2>
              <p className="text-gray-600 mb-8">
                Escolha a profissão que melhor representa seu perfil.
              </p>

              {loading && (
                <p className="text-yellow-600 font-medium mb-4">
                  Finalizando cadastro...
                </p>
              )}

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => selecionarProfissao("Desenvolvedor Frontend")}
                  disabled={loading}
                  className="border border-yellow-400 hover:bg-yellow-400 hover:text-black text-yellow-500 font-medium py-3 rounded-lg transition disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300"
                >
                  Desenvolvedor Frontend
                </button>
                <button
                  onClick={() => selecionarProfissao("Desenvolvedor Backend")}
                  disabled={loading}
                  className="border border-yellow-400 hover:bg-yellow-400 hover:text-black text-yellow-500 font-medium py-3 rounded-lg transition disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300"
                >
                  Desenvolvedor Backend
                </button>
                <button
                  onClick={() => selecionarProfissao("Engenheiro de Dados")}
                  disabled={loading}
                  className="border border-yellow-400 hover:bg-yellow-400 hover:text-black text-yellow-500 font-medium py-3 rounded-lg transition disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300"
                >
                  Engenheiro de Dados
                </button>
              </div>
            </div>
          )}

          {/* === ETAPA 3: FINALIZAÇÃO === */}
          {etapa === "finalizado" && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-green-600 mb-4">
                Quase lá! Confirme seu e-mail
              </h2>
              <p className="text-gray-700">{mensagem}</p>
              <p className="mt-4 text-sm text-gray-500">
                Após a confirmação, você pode acessar sua área de evolução na
                Praxis 🚀
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block bg-yellow-400 hover:bg-yellow-500 text-black py-2 px-6 rounded-lg font-medium transition"
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
