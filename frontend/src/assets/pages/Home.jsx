// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchUser, fetchChallenges, generateChallengesStreaming } from "../lib/api.js";
import { Pill, Difficulty, Skill, Meta, Card, PrimaryButton } from "../components/ui.jsx";
import { supabase } from "../lib/supabaseClient";

/* ----- Função para transformar dados da API no formato esperado ----- */
function transformChallenges(apiChallenges) {
  return apiChallenges.map(challenge => {
    // Mapeia level de inglês para português
    const levelMap = {
      'easy': 'Fácil',
      'medium': 'Médio',
      'hard': 'Difícil'
    };
    
    // Extrai skills do target_skill ou eval_criteria
    const skills = [];
    if (challenge.description?.target_skill) {
      skills.push(challenge.description.target_skill);
    }
    if (challenge.description?.eval_criteria) {
      skills.push(...challenge.description.eval_criteria.slice(0, 2)); // Limita a 3 skills total
    }
    
    // Formata tempo
    const timeLimit = challenge.difficulty?.time_limit || 120;
    const hours = Math.floor(timeLimit / 60);
    const minutes = timeLimit % 60;
    const timeStr = hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}` : `${minutes}min`;
    
    return {
      id: challenge.id,
      title: challenge.title,
      desc: challenge.description?.text || "Sem descrição",
      long_desc: challenge.description?.text || "Sem descrição",
      difficulty: levelMap[challenge.difficulty?.level] || 'Médio',
      time: timeStr,
      skills: skills.slice(0, 3), // Limita a 3 skills
      tags: challenge.category ? [challenge.category] : [],
      status: "available",
      category: challenge.category // Adiciona category para os ícones
    };
  });
}

/* ----- Função para ícones minimalistas por categoria ----- */
function getChallengeIcon(category) {
  const icons = {
    'code': '{ }',           // Código: chaves
    'daily-task': '✉',       // Comunicação: envelope
    'organization': '◇'      // Planejamento: losango (arquitetura)
  };
  return icons[category] || '●';
}

/* ----- Função para nome amigável da categoria ----- */
function getChallengeCategoryName(category) {
  const names = {
    'code': 'Código',
    'daily-task': 'Comunicação',
    'organization': 'Planejamento'
  };
  return names[category] || 'Desafio';
}

/* ----- Home personalizável ----- */
export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingChallenges, setGeneratingChallenges] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [streamMessage, setStreamMessage] = useState("");
  const [cancelStream, setCancelStream] = useState(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleGenerateChallenges = async () => {
    setGeneratingChallenges(true);
    setStreamProgress(0);
    setStreamMessage("");
    setCatalog([]); // Limpa desafios antigos
    
    try {
      console.log("🎯 Iniciando geração com streaming...");
      
      const cancel = await generateChallengesStreaming({
        onStart: (data) => {
          console.log("🎬 Stream iniciado:", data);
          setStreamMessage(data.message || "Iniciando...");
        },
        
        onProgress: (data) => {
          console.log("📊 Progresso:", data);
          setStreamProgress(data.percent || 0);
          setStreamMessage(data.message || "Gerando...");
        },
        
        onChallenge: (data) => {
          console.log("✅ Desafio recebido:", data);
          // Transformar e adicionar ao catálogo imediatamente
          const transformed = transformChallenges([data.data]);
          setCatalog(prev => [...prev, ...transformed]);
          setStreamMessage(`✅ Desafio ${data.number}/${data.total} gerado!`);
        },
        
        onComplete: (data) => {
          console.log("🎉 Geração concluída:", data);
          setStreamMessage(data.message || "🎉 Concluído!");
          setStreamProgress(100);
          setTimeout(() => {
            setGeneratingChallenges(false);
            setStreamProgress(0);
            setStreamMessage("");
          }, 1500);
        },
        
        onError: (data) => {
          console.error("❌ Erro no stream:", data);
          alert("Erro ao gerar desafios: " + (data.message || "Erro desconhecido"));
          setGeneratingChallenges(false);
          setStreamProgress(0);
          setStreamMessage("");
        }
      });
      
      // Guardar função de cancelamento
      setCancelStream(() => cancel);
      
    } catch (error) {
      console.error("❌ Erro ao iniciar streaming:", error);
      alert("Erro ao gerar desafios: " + error.message);
      setGeneratingChallenges(false);
      setStreamProgress(0);
      setStreamMessage("");
    }
  };
  
  const handleCancelGeneration = () => {
    if (cancelStream) {
      cancelStream();
      setGeneratingChallenges(false);
      setStreamProgress(0);
      setStreamMessage("");
      setCancelStream(null);
    }
  };

  // carrega usuário + catálogo
  useEffect(() => {
    (async () => {
      try {
        // Busca apenas atributos e desafios (profile vem do Supabase)
        const [attributes, challenges] = await Promise.all([
          fetchUser(),
          fetchChallenges()
        ]);
        
        // Pega o nome do Supabase
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const fullName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.nome || "Usuário";
        
        console.log("📊 Dados recebidos da API:", { authUser, attributes, challenges });
        
        // Verifica se os atributos existem
        if (!attributes || !attributes.tech_skills || attributes.tech_skills.length === 0) {
          console.warn("⚠️ Atributos não encontrados ou vazios. Usuário precisa criar dados mockados.");
          throw new Error("Atributos não encontrados. Clique no botão para criar dados mockados.");
        }
        
        // Mapeia career_goal para interesses relevantes
        const getInterests = (careerGoal) => {
          if (!careerGoal) return ["Desenvolvimento", "Tecnologia"];
          
          const goal = careerGoal.toLowerCase();
          
          if (goal.includes("full stack")) {
            return ["Frontend", "Backend"];
          } else if (goal.includes("frontend")) {
            return ["Frontend", "UI/UX"];
          } else if (goal.includes("backend")) {
            return ["Backend", "Banco de Dados"];
          } else if (goal.includes("dados") || goal.includes("data")) {
            return ["Banco de Dados", "Engenharia de Dados"];
          }
          
          // Fallback: pega as duas primeiras palavras
          return ["Desenvolvimento", "Tecnologia"];
        };
        
        // Transforma os dados da API no formato esperado pelo componente
        const userData = {
          name: fullName,
          // Extrai nomes das tech_skills para usar como skills
          skills: attributes.tech_skills.map(skill => skill.name),
          // Mapeia career_goal para interesses
          interests: getInterests(attributes.career_goal)
        };
        
               console.log("✅ Dados transformados para o componente:", userData);
               
               // Transforma os desafios da API para o formato esperado
               const transformedChallenges = transformChallenges(challenges || []);
               console.log("🔄 Desafios carregados e transformados:", transformedChallenges);
               
               setUser(userData);
               setCatalog(transformedChallenges);
      } catch (error) {
        console.error("❌ Erro detalhado ao carregar dados:", error);
        console.error("❌ Mensagem de erro:", error.message);
        console.error("❌ Stack:", error.stack);
        
        // NÃO cria dados automaticamente para evitar loop
        // O usuário precisará clicar no botão "Criar Dados Mockados"
        
        // Seta user como null para mostrar a tela com o botão
        setUser(null);
        setCatalog([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  useEffect(() => {
    const onDocClick = (e) => {
        // se o clique não veio de um Card (procura pelo atributo role="button")
        if (!(e.target.closest && e.target.closest('[role="button"]'))) {
        setExpandedId(null);
        }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // controla qual card está expandido
  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // "score" simples para ordenar por relevância
  function score(ch, u) {
    if (!u) return 0;
    let s = 0;
    if (ch.skills?.some((x) => u.skills.includes(x))) s += 2;     // match de skill
    if (ch.tags?.some((t) => u.interests.includes(t))) s += 1;    // match de interesse
    if (u.level === "junior" && ch.difficulty === "Fácil") s += 1;
    if (u.level === "senior" && ch.difficulty === "Difícil") s += 1;
    return s;
  }

  const recommended = useMemo(() => {
    const avail = catalog.filter((c) => c.status === "available");
    return avail.sort((a, b) => score(b, user) - score(a, user));
  }, [catalog, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-zinc-600">Carregando…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const setupMockData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        
        console.log("🔧 Criando dados mockados...");
        
        const response = await fetch(`${API_URL}/dev/setup-mock-data`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (response.ok) {
          console.log("✅ Dados criados! Recarregando...");
          window.location.reload();
        } else {
          const error = await response.text();
          console.error("❌ Erro:", error);
          alert("Erro ao criar dados: " + error);
        }
      } catch (error) {
        console.error("❌ Erro:", error);
        alert("Erro ao criar dados: " + error.message);
      }
    };
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Dados não encontrados</h2>
          <p className="text-zinc-600 mb-6">
            Parece que você não tem dados de perfil ainda. Clique no botão abaixo para criar dados mockados automaticamente.
          </p>
          <button
            onClick={setupMockData}
            className="px-6 py-3 bg-primary-500 text-black font-semibold rounded-lg hover:bg-primary-600 transition cursor-pointer mb-4"
          >
            Criar Dados Mockados
          </button>
          <br />
          <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm">
            Voltar para Landing Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header compartilhado (opcional): <Header active="Home" /> */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" aria-label="Início">
            <div className="w-8 h-8 rounded-md bg-primary-500 text-zinc-900 grid place-content-center font-black group-hover:bg-primary-600 transition">P</div>
            <span className="font-extrabold tracking-tight text-xl">Praxis<span className="text-primary-600">:</span></span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/home" className="px-3 py-1.5 rounded-md bg-primary-100 text-primary-800 border border-primary-200 text-sm">Home</Link>
            <Link to="/perfil" className="px-3 py-1.5 rounded-md hover:bg-zinc-50 border border-zinc-200 text-sm">Perfil</Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md hover:bg-red-50 border border-red-200 text-red-600 text-sm font-medium transition cursor-pointer"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {/* Perfil usa dados do usuário */}
        <Card className="p-5 mb-8">
          <div className="grid sm:grid-cols-2 gap-6 items-start">
            <div>
              <h3 className="text-zinc-800 font-semibold">Olá, {user.name}! Seu Perfil de Habilidades</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill className="bg-emerald-50 text-emerald-700 border border-emerald-200">Pontos Fortes</Pill>
                {user.skills.map((s) => <Skill key={s}>{s}</Skill>)}
              </div>
            </div>
            <div className="sm:text-right">
              <h3 className="text-zinc-800 font-semibold">Interesses</h3>
              <div className="mt-3 flex flex-wrap sm:justify-end gap-2">
                {user.interests.map((i) => <Skill key={i}>{i}</Skill>)}
              </div>
            </div>
          </div>
        </Card>

        {/* Lista ordenada por relevância */}
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Recomendados para você</h2>
            <p className="text-zinc-600 text-sm">Baseado nas suas habilidades e interesses</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateChallenges}
              disabled={generatingChallenges}
              className="px-4 py-2 bg-primary-500 text-black font-semibold rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {generatingChallenges ? "Gerando..." : "Gerar Desafios"}
            </button>
            {generatingChallenges && (
              <button
                onClick={handleCancelGeneration}
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Barra de progresso e mensagem (durante geração) */}
        {generatingChallenges && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-primary-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-700">{streamMessage}</span>
              <span className="text-sm font-semibold text-primary-600">{Math.round(streamProgress)}%</span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary-400 to-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${streamProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Mensagem quando não há desafios */}
        {recommended.length === 0 && !generatingChallenges && (
          <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">Nenhum desafio disponível</h3>
            <p className="text-zinc-600 mb-6">
              Clique no botão acima para gerar desafios personalizados com base no seu perfil.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-6 gap-5">
        {/* Reordena para colocar o expandido primeiro */}
        {recommended.slice(0, 3)
          .sort((a, b) => {
            if (a.id === expandedId) return -1;
            if (b.id === expandedId) return 1;
            return 0;
          })
          .map((c, index) => {
            const expanded = expandedId === c.id;
            const isFirstCollapsed = !expanded && expandedId && index === 1;
            const isSecondCollapsed = !expanded && expandedId && index === 2;
            
            return (
            <Card
                key={c.id}
                role="button"
                aria-expanded={expanded}
                onClick={() => toggleExpand(c.id)}
                style={{
                  gridColumn: expanded 
                    ? 'span 6' 
                    : isFirstCollapsed 
                      ? '2 / span 2' 
                      : isSecondCollapsed 
                        ? '4 / span 2' 
                        : 'span 2'
                }}
                className={
                "p-5 cursor-pointer transition-all duration-300 ease-in-out animate-fade-in " +
                (expanded 
                  ? "ring-2 ring-primary-300" 
                  : expandedId
                    ? "hover:scale-[1.02] scale-95 opacity-90"
                    : "hover:scale-[1.02]")
                }
            >
                <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-md bg-primary-100 text-primary-800 grid place-content-center border border-primary-200 text-sm font-semibold">
                      {getChallengeIcon(c.category)}
                  </div>
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    {getChallengeCategoryName(c.category)}
                  </span>
                </div>
                <Difficulty level={c.difficulty} />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-zinc-900">{c.title}</h3>
                <p className="mt-1.5 text-sm text-zinc-600">{c.desc}</p>

                <div className="mt-4"><Meta icon="⏲️">{c.time}</Meta></div>

                <div className="mt-3 flex flex-wrap gap-2">
                {c.skills.map((s) => <Skill key={s}>{s}</Skill>)}
                </div>

                {/* Área extra que aparece quando expandido */}
                {expanded && (
                  <div className="pt-4 mt-4 border-t border-zinc-200">
                    <p className="text-sm text-zinc-700">
                      <span className="font-medium">Objetivo:</span> resolver o desafio aplicando as skills acima e
                      registrando suas decisões técnicas.
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-zinc-700">
                      <div>
                        <span className="font-medium">Pré-requisitos:</span>{" "}
                        {c.skills.join(", ")}
                      </div>
                      <div>
                        <span className="font-medium">O que será avaliado:</span> clareza do código, testes básicos,
                        comunicação (README) e performance quando aplicável.
                      </div>
                      <div>
                        <span className="font-medium">Passos sugeridos:</span> entender o bug/feature, planejar,
                        implementar, testar e documentar.
                      </div>
                    </div>

                    {/* Ações extras quando expandido */}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link to={`/desafio/${c.id}`} onClick={(e) => e.stopPropagation()}>
                        <PrimaryButton>
                          Começar desafio
                        </PrimaryButton>
                      </Link>

                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                        className="rounded-lg px-4 py-2.5 text-sm font-medium border border-zinc-200 hover:bg-zinc-50"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
            </Card>
            );
        })}
        </div>


        {/* Features futuras (fixas, não personalizadas) */}
        <div className="mt-8 grid md:grid-cols-2 gap-5">
        <Card className="p-5">
            <div className="flex items-start justify-between">
            <div className="h-9 w-9 rounded-md bg-primary-100 text-primary-800 grid place-content-center border border-primary-200">💬</div>
            <Difficulty level="Em breve" />
            </div>

            {/* Badge Roadmap */}
            <div className="mt-3">
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-800 border border-primary-200">
                Roadmap
            </span>
            </div>

            <h3 className="mt-3 text-lg font-semibold text-zinc-900">Simulação de Entrevista</h3>
            <p className="mt-1.5 text-sm text-zinc-600">
            Pratique entrevistas técnicas e comportamentais com IA, recebendo feedback em tempo real
            </p>

            <div className="mt-4 text-sm text-zinc-600">
            <p className="mb-1 text-zinc-800">Recursos:</p>
            <ul className="list-disc pl-5 space-y-1 marker:text-zinc-400">
                <li>Perguntas técnicas personalizadas</li>
                <li>Avaliação de comunicação e clareza</li>
                <li>Feedback detalhado sobre respostas</li>
            </ul>
            </div>

            <div className="mt-5">
            <PrimaryButton disabled>Em desenvolvimento</PrimaryButton>
            </div>
        </Card>

        <Card className="p-5">
            <div className="flex items-start justify-between">
            <div className="h-9 w-9 rounded-md bg-primary-100 text-primary-800 grid place-content-center border border-primary-200">🎯</div>
            <Difficulty level="Em breve" />
            </div>

            {/* Badge Roadmap */}
            <div className="mt-3">
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-800 border border-primary-200">
                Roadmap
            </span>
            </div>

            <h3 className="mt-3 text-lg font-semibold text-zinc-900">Plano de Ação Personalizado</h3>
            <p className="mt-1.5 text-sm text-zinc-600">
            Receba um roteiro de desenvolvimento baseado em suas habilidades e objetivos profissionais
            </p>

            <div className="mt-4 text-sm text-zinc-600">
            <p className="mb-1 text-zinc-800">Recursos:</p>
            <ul className="list-disc pl-5 space-y-1 marker:text-zinc-400">
                <li>Análise de gaps de habilidades</li>
                <li>Recomendações de aprendizado</li>
                <li>Metas e marcos de progresso</li>
            </ul>
            </div>

            <div className="mt-5">
            <PrimaryButton disabled>Em desenvolvimento</PrimaryButton>
            </div>
        </Card>
        </div>

      </main>
    </div>
  );
}
