// src/assets/pages/Questionario_hard_dados.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function QuestionarioHardDados() {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state?.formData;

  const [mostrarSaudacao, setMostrarSaudacao] = useState(true);
  const [respostas, setRespostas] = useState({});
  const [mensagem, setMensagem] = useState("");

  const perguntas = [
    {
      categoria: "Linguagens e Manipulação de Dados",
      questoes: ["SQL", "Python", "Java"],
    },
    {
      categoria: "Modelagem e Estrutura de Dados",
      questoes: ["Modelagem de dados"],
    },
    {
      categoria: "Bancos de Dados e Armazenamento",
      questoes: ["Bancos de dados relacionais", "Armazenamento de dados"],
    },
    {
      categoria: "Infraestrutura e Cloud Computing",
      questoes: ["Cloud Computing"],
    },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleResposta = (categoria, indice, valor) => {
    setRespostas((prev) => ({
      ...prev,
      [`${categoria}-${indice}`]: valor,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const totalRespostas = Object.keys(respostas).length;
    const totalPerguntas = perguntas.reduce(
      (acc, cat) => acc + cat.questoes.length,
      0
    );

    if (totalRespostas < totalPerguntas) {
      setMensagem("Por favor, responda todas as perguntas antes de continuar.");
      return;
    }

    setMensagem("Questionário concluído! Redirecionando...");

    // ✅ Redireciona direto para a tela final do cadastro (etapa 3)
    setTimeout(() => {
      navigate("/cadastro", { state: { etapa: "finalizado", formData } });
    }, 2000);
  };

  const handleVoltar = () => navigate(-1);

  // --- Fundo animado reutilizável ---
  const FundoAnimado = () =>
    Array.from({ length: 150 }).map((_, i) => {
      let left, top;
      let validPosition = false;
      while (!validPosition) {
        left = Math.random() * 100;
        top = Math.random() * 100;
        const isInFormArea = left > 25 && left < 75 && top > 15 && top < 85;
        validPosition = !isInFormArea;
      }
      return (
        <div
          key={i}
          className={`absolute ${["w-3 h-3", "w-4 h-4", "w-5 h-5"][i % 3]} ${
            [
              "bg-yellow-400/70",
              "bg-yellow-500/60",
              "bg-amber-400/70",
              "bg-yellow-300/70",
              "bg-yellow-600/40",
            ][i % 5]
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
    });

  // --- Tela de Boas-vindas (preenche toda a tela com fundo e container centralizado) ---
  if (mostrarSaudacao) {
    return (
      <div className="relative min-h-screen w-full flex justify-center items-center bg-white overflow-hidden">
        <FundoAnimado />

        <div className="relative z-10 w-full max-w-3xl mx-auto bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border border-gray-200 p-10 flex flex-col items-center text-center h-[85vh] justify-center">
          <img src="/Logo.png" alt="Praxis" className="w-40 h-40 mb-6" />
          <h1 className="text-3xl font-semibold text-gray-800 mb-4">
            Questionário de Hard Skills (Engenharia de Dados)
          </h1>
          <p className="text-gray-600 max-w-md text-sm leading-relaxed mb-6">
            Respire fundo. Este questionário avalia seu conhecimento técnico
            atual em engenharia de dados. Seja sincero nas respostas — isso nos
            ajuda a construir um plano de aprendizado sob medida para você.
          </p>
          <button
            onClick={() => setMostrarSaudacao(false)}
            className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 rounded-lg font-medium text-black transition shadow-md"
          >
            Começar
          </button>
        </div>
      </div>
    );
  }

  // --- Questionário ---
  return (
    <div className="relative min-h-screen bg-white overflow-hidden flex justify-center items-center">
      <FundoAnimado />

      {/* Container centralizado */}
      <div className="relative z-10 flex flex-col justify-center items-center w-full max-w-3xl h-[85vh] bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border border-gray-200 p-10 overflow-hidden">
        {/* Botão voltar */}
        <button
          onClick={handleVoltar}
          className="absolute top-6 left-6 text-gray-600 hover:text-gray-800 font-medium transition flex items-center gap-2 text-sm"
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

        <div className="w-full h-full overflow-y-auto px-4">
          <img
            src="/Logo.png"
            alt="Praxis"
            className="w-32 h-32 mb-6 mx-auto"
          />

          <h2 className="text-2xl font-semibold text-gray-900 mb-3 text-center">
            Hard Skills — Engenharia de Dados
          </h2>
          <p className="text-gray-600 mb-5 text-sm text-center">
            Avalie-se de 0 a 5 (0 = nenhum conhecimento, 5 = amplo
            conhecimento).
          </p>

          {mensagem && (
            <div
              className={`p-3 mb-4 rounded-lg text-sm font-medium text-center ${
                mensagem.includes("concluído")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {mensagem}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {perguntas.map((grupo, i) => (
              <div key={i} className="space-y-4">
                <h3 className="text-lg font-semibold text-yellow-600 border-b pb-1 text-center">
                  {grupo.categoria}
                </h3>
                {grupo.questoes.map((q, j) => (
                  <div key={j}>
                    <p className="text-gray-800 text-sm mb-1 text-center">
                      {q}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500 max-w-sm mx-auto">
                      {[0, 1, 2, 3, 4, 5].map((valor) => (
                        <label
                          key={valor}
                          className="flex flex-col items-center"
                        >
                          <input
                            type="radio"
                            name={`${grupo.categoria}-${j}`}
                            value={valor}
                            checked={
                              respostas[`${grupo.categoria}-${j}`] === valor
                            }
                            onChange={() =>
                              handleResposta(grupo.categoria, j, valor)
                            }
                            className="accent-yellow-500 cursor-pointer"
                            required
                          />
                          {valor}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-3 rounded-lg font-medium bg-yellow-400 hover:bg-yellow-500 text-black transition text-sm mt-6 cursor-pointer shadow-md"
            >
              Enviar respostas
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
