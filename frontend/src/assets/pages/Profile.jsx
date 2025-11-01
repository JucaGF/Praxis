import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Card } from "../components/ui.jsx";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) {
      // Mock inicial (pode ser substituído por dados reais do Supabase)
      setProfileData({
        name: user.email.split("@")[0],
        tech_skills: [
          { name: "React", percentage: 80, last_updated: "14/10/2025" },
          { name: "JavaScript", percentage: 70, last_updated: "10/10/2025" },
          {
            name: "Problem Solving",
            percentage: 60,
            last_updated: "05/10/2025",
          },
        ],
      });
      setSubmissions([
        {
          id: 1,
          title: "Desafio de Interface",
          score: 85,
          points: 20,
          date: "14/10/2025",
          tags: "React, UI Design",
        },
      ]);
    }
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  if (loading || !profileData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Carregando perfil...
      </div>
    );
  }

  const evolutionData = {
    labels: ["Jun", "Jul", "Ago", "Set", "Out"],
    datasets: [
      {
        label: "Pontuação",
        data: [50, 58, 65, 68, 72],
        borderColor: "#eab308",
        backgroundColor: "#eab308",
        tension: 0.1,
      },
    ],
  };

  const evolutionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#3f3f46",
        },
      },
    },
    scales: {
      x: { ticks: { color: "#52525b" } },
      y: { ticks: { color: "#52525b" } },
    },
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-md bg-primary-500 text-zinc-900 grid place-content-center font-black group-hover:bg-primary-600 transition">
              P
            </div>
            <span className="font-extrabold tracking-tight text-xl">
              Praxis<span className="text-primary-600">:</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              to="/home"
              className="px-3 py-1.5 rounded-md hover:bg-zinc-50 border border-zinc-200 text-sm"
            >
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md bg-red-100 text-red-700 border border-red-200 text-sm"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
          Olá, {profileData.name}
        </h1>
        <p className="text-zinc-600 text-lg mb-8">
          Acompanhe seu progresso e suas habilidades.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-zinc-900">
                Habilidades Técnicas
              </h2>
              <div className="mt-6 space-y-4">
                {profileData.tech_skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between items-end mb-1">
                      <h3 className="font-medium text-zinc-900">
                        {skill.name}
                      </h3>
                      <span className="text-lg font-bold text-primary-600">
                        {skill.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2.5">
                      <div
                        className="bg-primary-500 h-2.5 rounded-full"
                        style={{ width: `${skill.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-xs text-zinc-500 mt-1">
                      Atualizado em {skill.last_updated}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-zinc-900">
                Histórico de Desafios
              </h2>
              <div className="mt-4 space-y-3">
                {submissions.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center py-3 border-b border-zinc-200 last:border-b-0"
                  >
                    <div>
                      <h4 className="font-semibold">{s.title}</h4>
                      <p className="text-sm text-zinc-500">{s.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">
                        {s.score}/100
                      </p>
                      <p className="text-xs text-zinc-500">{s.tags}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-zinc-900 mb-4">
                Evolução
              </h2>
              <div className="h-64">
                <Line data={evolutionData} options={evolutionOptions} />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
