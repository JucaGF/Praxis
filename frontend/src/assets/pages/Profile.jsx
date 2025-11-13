// src/pages/Profile.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { supabase } from "../lib/supabaseClient";
import { deleteAccount, fetchUser, fetchSubmissions, listResumes, analyzeResume, deleteResume } from "../lib/api";
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

function Section({ title, subtitle, children, id }) {
  return (
    <Card id={id} className="p-6 scroll-mt-20">
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
  const [myResumes, setMyResumes] = useState([]);
  const [expandedMyResumesCard, setExpandedMyResumesCard] = useState(false);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [deletingResumeId, setDeletingResumeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Scroll para seção de histórico se houver hash na URL
  useEffect(() => {
    const scrollToHistory = () => {
      if (window.location.hash === '#historico') {
        const element = document.getElementById('historico');
        if (element) {
          // Aguarda um pouco para garantir que o conteúdo foi renderizado
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }
      }
    };

    // Executa quando o componente monta
    scrollToHistory();

    // Também escuta mudanças no hash (caso o usuário navegue sem recarregar)
    const handleHashChange = () => {
      scrollToHistory();
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [loading]); // Re-executa quando o loading termina

  // Busca dados reais do usuário
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);
  
  useEffect(() => {
    const loadData = async () => {
      // Evita múltiplas execuções simultâneas
      if (isLoadingRef.current) {
        return;
      }
      
      isLoadingRef.current = true;
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
          setAttributes({ tech_skills: {}, soft_skills: {}, career_goal: "" });
        }
        
        try {
          const submissionsData = await fetchSubmissions();
          // Filtra apenas submissões com status "scored" (avaliadas com sucesso)
          // Backend já retorna ordenado por data mais recente primeiro
          const completedSubmissions = (submissionsData || []).filter(
            sub => sub.status === 'scored'
          );
          // Limita aos últimos 5 desafios
          const last5Submissions = completedSubmissions.slice(0, 5);
          console.log("📊 Submissões recebidas:", {
            total: submissionsData?.length || 0,
            scored: completedSubmissions.length,
            last5: last5Submissions.length,
            allStatuses: submissionsData?.map(s => ({ id: s.id, status: s.status, date: s.date, score: s.score, points: s.points })) || []
          });
          setSubmissions(last5Submissions);
        } catch (error) {
          console.error("Erro ao buscar submissões:", error);
          setSubmissions([]);
        }

        // Carrega currículos do usuário
        try {
          const resumes = await listResumes();
          setMyResumes(resumes || []);
        } catch (err) {
          console.error("Erro ao carregar currículos:", err);
          setMyResumes([]);
        }
        
        console.log("📊 Dados do perfil carregados:", { fullName });
      } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
        // Seta valores padrão se tudo falhar
        setUser({ full_name: "Usuário" });
        setAttributes({ tech_skills: {}, soft_skills: {}, career_goal: "" });
        setSubmissions([]);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
        hasLoadedRef.current = true;
      }
    };

    // Só carrega dados na primeira vez ou quando explicitamente solicitado
    if (!hasLoadedRef.current) {
      loadData();
    }
    
    // Listener para recarregar dados quando necessário (com debounce)
    let reloadTimeout = null;
    const handleReload = () => {
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      reloadTimeout = setTimeout(() => {
        if (!isLoadingRef.current) {
          hasLoadedRef.current = false; // Permite recarregar
          loadData();
        }
      }, 500);
    };
    window.addEventListener('reloadProfileData', handleReload);
    
    return () => {
      window.removeEventListener('reloadProfileData', handleReload);
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependências vazias: carrega apenas uma vez

  // Calcula porcentagens das soft skills com base nos attributes retornados
  const computeSoftSkillPercentages = (softSkills) => {
    // Definição das categorias e suas perguntas (deve refletir o questionario_soft)
    const categorias = [
      {
        chave: 'Comunicação',
        perguntas: [
          'Consigo explicar problemas técnicos para pessoas não técnicas',
          'Deixo comentários claros e úteis no código',
          'Escrevo mensagens estruturadas em equipes de desenvolvimento',
        ],
      },
      {
        chave: 'Organização',
        perguntas: [
          'Divido tarefas em pequenas etapas e priorizo',
          'Planejo minhas atividades semanalmente',
          'Gerencio múltiplos projetos sem perder prazos',
        ],
      },
      {
        chave: 'Resolução de Problemas',
        perguntas: [
          'Identifico rapidamente a causa raiz dos problemas',
          'Sei investigar e debugar erros de forma eficiente',
          'Resolvo problemas complexos de lógica',
        ],
      },
    ];

    if (!softSkills) return {};

    const results = {};

    categorias.forEach((cat) => {
      // Se o backend já armazenou a categoria como chave com percent (ex: {"Comunicação": 80})
      if (typeof softSkills[cat.chave] === 'number') {
        results[cat.chave] = Math.max(0, Math.min(100, Math.round(softSkills[cat.chave])));
        return;
      }

      // Caso contrário, buscamos as perguntas individuais no objeto softSkills (que pode ter as perguntas como chaves)
      const valores = cat.perguntas
        .map((q) => softSkills[q])
        .filter((v) => typeof v === 'number');

      if (valores.length === 0) {
        results[cat.chave] = 0;
        return;
      }

      const media = valores.reduce((a, b) => a + b, 0) / valores.length;

      // Detectar escala: se valores parecem estar em 0..5 ou 0..100
      const maxVal = Math.max(...valores);

      let percent = 0;
      if (maxVal <= 5) {
        // respostas 0-5: média * 10 (conforme solicitado)
        percent = media * 10;
      } else {
        // respostas 0-100: converter para escala pedida
        // assumimos que média 0-100 -> seguir média * 0.5 (equivalente a (media/20)*10)
        percent = media * 0.5;
      }

      results[cat.chave] = Math.max(0, Math.min(100, Math.round(percent)));
    });

    return results;
  };

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

  // Funções para currículos (moved from Home.jsx)
  const loadResumes = async () => {
    try {
      const resumes = await listResumes();
      setMyResumes(resumes || []);
    } catch (error) {
      console.error("❌ Erro ao carregar currículos:", error);
    }
  };

  const handleAnalyzeResume = (resumeId) => {
    // Redireciona para a Home e passa o id do currículo para que a Home abra a análise
    navigate('/home', { state: { openResumeId: resumeId } });
  };

  const handleDeleteResume = async (resumeId) => {
    setDeletingResumeId(resumeId);

    try {
      // Delay curto para animação
      await new Promise(resolve => setTimeout(resolve, 200));
      setMyResumes(prev => prev.filter(r => r.id !== resumeId));
      await deleteResume(resumeId);
    } catch (error) {
      console.error("❌ Erro ao deletar currículo:", error);
      alert("Erro ao deletar currículo: " + (error.message || ""));
      await loadResumes();
    } finally {
      setDeletingResumeId(null);
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

                <Section title="Habilidades Técnicas" subtitle={null}>
                    <div className="space-y-6">
                        {attributes?.tech_skills && Object.keys(attributes.tech_skills).length > 0 ? (
                          Object.entries(attributes.tech_skills).map(([skillName, percentage]) => (
                            <SkillBar 
                              key={skillName} 
                              skill={skillName} 
                              percentage={percentage} 
                              date={attributes.updated_at} 
                            />
                          ))
                        ) : (
                          <p className="text-zinc-500 text-center py-4">Nenhuma habilidade registrada ainda.</p>
                        )}
                    </div>
                </Section>

                {/* Nova seção: Habilidades Sociais (Soft Skills) */}
                <Section title="Habilidades Sociais" subtitle={null}>
                  <div className="space-y-6">
                    {(() => {
                      const softPercents = computeSoftSkillPercentages(attributes?.soft_skills || {});
                      const keys = ['Comunicação', 'Organização', 'Resolução de Problemas'];

                      const hasAny = keys.some(k => softPercents[k] && softPercents[k] > 0);

                      if (!hasAny) {
                        return <p className="text-zinc-500 text-center py-4">Nenhuma avaliação de soft skills disponível.</p>;
                      }

                      return (
                        <div className="space-y-4">
                          {keys.map(k => (
                            <SkillBar key={k} skill={k} percentage={softPercents[k] || 0} date={attributes?.updated_at} />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </Section>

                <Section title="Histórico de Desafios" subtitle={`${submissions.length} desafios completados`} id="historico">
                    {submissions && submissions.length > 0 ? (
                      submissions.map(sub => <ChallengeHistoryItem key={sub.id} {...sub} />)
                    ) : (
                      <p className="text-zinc-500 text-center py-4">Nenhum desafio completado ainda.</p>
                    )}
                </Section>

                <div className="grid grid-cols-3 gap-4">
                    <StatCard value={submissions?.length || 0} label="Desafios Completados" />
                    <StatCard value={attributes?.tech_skills ? Object.keys(attributes.tech_skills).length : 0} label="Habilidades Rastreadas" />
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

              {/* Nova área: Meus Currículos (movido da Home) */}
              <Section title="Meus Currículos" subtitle={null}>
                <div>
                  <Card 
                    role="button"
                    aria-expanded={expandedMyResumesCard}
                    className={
                      "p-4 cursor-pointer transition-all duration-300 ease-in-out " +
                      (expandedMyResumesCard ? "ring-2 ring-primary-300" : "hover:scale-[1.02]")
                    }
                    onClick={() => setExpandedMyResumesCard(prev => !prev)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-md bg-emerald-100 text-emerald-800 grid place-content-center border border-emerald-200 text-sm font-semibold">
                          ✔
                        </div>
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Análise Praxis</span>
                      </div>
                    </div>

                    {!expandedMyResumesCard && (
                      <div className="mt-3">
                        <h3 className="text-lg font-semibold text-zinc-900">Análises</h3>
                        <p className="mt-1.5 text-sm text-zinc-600">{myResumes.length === 0 ? 'Nenhum currículo enviado' : `${myResumes.length} currículo${myResumes.length > 1 ? 's' : ''}`}</p>
                      </div>
                    )}

                    {expandedMyResumesCard && (
                      <div className="pt-4 mt-4 border-t border-zinc-200" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-zinc-900 mb-3">Currículos Enviados</h3>

                        {myResumes.length === 0 ? (
                          <div className="text-center py-8 text-zinc-500">
                            <p className="text-sm">Nenhum currículo enviado ainda.</p>
                            <p className="text-xs mt-1">Envie seu primeiro currículo na área de Análise.</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-72 overflow-y-auto">
                            {myResumes.map((resume) => (
                              <div key={resume.id} className={`border border-zinc-200 rounded-lg p-3 transition-all duration-300 ${deletingResumeId === resume.id ? 'opacity-0 scale-95 translate-x-4' : 'opacity-100 scale-100 translate-x-0'}`}>
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-zinc-900 text-sm">{resume.title || 'Sem título'}</h4>
                                    <p className="text-xs text-zinc-500 mt-1">Enviado em {new Date(resume.created_at).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                  {resume.has_analysis && (
                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Analisado</span>
                                  )}
                                </div>

                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => handleAnalyzeResume(resume.id)} disabled={analyzingResume && selectedResumeId === resume.id} className="flex-1 px-3 py-1.5 text-sm font-medium border border-primary-200 text-primary-700 rounded-md hover:bg-primary-50 transition disabled:opacity-50 cursor-pointer">
                                    {analyzingResume && selectedResumeId === resume.id ? 'Analisando...' : (resume.has_analysis ? 'Ver Análise' : 'Analisar com IA')}
                                  </button>
                                  <button onClick={() => handleDeleteResume(resume.id)} disabled={deletingResumeId === resume.id} className="px-3 py-1.5 text-sm font-medium border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition disabled:opacity-50 cursor-pointer" title="Excluir currículo">
                                    {deletingResumeId === resume.id ? '...' : 'Excluir'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex justify-end">
                          <button onClick={(e) => { e.stopPropagation(); setExpandedMyResumesCard(false); }} className="rounded-lg px-4 py-2.5 text-sm font-medium border border-zinc-200 hover:bg-zinc-50">Fechar</button>
                        </div>
                      </div>
                    )}
                  </Card>
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
