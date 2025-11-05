// src/pages/Challenge.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchChallengeById } from "../lib/api.js";
import CodeChallenge from "../components/challenges/CodeChallenge.jsx";
import OrganizationChallenge from "../components/challenges/OrganizationChallenge.jsx";
import DailyTaskChallenge from "../components/challenges/DailyTaskChallenge.jsx";

export default function Challenge() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChallenge = async () => {
      const data = await fetchChallengeById(id);
      if (!data) {
        navigate("/home");
        return;
      }
      setChallenge(data);
      setLoading(false);
    };
    loadChallenge();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-600">Carregando desafio...</p>
      </div>
    );
  }

  // Renderiza o tipo correto de desafio baseado no campo category do banco
  if (challenge.category === "code") {
    return <CodeChallenge challenge={challenge} />;
  }
  if (challenge.category === "organization") {
    return <OrganizationChallenge challenge={challenge} />;
  }
  if (challenge.category === "daily-task") {
    return <DailyTaskChallenge challenge={challenge} />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-zinc-600">Tipo de desafio desconhecido.</p>
    </div>
  );
}
