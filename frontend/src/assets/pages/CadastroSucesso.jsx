//SÓ PARA O GITHUB
import React from "react";
import { Link } from "react-router-dom";
import PraxisLogo from "../components/PraxisLogo";

export default function CadastroSucesso() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans relative overflow-hidden">
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

      {Array.from({ length: 120 }).map((_, i) => {
        let left, top;
        let validPosition = false;

        while (!validPosition) {
          left = Math.random() * 100;
          top = Math.random() * 100;
          const isInFormArea = left > 25 && left < 75 && top > 20 && top < 80;
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

      <div className="w-full max-w-md mx-6 p-8 rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-100 text-center relative z-30">
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <PraxisLogo className="h-16" />
          </div>
        </div>

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
          Conta criada com sucesso!
        </h2>
        <p className="text-gray-600 mb-6">
          Sua conta foi criada com o GitHub. Complete seu perfil para ter uma
          experiência personalizada.
        </p>

        <div className="space-y-3">
          <Link
            to="/onboarding"
            className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition w-full cursor-pointer"
          >
            Completar Meu Perfil
          </Link>
        </div>

        <div className="pt-6 border-t border-gray-100 mt-8 text-center">
          <h1 className="text-xs text-gray-400 font-semibold tracking-widest uppercase">
            SIMULE | PRATIQUE | EVOLUA
          </h1>
        </div>
      </div>
    </div>
  );
}
