// src/assets/pages/Questionario_soft.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function QuestionarioSoft() {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state?.formData;

  const perguntas = [
    {
      categoria: "Comunicação",
      questoes: [
        "Eu consigo explicar claramente problemas técnicos para membros não técnicos.",
        "Quando escrevo código, sempre deixo comentários explicativos.",
        "Eu evito mensagens vagas ou mal estruturadas em equipes de desenvolvimento.",
      ],
    },
    {
      categoria: "Organização",
      questoes: [
        "Eu sempre divido minhas tarefas em pequenas etapas e as ordeno por prioridade.",
        "Eu me sinto confortável planejando minhas atividades ao longo da semana.",
        "Eu consigo gerenciar vários projetos ao mesmo tempo sem perder prazos.",
      ],
    },
    {
      categoria: "Resolução de Problemas",
      questoes: [
        "Eu costumo identificar rapidamente a causa raiz dos problemas.",
        "Quando me deparo com um erro no código, eu sei como investigar até encontrar a solução.",
        "Eu sou capaz de resolver problemas complexos de lógica de forma eficiente.",
      ],
    },
  ];

  const [respostas, setRespostas] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [iniciado, setIniciado] = useState(false);

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
    setTimeout(() => {
      const carreira = formData?.career_goal;

      if (carreira === "Desenvolvedor Backend") {
        navigate("/questionario-hard-back", { state: { formData } });
      } else if (carreira === "Desenvolvedor Frontend") {
        navigate("/questionario-hard-front", { state: { formData } });
      } else if (carreira === "Engenheiro de Dados") {
        navigate("/questionario-hard-dados", { state: { formData } });
      } else if (carreira === "Desenvolvedor Full Stack") {
        // ✅ Novo caso para Full Stack
        navigate("/questionario-hard-fullstack", { state: { formData } });
      } else {
        navigate("/cadastro", { state: { fromQuestionario: true, formData } });
      }
    }, 2000);
  };

  const handleVoltar = () => navigate(-1);

  return (
    <div className="relative h-screen bg-white overflow-hidden flex justify-center items-center p-6">
      {/* BOTÃO VOLTAR */}
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

      {/* FORMAS GEOMÉTRICAS DE FUNDO */}
      {Array.from({ length: 150 }).map((_, i) => {
        let left, top;
        let validPosition = false;
        while (!validPosition) {
          left = Math.random() * 100;
          top = Math.random() * 100;
          const isInFormArea = left > 30 && left < 70 && top > 15 && top < 85;
          validPosition = !isInFormArea;
        }
        return (
          <div
            key={i}
            className={`absolute ${["w-3 h-3", "w-4 h-4", "w-5 h-5"][i % 3]} ${
              [
                "bg-yellow-400/70",
                "bg-yellow-500/50",
                "bg-amber-400/60",
                "bg-yellow-300/50",
              ][i % 4]
            } rounded-full float-slow`}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              opacity: 0.3 + Math.random() * 0.3,
              zIndex: 1,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        );
      })}

      {/* CONTAINER PRINCIPAL */}
      <div className="relative z-10 w-full max-w-4xl bg-white shadow-2xl rounded-3xl p-10 md:p-12 border border-gray-200 text-center h-[85vh] flex flex-col justify-center">
        {!iniciado ? (
          <div className="flex flex-col items-center justify-center space-y-6">
            <img
              src="/Logo.png"
              alt="Praxis"
              className="w-40 h-40 opacity-90 mb-4"
            />
            <h2 className="text-2xl font-semibold text-gray-900">
              Bem-vindo(a)!
            </h2>
            <p className="text-gray-600 max-w-md leading-relaxed">
              Antes de começar, respire fundo. Este é um momento para o
              conhecermos melhor — não há respostas certas ou erradas. Seja
              sincero e responda com tranquilidade, pois suas respostas nos
              ajudarão a guiá-lo(a) na sua jornada.
            </p>
            <button
              onClick={() => setIniciado(true)}
              className="px-6 py-3 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black font-medium transition mt-4"
            >
              Começar questionário
            </button>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto pr-2 text-left mx-auto w-[90%]">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
              Questionário de Soft Skills
            </h2>
            <p className="text-gray-600 mb-6 text-sm text-center">
              Avalie-se de 0 a 5 (0 = nunca, 5 = sempre).
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

            <form onSubmit={handleSubmit} className="space-y-8">
              {perguntas.map((grupo, i) => (
                <div key={i} className="space-y-4">
                  <h3 className="text-lg font-semibold text-yellow-600 border-b pb-2">
                    {grupo.categoria}
                  </h3>
                  {grupo.questoes.map((q, j) => (
                    <div key={j}>
                      <p className="text-gray-800 text-sm mb-2">{q}</p>
                      <div className="flex justify-between text-xs text-gray-500">
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
                className="w-full py-3 rounded-lg font-medium bg-yellow-400 hover:bg-yellow-500 text-black transition text-sm mt-8 cursor-pointer"
              >
                Enviar respostas
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
