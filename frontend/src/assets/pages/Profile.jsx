// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { supabase } from "../lib/supabaseClient";
import { deleteAccount, fetchUser, fetchSubmissions } from "../lib/api";
import PraxisLogo from "../components/PraxisLogo";
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
  // Formata a data para formato brasileiro
  const formatDate = (dateStr) => {
    if (!dateStr) return "Data desconhecida";
    
    try {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString("pt-BR");
    } catch {
      return "Data desconhecida";
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-end mb-1">
        <h3 className="font-medium text-zinc-900">{skill}</h3>
        <span className="text-lg font-bold text-primary-600">{percentage}%</span>
      </div>
      <div className="w-full bg-zinc-100 rounded-full h-2.5">
        <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
      <p className="text-right text-xs text-zinc-500 mt-1">Atualizado em {formatDate(date)}</p>
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
  const navigate = useNavigate();
  // Estados para dados reais
  const [user, setUser] = useState(null);
  const [attributes, setAttributes] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Busca dados reais do usuário
  useEffect(() => {
    const loadData = async () => {
      try {
        // Pega o nome do Supabase Auth primeiro
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const fullName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.nome || "Usuário";
        
        // Formata o usuário com o nome real
        setUser({ full_name: fullName });
        
        // Busca dados da API (com fallback se falhar)
        try {
          const attributesData = await fetchUser();
          setAttributes(attributesData);
        } catch (error) {
          console.error("Erro ao buscar atributos:", error);
          setAttributes({ tech_skills: [], soft_skills: [], career_goal: "" });
        }
        
        try {
          const submissionsData = await fetchSubmissions();
          setSubmissions(submissionsData || []);
        } catch (error) {
          console.error("Erro ao buscar submissões:", error);
          setSubmissions([]);
        }
        
        console.log("📊 Dados do perfil carregados:", { fullName });
      } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
        // Seta valores padrão se tudo falhar
        setUser({ full_name: "Usuário" });
        setAttributes({ tech_skills: [], soft_skills: [], career_goal: "" });
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError("");

    try {
      // Chama o backend que:
      // 1. Deleta o perfil (trigger limpa dados relacionados)
      // 2. Deleta o usuário de auth.users via Admin API
      await deleteAccount();
      
      console.log("Conta deletada com sucesso");
      
      // Faz logout local
      await supabase.auth.signOut();
      
      // Redireciona para a landing page
      navigate("/");
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      setDeleteError(
        error.message || "Não foi possível excluir sua conta. Por favor, tente novamente ou entre em contato com o suporte."
      );
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header no mesmo estilo da Home */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" aria-label="Início">
            <PraxisLogo className="h-12" />
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/home" className="px-3 py-1.5 rounded-md hover:bg-zinc-50 border border-zinc-200 text-sm">Home</Link>
            <Link to="/perfil" className="px-3 py-1.5 rounded-md bg-primary-100 text-primary-800 border border-primary-200 text-sm">Perfil</Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md hover:bg-red-50 border border-red-200 text-red-600 text-sm font-medium transition cursor-pointer"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      {/* Conteúdo da Página de Perfil */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-zinc-600">Carregando perfil...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Olá, {user?.full_name || 'Usuário'}</h1>
              <p className="text-zinc-600 text-lg">Acompanhe seu progresso e desenvolvimento profissional.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Coluna Principal (2/3) */}
              <div className="lg:col-span-2 space-y-8">

                <Section title="Habilidades Técnicas" subtitle="Suas competências atualizadas com base nos desafios completados">
                    <div className="space-y-6">
                        {attributes?.tech_skills && attributes.tech_skills.length > 0 ? (
                          attributes.tech_skills.map(skill => <SkillBar key={skill.name} skill={skill.name} percentage={skill.percentage} date={skill.last_updated} />)
                        ) : (
                          <p className="text-zinc-500 text-center py-4">Nenhuma habilidade registrada ainda.</p>
                        )}
                    </div>
                </Section>

                <Section title="Histórico de Desafios" subtitle={`${submissions.length} desafios completados`}>
                    {submissions && submissions.length > 0 ? (
                      submissions.map(sub => <ChallengeHistoryItem key={sub.id} {...sub} />)
                    ) : (
                      <p className="text-zinc-500 text-center py-4">Nenhum desafio completado ainda.</p>
                    )}
                </Section>

                <div className="grid grid-cols-3 gap-4">
                    <StatCard value={submissions?.length || 0} label="Desafios Completados" />
                    <StatCard value={attributes?.tech_skills?.length || 0} label="Habilidades Rastreadas" />
                    <StatCard value="90" label="Score Médio" />
                </div>

            {/* Seção de Exclusão de Conta */}
            <Section title="Zona de Perigo" subtitle="Ações irreversíveis">
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h4 className="font-semibold text-red-900 mb-2">Excluir Conta</h4>
                <p className="text-sm text-red-700 mb-4">
                  Uma vez excluída, sua conta não poderá ser recuperada. Todos os seus dados, desafios e progresso serão perdidos permanentemente.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm cursor-pointer"
                >
                  Excluir Minha Conta
                </button>
              </div>
            </Section>
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
          </>
        )}
      </main>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-zinc-900 mb-3">
              Tem certeza absoluta?
            </h3>
            <p className="text-zinc-600 mb-6">
              Esta ação <strong className="text-red-600">não pode ser desfeita</strong>. 
              Você perderá permanentemente:
            </p>
            
            <ul className="list-disc list-inside text-sm text-zinc-700 mb-6 space-y-1">
              <li>Todo o seu progresso e pontuação</li>
              <li>Histórico de desafios completados</li>
              <li>Habilidades rastreadas</li>
              <li>Dados de perfil</li>
            </ul>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError("");
                }}
                disabled={deleteLoading}
                className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-900 rounded-lg hover:bg-zinc-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleteLoading ? "Excluindo..." : "Sim, Excluir Permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
