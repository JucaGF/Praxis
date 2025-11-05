// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
} from 'chart.js';

import { Card } from "../components/ui.jsx";
// Importes de API removidos: a página usa dados simulados por enquanto.

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- Componentes específicos do Perfil ---

function Section({ title, subtitle, children }) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
      <p className="text-zinc-600 mt-1">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </Card>
  );
}

function SkillBar({ skill, percentage, date }) {
  return (
    <div>
      <div className="flex justify-between items-end mb-1">
        <h3 className="font-medium text-zinc-900">{skill}</h3>
        <span className="text-lg font-bold text-primary-600">{percentage}%</span>
      </div>
      <div className="w-full bg-zinc-100 rounded-full h-2.5">
        <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
      <p className="text-right text-xs text-zinc-500 mt-1">Atualizado em {date}</p>
    </div>
  );
}

function ChallengeHistoryItem({ title, score, points, date, tags }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-zinc-200 last:border-b-0">
      <div>
        <h4 className="font-semibold text-zinc-900">{title}</h4>
        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
          <span>📅 {date}</span>
          <span>📈 +{points} pontos</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-bold text-primary-600">{score}/100</p>
        <p className="text-xs text-zinc-500">{tags}</p>
      </div>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="bg-white border border-zinc-200 p-4 rounded-xl text-center">
      <p className="text-3xl font-bold text-primary-600">{value}</p>
      <p className="text-sm text-zinc-600">{label}</p>
    </div>
  );
}

const evolutionData = {
  labels: ['Jun', 'Jul', 'Ago', 'Set', 'Out'],
  datasets: [
    {
      label: 'Pontuação',
      data: [50, 58, 65, 68, 72],
      borderColor: '#eab308', // primary-500
      backgroundColor: '#eab308',
      tension: 0.1,
    },
    {
      label: 'Atividades',
      data: [10, 15, 18, 20, 25],
      borderColor: '#10b981', // emerald-500
      backgroundColor: '#10b981',
      tension: 0.1,
    },
  ],
};

const evolutionOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#3f3f46' // zinc-700
      }
    },
    title: { display: false },
  },
  scales: {
    x: {
      ticks: { color: '#52525b' }, // zinc-600
      grid: { color: '#e4e4e7' }   // zinc-200
    },
    y: {
      ticks: { color: '#52525b' },
      grid: { color: '#e4e4e7' }
    }
  }
};


export default function Profile() {
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulação de chamadas de API
        const userData = {
            name: "João Silva",
            tech_skills: [
                { name: "React", percentage: 74, last_updated: "14/10/2025" },
                { name: "JavaScript", percentage: 74, last_updated: "14/10/2025" },
                { name: "TypeScript", percentage: 55, last_updated: "30/09/2025" },
                { name: "Problem Solving", percentage: 69, last_updated: "14/10/2025" },
            ]
        };
        const submissionsData = [
            { id: 1, title: "Correção de Bug: Button Component", score: 90, points: 22, date: "14/10/2025", tags: "React, JavaScript, Problem Solving" }
        ];
        setUser(userData);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 text-center py-10 text-zinc-400">Carregando perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header no mesmo estilo da Home */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" aria-label="Início">
            <div className="w-8 h-8 rounded-md bg-primary-500 text-zinc-900 grid place-content-center font-black group-hover:bg-primary-600 transition">P</div>
            <span className="font-extrabold tracking-tight text-xl">Praxis<span className="text-primary-600">:</span></span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/home" className="px-3 py-1.5 rounded-md hover:bg-zinc-50 border border-zinc-200 text-sm">Home</Link>
            <Link to="/perfil" className="px-3 py-1.5 rounded-md bg-primary-100 text-primary-800 border border-primary-200 text-sm">Perfil</Link>
          </nav>
        </div>
      </header>

      {/* Conteúdo da Página de Perfil */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Olá, {user?.name}</h1>
          <p className="text-zinc-600 text-lg">Acompanhe seu progresso e desenvolvimento profissional.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal (2/3) */}
          <div className="lg:col-span-2 space-y-8">

            <Section title="Habilidades Técnicas" subtitle="Suas competências atualizadas com base nos desafios completados">
                <div className="space-y-6">
                    {user?.tech_skills.map(skill => <SkillBar key={skill.name} skill={skill.name} percentage={skill.percentage} date={skill.last_updated} />)}
                </div>
            </Section>

            <Section title="Histórico de Desafios" subtitle={`${submissions.length} desafios completados`}>
                {submissions.map(sub => <ChallengeHistoryItem key={sub.id} {...sub} />)}
            </Section>

            <div className="grid grid-cols-3 gap-4">
                <StatCard value={submissions.length} label="Desafios Completados" />
                <StatCard value={user?.tech_skills.length} label="Habilidades Rastreadas" />
                <StatCard value="90" label="Score Médio" />
            </div>
          </div>

          {/* Coluna Lateral (1/3) */}
          <div className="space-y-8">
            <Section title="Evolução da Pontuação" subtitle="Seu progresso nos últimos 5 meses">
              <div className="h-64">
                <Line options={evolutionOptions} data={evolutionData} />
              </div>
              <div className="mt-4 text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="font-semibold text-emerald-700">📈 Crescimento de +44% em 5 meses!</p>
                <p className="text-sm text-zinc-600">Você está no caminho certo. Continue praticando regularmente.</p>
              </div>
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}
