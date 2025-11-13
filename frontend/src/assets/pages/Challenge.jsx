// src/pages/Challenge.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchChallengeById } from "../lib/api.js";
import CodeChallenge from "../components/challenges/CodeChallenge.jsx";
import DailyTaskChallenge from "../components/challenges/DailyTaskChallenge.jsx";
import OrganizationChallenge from "../components/challenges/OrganizationChallenge.jsx";
import logger from "../utils/logger.js";

export default function Challenge() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        logger.info("challenge:load:start", { challengeId: id });
        const data = await fetchChallengeById(id);
        
        if (!data) {
          logger.warn("challenge:load:not-found", { challengeId: id });
          setError("Desafio não encontrado");
          return;
        }
        
        logger.info("challenge:load:success", {
          challengeId: id,
          category: data.category,
          difficulty: data.difficulty?.level,
        });
        
        setChallenge(data);
      } catch (err) {
        logger.error("challenge:load:error", { challengeId: id, error: err });
        setError(err.message || "Erro ao carregar desafio");
      } finally {
        setLoading(false);
      }
    };
    
    loadChallenge();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando desafio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Erro ao carregar desafio</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/home")}
            className="px-6 py-3 bg-primary-500 text-black font-semibold rounded-lg hover:bg-primary-600 transition"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  // Renderiza o tipo correto de desafio baseado no campo category do banco
  if (challenge.category === "code") {
    return <CodeChallenge challenge={challenge} />;
  }
  if (challenge.category === "daily-task") {
    return <DailyTaskChallenge challenge={challenge} />;
  }
  if (challenge.category === "organization") {
    return <OrganizationChallenge challenge={challenge} />;
  }

  // Fallback para tipo desconhecido
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="text-center p-4">
        <p className="text-zinc-400 text-lg mb-4">Tipo de desafio desconhecido: {challenge.category}</p>
        <button
          onClick={() => navigate("/home")}
          className="px-4 py-2 bg-primary-500 text-zinc-900 rounded-lg hover:bg-primary-600 transition"
        >
          Voltar para Home
        </button>
      </div>
    </div>
  );
}

