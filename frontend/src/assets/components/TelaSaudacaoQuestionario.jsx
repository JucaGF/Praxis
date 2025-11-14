import React from "react";
import PraxisLogo from "./PraxisLogo";

/**
 * Componente de tela de boas-vindas para questionários
 * @param {string} titulo - Título do questionário (ex: "Questionário de Hard Skills (Backend)")
 * @param {string} descricao - Descrição do questionário
 * @param {function} onComecar - Callback quando o usuário clica em "Começar"
 * @param {function} onVoltar - Callback quando o usuário clica em "Voltar" (opcional)
 */
export default function TelaSaudacaoQuestionario({ titulo, descricao, onComecar, onVoltar }) {
  // Fundo animado reutilizável
  const FundoAnimado = () =>
    Array.from({ length: 120 }).map((_, i) => {
      let left, top;
      let validPosition = false;
      while (!validPosition) {
        left = Math.random() * 100;
        top = Math.random() * 100;
        const isInFormArea = left > 20 && left < 80 && top > 10 && top < 90;
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

  return (
    <div className="relative min-h-screen flex justify-center items-center bg-white overflow-hidden">
      <FundoAnimado />

      <div className="relative z-10 w-full max-w-3xl h-[75vh] mx-4 md:mx-auto bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl md:rounded-3xl border border-gray-200 p-6 md:p-10 flex flex-col items-center justify-center text-center animate-scale-in">
        {/* Botão voltar (se fornecido) */}
        {onVoltar && (
          <button
            onClick={onVoltar}
            className="absolute top-6 left-6 text-gray-600 hover:text-gray-800 font-medium transition flex items-center gap-2 text-sm cursor-pointer z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </button>
        )}

        <div className="mb-6 flex justify-center">
          <PraxisLogo className="h-20 md:h-24" />
        </div>
        
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4 px-4">
          {titulo}
        </h1>
        
        <p className="text-gray-600 max-w-md text-sm md:text-base leading-relaxed mb-6 md:mb-8 px-4">
          {descricao}
        </p>
        
        <button
          onClick={onComecar}
          className="px-8 md:px-10 py-3 md:py-3.5 bg-yellow-400 hover:bg-yellow-500 rounded-xl font-semibold text-sm md:text-base text-gray-900 transition-all hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
        >
          Começar Questionário
        </button>
      </div>
    </div>
  );
}

