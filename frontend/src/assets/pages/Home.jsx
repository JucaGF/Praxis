// src/pages/Home.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchUser, fetchChallenges, generateChallengesStreaming, uploadResume, uploadResumeFile, analyzeResume, listResumes, uploadAndAnalyzeResumeFileStreaming, analyzeResumeStreaming } from "../lib/api.js";
import { Pill, Difficulty, Skill, Meta, Card, PrimaryButton } from "../components/ui.jsx";
import { supabase } from "../lib/supabaseClient";
import PraxisLogo from "../components/PraxisLogo";

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
  const [challengePlaceholders, setChallengePlaceholders] = useState([]);
  const [typewriterTimers, setTypewriterTimers] = useState([]);
  
  // Estados para análise de currículo
  const [resumeContent, setResumeContent] = useState("");
  const [resumeTitle, setResumeTitle] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [myResumes, setMyResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  
  // Estados para análise em tempo real com streaming
  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [analysisPlaceholder, setAnalysisPlaceholder] = useState({
    resumo_executivo: "",
    pontos_fortes: [],
    gaps_tecnicos: [],
    sugestoes_melhoria: [],
    nota_geral: null,
    habilidades_evidenciadas: {}
  });
  const [cancelAnalysisStream, setCancelAnalysisStream] = useState(null);
  
  // Estados para upload de arquivo
  const [uploadType, setUploadType] = useState("file"); // "text" ou "file"
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Estados para expansão dos cards
  const [expandedUploadCard, setExpandedUploadCard] = useState(false);
  const [expandedMyResumesCard, setExpandedMyResumesCard] = useState(false);
  
  // Ref para scroll automático até a análise
  const analysisResultRef = useRef(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Função para simular efeito typewriter (digitação letra por letra)
  const typewriterEffect = (challengeIndex, field, targetText, speed = 30) => {
    let currentIndex = 0;
    
    const typeNextChar = () => {
      if (currentIndex <= targetText.length) {
        const currentText = targetText.substring(0, currentIndex);
        
        // Se challengeIndex é 0 e estamos no contexto de análise, atualiza analysisPlaceholder
        // Senão, atualiza challengePlaceholders
        if (challengeIndex === 0 && (field === "resumo_executivo" || analysisInProgress)) {
          setAnalysisPlaceholder(prev => ({
            ...prev,
            [field]: currentText
          }));
        } else {
          setChallengePlaceholders(prev => {
            const updated = [...prev];
            if (updated[challengeIndex]) {
              updated[challengeIndex] = {
                ...updated[challengeIndex],
                [field]: currentText
              };
            }
            return updated;
          });
        }
        
        currentIndex++;
        
        if (currentIndex <= targetText.length) {
          const timer = setTimeout(typeNextChar, speed);
          setTypewriterTimers(prev => [...prev, timer]);
        }
      }
    };
    
    typeNextChar();
  };

  const handleGenerateChallenges = async () => {
    setGeneratingChallenges(true);
    setStreamProgress(0);
    setStreamMessage("");
    setCatalog([]); // Limpa desafios antigos
    
    // Limpar timers anteriores
    typewriterTimers.forEach(timer => clearTimeout(timer));
    setTypewriterTimers([]);
    
    // Inicializar 3 placeholders vazios
    setChallengePlaceholders([
      { id: 0, title: "", desc: "", category: null, difficulty: null, skills: [], isLoading: true },
      { id: 1, title: "", desc: "", category: null, difficulty: null, skills: [], isLoading: true },
      { id: 2, title: "", desc: "", category: null, difficulty: null, skills: [], isLoading: true }
    ]);
    
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
        
        onChallengeChunk: (data) => {
          console.log("📝 Chunk recebido:", data);
          const { challenge_index, field, content } = data;
          
          // Aplicar typewriter effect no campo correspondente
          if (field === "title") {
            typewriterEffect(challenge_index, "title", content, 20);
          } else if (field === "description") {
            typewriterEffect(challenge_index, "desc", content, 15);
          } else if (field === "category") {
            // Categoria não precisa de typewriter, atualiza direto
            setChallengePlaceholders(prev => {
              const updated = [...prev];
              if (updated[challenge_index]) {
                updated[challenge_index] = {
                  ...updated[challenge_index],
                  category: content
                };
              }
              return updated;
            });
          }
        },
        
        onChallenge: (data) => {
          console.log("✅ Desafio recebido:", data);
          // Transformar e adicionar ao catálogo imediatamente
          const transformed = transformChallenges([data.data]);
          setCatalog(prev => [...prev, ...transformed]);
          setStreamMessage(`✅ Desafio ${data.number}/${data.total} gerado!`);
          
          // Marcar placeholder como completo
          setChallengePlaceholders(prev => {
            const updated = [...prev];
            if (updated[data.number - 1]) {
              updated[data.number - 1].isLoading = false;
            }
            return updated;
          });
        },
        
        onComplete: (data) => {
          console.log("🎉 Geração concluída:", data);
          setStreamMessage(data.message || "🎉 Concluído!");
          setStreamProgress(100);
          
          // Limpar timers
          typewriterTimers.forEach(timer => clearTimeout(timer));
          setTypewriterTimers([]);
          
          setTimeout(() => {
            setGeneratingChallenges(false);
            setStreamProgress(0);
            setStreamMessage("");
            setChallengePlaceholders([]);
          }, 1500);
        },
        
        onError: (data) => {
          console.error("❌ Erro no stream:", data);
          alert("Erro ao gerar desafios: " + (data.message || "Erro desconhecido"));
          setGeneratingChallenges(false);
          setStreamProgress(0);
          setStreamMessage("");
          setChallengePlaceholders([]);
          
          // Limpar timers
          typewriterTimers.forEach(timer => clearTimeout(timer));
          setTypewriterTimers([]);
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
      setChallengePlaceholders([]);
      
      // Limpar timers do typewriter
      typewriterTimers.forEach(timer => clearTimeout(timer));
      setTypewriterTimers([]);
    }
  };
  
  // Funções para análise de currículo
  const handleUploadResume = async () => {
    if (!resumeContent.trim()) {
      alert("Por favor, cole o conteúdo do seu currículo");
      return;
    }
    
    setUploadingResume(true);
    try {
      const result = await uploadResume({
        title: resumeTitle || "Meu Currículo",
        content: resumeContent
      });
      
      console.log("✅ Currículo enviado:", result);
      
      // Limpa o formulário
      setResumeContent("");
      setResumeTitle("");
      
      // Recarrega lista de currículos
      await loadResumes();
      
      alert("Currículo enviado com sucesso! Agora você pode analisá-lo.");
    } catch (error) {
      console.error("❌ Erro ao enviar currículo:", error);
      alert("Erro ao enviar currículo: " + error.message);
    } finally {
      setUploadingResume(false);
    }
  };
  
  const handleUploadResumeFile = async () => {
    if (!selectedFile) {
      alert("Por favor, selecione um arquivo");
      return;
    }
    
    setAnalysisInProgress(true);
    setAnalysisProgress(0);
    setAnalysisMessage("");
    setResumeAnalysis(null);
    
    // Limpar timers anteriores
    typewriterTimers.forEach(timer => clearTimeout(timer));
    setTypewriterTimers([]);
    
    // Resetar placeholder
    setAnalysisPlaceholder({
      resumo_executivo: "",
      pontos_fortes: [],
      gaps_tecnicos: [],
      sugestoes_melhoria: [],
      nota_geral: null,
      habilidades_evidenciadas: {}
    });
    
    try {
      console.log("🎯 Iniciando upload + análise com streaming...");
      
      const cancel = await uploadAndAnalyzeResumeFileStreaming(
        selectedFile,
        resumeTitle || selectedFile.name,
        {
          onStart: (data) => {
            console.log("🎬 Stream iniciado:", data);
            setAnalysisMessage(data.message || "Iniciando...");
          },
          
          onProgress: (data) => {
            console.log("📊 Progresso:", data);
            setAnalysisProgress(data.percent || 0);
            setAnalysisMessage(data.message || "Processando...");
          },
          
          onFieldChunk: (data) => {
            console.log("📝 Campo recebido:", data);
            const { field, content } = data;
            
            // Aplicar typewriter effect para strings
            if (field === "resumo_executivo" && typeof content === "string") {
              typewriterEffect(0, field, content, 15);
            }
            // Para arrays e números, atualizar direto
            else {
              setAnalysisPlaceholder(prev => ({
                ...prev,
                [field]: content
              }));
            }
          },
          
          onComplete: (data) => {
            console.log("🎉 Análise concluída:", data);
            setAnalysisMessage(data.message || "🎉 Análise completa!");
            setAnalysisProgress(100);
            
            // Preenche a análise final com dados completos do placeholder
            const finalAnalysis = {
              ...data.analysis,
              resumo_executivo: analysisPlaceholder.resumo_executivo || data.analysis?.resumo_executivo,
              pontos_fortes: analysisPlaceholder.pontos_fortes.length > 0 ? analysisPlaceholder.pontos_fortes : data.analysis?.pontos_fortes || [],
              gaps_tecnicos: analysisPlaceholder.gaps_tecnicos.length > 0 ? analysisPlaceholder.gaps_tecnicos : data.analysis?.gaps_tecnicos || [],
              sugestoes_melhoria: analysisPlaceholder.sugestoes_melhoria.length > 0 ? analysisPlaceholder.sugestoes_melhoria : data.analysis?.sugestoes_melhoria || [],
              nota_geral: analysisPlaceholder.nota_geral !== null ? analysisPlaceholder.nota_geral : data.analysis?.nota_geral
            };
            
            setResumeAnalysis(finalAnalysis);
            
            // Limpar timers
            typewriterTimers.forEach(timer => clearTimeout(timer));
            setTypewriterTimers([]);
            
            // Limpa o formulário
            setSelectedFile(null);
            setResumeTitle("");
            
            // Recarrega lista de currículos
            loadResumes();
            
            // Esconde barra de progresso após conclusão e faz scroll até a análise
            setTimeout(() => {
              setAnalysisInProgress(false);
              setAnalysisProgress(0);
              setAnalysisMessage("");
              
              // Scroll suave até a seção de análise após um pequeno delay para garantir que o DOM foi atualizado
              setTimeout(() => {
                if (analysisResultRef.current) {
                  analysisResultRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                }
              }, 100);
            }, 1500);
          },
          
          onError: (data) => {
            console.error("❌ Erro no stream:", data);
            alert("Erro ao analisar currículo: " + (data.message || "Erro desconhecido"));
            setAnalysisInProgress(false);
            setAnalysisProgress(0);
            setAnalysisMessage("");
            
            // Limpar timers
            typewriterTimers.forEach(timer => clearTimeout(timer));
            setTypewriterTimers([]);
          }
        }
      );
      
      // Guardar função de cancelamento
      setCancelAnalysisStream(() => cancel);
      
    } catch (error) {
      console.error("❌ Erro ao iniciar streaming:", error);
      alert("Erro ao processar arquivo: " + error.message);
      setAnalysisInProgress(false);
      setAnalysisProgress(0);
      setAnalysisMessage("");
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      // Valida tipo de arquivo
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'text/markdown'
      ];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        setSelectedFile(file);
      } else {
        alert("Tipo de arquivo não suportado. Use PDF, DOCX ou TXT.");
      }
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  const handleAnalyzeResume = async (resumeId) => {
    setAnalyzingResume(true);
    setSelectedResumeId(resumeId);
    setResumeAnalysis(null);
    
    try {
      const result = await analyzeResume(resumeId);
      
      console.log("✅ Análise recebida:", result);
      setResumeAnalysis(result);
      
      // Scroll suave até a seção de análise após carregar
      setTimeout(() => {
        if (analysisResultRef.current) {
          analysisResultRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    } catch (error) {
      console.error("❌ Erro ao analisar currículo:", error);
      
      // Detectar erros de timeout ou conexão
      const errorMsg = error.message || "";
      const isTimeoutError = errorMsg.toLowerCase().includes("timeout") || 
                             errorMsg.toLowerCase().includes("connection") ||
                             errorMsg.toLowerCase().includes("timed out");
      
      if (isTimeoutError) {
        alert(
          "⏱️ Timeout de conexão com o banco de dados.\n\n" +
          "Isso pode acontecer quando o servidor está sobrecarregado ou com problemas de rede.\n\n" +
          "Por favor, tente novamente em alguns segundos."
        );
      } else {
        alert("Erro ao analisar currículo: " + errorMsg);
      }
    } finally {
      setAnalyzingResume(false);
    }
  };
  
  const loadResumes = async () => {
    try {
      const resumes = await listResumes();
      setMyResumes(resumes);
    } catch (error) {
      console.error("❌ Erro ao carregar currículos:", error);
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
               
               // Carrega currículos do usuário
               await loadResumes();
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
            <PraxisLogo className="h-12" />
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

        {/* Placeholders durante geração (skeleton cards) */}
        {generatingChallenges && challengePlaceholders.length > 0 && (
          <div className="grid md:grid-cols-6 gap-5 mb-5">
            {challengePlaceholders.map((placeholder, index) => (
              <Card
                key={`placeholder-${placeholder.id}`}
                style={{ gridColumn: 'span 2' }}
                className="p-5 animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-md bg-zinc-200 grid place-content-center border border-zinc-300">
                      {placeholder.category ? getChallengeIcon(placeholder.category) : '●'}
                    </div>
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                      {placeholder.category ? getChallengeCategoryName(placeholder.category) : 'Gerando...'}
                    </span>
                  </div>
                  {placeholder.difficulty && <Difficulty level={placeholder.difficulty} />}
                  {!placeholder.difficulty && (
                    <div className="h-6 w-16 bg-zinc-200 rounded-full"></div>
                  )}
                </div>

                <h3 className="mt-4 text-lg font-semibold text-zinc-900 min-h-[28px]">
                  {placeholder.title || (
                    <span className="text-zinc-400 italic">
                      {placeholder.isLoading ? '...' : ''}
                    </span>
                  )}
                </h3>
                
                <p className="mt-1.5 text-sm text-zinc-600 min-h-[40px]">
                  {placeholder.desc || (
                    <span className="text-zinc-400 italic">
                      {placeholder.isLoading ? '...' : ''}
                    </span>
                  )}
                </p>

                <div className="mt-4">
                  <Meta icon="⏲️">
                    {placeholder.time || '...'}
                  </Meta>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {placeholder.skills.length > 0 ? (
                    placeholder.skills.map((s, i) => <Skill key={i}>{s}</Skill>)
                  ) : (
                    <>
                      <div className="h-6 w-16 bg-zinc-200 rounded-full"></div>
                      <div className="h-6 w-20 bg-zinc-200 rounded-full"></div>
                    </>
                  )}
                </div>
              </Card>
            ))}
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


        {/* ==================== ANÁLISE DE CURRÍCULO ==================== */}
        <div className="mt-12 mb-8">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Análise de Currículo</h2>
            <p className="text-zinc-600 text-sm">Receba feedback personalizado baseado na sua trilha de conhecimento</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-start">
              {/* Coluna 1: Upload de Currículo */}
              <Card 
                role="button"
                aria-expanded={expandedUploadCard}
                className={
                  "p-5 cursor-pointer transition-all duration-300 ease-in-out animate-fade-in " +
                  (expandedUploadCard 
                    ? "ring-2 ring-primary-300" 
                    : "hover:scale-[1.02]")
                }
                onClick={() => setExpandedUploadCard(prev => !prev)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-md bg-primary-100 text-primary-800 grid place-content-center border border-primary-200 text-sm font-semibold">
                      📄
                    </div>
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Novo Currículo
                    </span>
                  </div>
                </div>

                {!expandedUploadCard && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-zinc-900">Enviar Currículo</h3>
                    <p className="mt-1.5 text-sm text-zinc-600">Clique para anexar seu currículo e receber análise personalizada</p>
                  </div>
                )}

                {expandedUploadCard && (
                  <div className="pt-4 mt-4 border-t border-zinc-200" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-semibold text-zinc-900 mb-3">Enviar Currículo</h3>
                    
                    {/* Tabs para escolher método */}
                    <div className="flex gap-2 mb-4 border-b border-zinc-200">
                      <button
                        onClick={() => setUploadType("file")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition cursor-pointer ${
                          uploadType === "file"
                            ? "border-primary-500 text-primary-700"
                            : "border-transparent text-zinc-600 hover:text-zinc-900"
                        }`}
                      >
                        📎 Enviar Arquivo
                      </button>
                      <button
                        onClick={() => setUploadType("text")}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition cursor-pointer ${
                          uploadType === "text"
                            ? "border-primary-500 text-primary-700"
                            : "border-transparent text-zinc-600 hover:text-zinc-900"
                        }`}
                      >
                        ✏️ Colar Texto
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                          Título (opcional)
                        </label>
                        <input
                          type="text"
                          value={resumeTitle}
                          onChange={(e) => setResumeTitle(e.target.value)}
                          placeholder={uploadType === "file" ? "Ex: Currículo - Desenvolvedor Frontend" : "Ex: Currículo Atualizado 2024"}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      
                      {uploadType === "file" ? (
                        /* Upload de Arquivo com Drag and Drop */
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-2">
                            Arquivo do Currículo
                          </label>
                          <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`
                              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
                              ${isDragging 
                                ? 'border-primary-500 bg-primary-50' 
                                : selectedFile
                                  ? 'border-emerald-300 bg-emerald-50'
                                  : 'border-zinc-300 hover:border-primary-400 hover:bg-zinc-50'
                              }
                            `}
                          >
                            <input
                              type="file"
                              id="file-upload"
                              accept=".pdf,.doc,.docx,.txt,.md"
                              onChange={handleFileInputChange}
                              className="hidden"
                            />
                            
                            <label htmlFor="file-upload" className="cursor-pointer">
                              {selectedFile ? (
                                <div className="space-y-2">
                                  <div className="text-3xl">✅</div>
                                  <p className="font-medium text-zinc-900">{selectedFile.name}</p>
                                  <p className="text-sm text-zinc-500">
                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                  </p>
                                  <p className="text-xs text-zinc-400 mt-2">
                                    Clique para selecionar outro arquivo
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="text-3xl">📤</div>
                                  <p className="font-medium text-zinc-900">
                                    Arraste seu currículo aqui
                                  </p>
                                  <p className="text-sm text-zinc-500">
                                    ou clique para selecionar
                                  </p>
                                  <p className="text-xs text-zinc-400 mt-2">
                                    PDF, DOCX, DOC, TXT (máx 10 MB)
                                  </p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                      ) : (
                        /* Upload de Texto */
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Conteúdo do Currículo
                          </label>
                          <textarea
                            value={resumeContent}
                            onChange={(e) => setResumeContent(e.target.value)}
                            placeholder="Cole aqui o conteúdo do seu currículo em texto ou markdown..."
                            rows={8}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                          />
                        </div>
                      )}
                      
                      <button
                        onClick={uploadType === "file" ? handleUploadResumeFile : handleUploadResume}
                        disabled={uploadingResume || analysisInProgress || (uploadType === "file" ? !selectedFile : !resumeContent.trim())}
                        className="w-full px-4 py-2.5 bg-primary-500 text-black font-semibold rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {analysisInProgress
                          ? "Analisando..." 
                          : uploadingResume 
                            ? "Enviando..." 
                            : uploadType === "file"
                              ? "Enviar e Analisar"
                              : "Enviar Texto"}
                      </button>
                    </div>

                    {/* Botão Fechar (estilo dos desafios) */}
                    <div className="mt-5 flex justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedUploadCard(false); }}
                        className="rounded-lg px-4 py-2.5 text-sm font-medium border border-zinc-200 hover:bg-zinc-50"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Coluna 2: Meus Currículos e Análise */}
              <Card 
                role="button"
                aria-expanded={expandedMyResumesCard}
                className={
                  "p-5 cursor-pointer transition-all duration-300 ease-in-out animate-fade-in " +
                  (expandedMyResumesCard 
                    ? "ring-2 ring-primary-300" 
                    : "hover:scale-[1.02]")
                }
                onClick={() => setExpandedMyResumesCard(prev => !prev)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-md bg-emerald-100 text-emerald-800 grid place-content-center border border-emerald-200 text-sm font-semibold">
                      🤖
                    </div>
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Análise Praxis
                    </span>
                  </div>
                </div>

                {!expandedMyResumesCard && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-zinc-900">Meus Currículos</h3>
                    <p className="mt-1.5 text-sm text-zinc-600">
                      {myResumes.length === 0 
                        ? "Nenhum currículo enviado ainda" 
                        : `${myResumes.length} currículo${myResumes.length > 1 ? 's' : ''} enviado${myResumes.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                )}

                {expandedMyResumesCard && (
                  <div className="pt-4 mt-4 border-t border-zinc-200" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-semibold text-zinc-900 mb-3">Meus Currículos</h3>
                    
                    {myResumes.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500">
                        <p className="text-sm">Nenhum currículo enviado ainda.</p>
                        <p className="text-xs mt-1">Envie seu primeiro currículo ao lado!</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {myResumes.map((resume) => (
                          <div key={resume.id} className="border border-zinc-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-zinc-900 text-sm">{resume.title || "Sem título"}</h4>
                                <p className="text-xs text-zinc-500 mt-1">
                                  Enviado em {new Date(resume.created_at).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              {resume.has_analysis && (
                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✓ Analisado
                                </span>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleAnalyzeResume(resume.id)}
                              disabled={analyzingResume && selectedResumeId === resume.id}
                              className="w-full mt-2 px-3 py-1.5 text-sm font-medium border border-primary-200 text-primary-700 rounded-md hover:bg-primary-50 transition disabled:opacity-50 cursor-pointer"
                            >
                              {analyzingResume && selectedResumeId === resume.id
                                ? "Analisando..."
                                : resume.has_analysis
                                ? "Ver Análise"
                                : "Analisar com IA"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botão Fechar (estilo dos desafios) */}
                    <div className="mt-5 flex justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedMyResumesCard(false); }}
                        className="rounded-lg px-4 py-2.5 text-sm font-medium border border-zinc-200 hover:bg-zinc-50"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

          {/* Progresso e Análise em Tempo Real */}
          {analysisInProgress && (
            <div className="mt-6 space-y-4 bg-white rounded-lg shadow-md p-6 border border-primary-200">
              {/* Barra de progresso */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-700">{analysisMessage}</span>
                  <span className="text-sm font-semibold text-primary-600">{Math.round(analysisProgress)}%</span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary-400 to-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>

              {/* Placeholder da análise */}
              <div className="space-y-3 bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                {/* Resumo Executivo */}
                {analysisPlaceholder.resumo_executivo && (
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 mb-2">📋 Resumo Executivo</h4>
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                      {analysisPlaceholder.resumo_executivo}
                    </p>
                  </div>
                )}

                {/* Nota Geral */}
                {analysisPlaceholder.nota_geral !== null && (
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 mb-2">⭐ Nota Geral</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary-600">
                        {analysisPlaceholder.nota_geral}
                      </span>
                      <span className="text-sm text-zinc-600">/ 100</span>
                    </div>
                  </div>
                )}

                {/* Pontos Fortes */}
                {analysisPlaceholder.pontos_fortes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 mb-2">✅ Pontos Fortes</h4>
                    <ul className="space-y-1">
                      {analysisPlaceholder.pontos_fortes.map((ponto, idx) => (
                        <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                          <span className="text-emerald-500">•</span>
                          <span>{ponto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Gaps Técnicos */}
                {analysisPlaceholder.gaps_tecnicos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 mb-2">⚠️ Gaps Técnicos</h4>
                    <ul className="space-y-1">
                      {analysisPlaceholder.gaps_tecnicos.map((gap, idx) => (
                        <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                          <span className="text-amber-500">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sugestões de Melhoria */}
                {analysisPlaceholder.sugestoes_melhoria.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 mb-2">💡 Sugestões de Melhoria</h4>
                    <ul className="space-y-1">
                      {analysisPlaceholder.sugestoes_melhoria.map((sugestao, idx) => (
                        <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>{sugestao}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resultado da Análise */}
          {resumeAnalysis && (
            <Card ref={analysisResultRef} className="p-6 mt-6 border-2 border-primary-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Resultado da Análise</h3>
                  <p className="text-sm text-zinc-600 mt-1">Análise gerada pela Praxis com base na sua trilha</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary-600">
                    {resumeAnalysis.nota_geral || resumeAnalysis.full_report?.nota_geral || "N/A"}
                  </span>
                  <span className="text-sm text-zinc-500">/100</span>
                </div>
              </div>

              {(resumeAnalysis.resumo_executivo || resumeAnalysis.full_report) && (
                <div className="space-y-6">
                  {/* Resumo Executivo */}
                  {(resumeAnalysis.resumo_executivo || resumeAnalysis.full_report?.resumo_executivo) && (
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                      <h4 className="font-semibold text-zinc-900 mb-2 text-sm">📋 Resumo Executivo</h4>
                      <p className="text-sm text-zinc-700">{resumeAnalysis.resumo_executivo || resumeAnalysis.full_report?.resumo_executivo}</p>
                    </div>
                  )}

                  {/* Pontos Fortes */}
                  {((resumeAnalysis.pontos_fortes && resumeAnalysis.pontos_fortes.length > 0) || (resumeAnalysis.full_report?.pontos_fortes && resumeAnalysis.full_report.pontos_fortes.length > 0)) && (
                    <div>
                      <h4 className="font-semibold text-emerald-800 mb-3 text-sm flex items-center gap-2">
                        <span className="text-lg">✓</span> Pontos Fortes
                      </h4>
                      <ul className="space-y-2">
                        {(resumeAnalysis.pontos_fortes || resumeAnalysis.full_report?.pontos_fortes || []).map((ponto, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-emerald-600 mt-0.5">●</span>
                            <span className="text-zinc-700">{ponto}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Gaps Técnicos */}
                  {((resumeAnalysis.gaps_tecnicos && resumeAnalysis.gaps_tecnicos.length > 0) || (resumeAnalysis.full_report?.gaps_tecnicos && resumeAnalysis.full_report.gaps_tecnicos.length > 0)) && (
                    <div>
                      <h4 className="font-semibold text-orange-800 mb-3 text-sm flex items-center gap-2">
                        <span className="text-lg">⚠</span> Habilidades Faltantes
                      </h4>
                      <ul className="space-y-2">
                        {(resumeAnalysis.gaps_tecnicos || resumeAnalysis.full_report?.gaps_tecnicos || []).map((gap, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-orange-600 mt-0.5">●</span>
                            <span className="text-zinc-700">{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sugestões de Melhoria */}
                  {((resumeAnalysis.sugestoes_melhoria && resumeAnalysis.sugestoes_melhoria.length > 0) || (resumeAnalysis.full_report?.sugestoes_melhoria && resumeAnalysis.full_report.sugestoes_melhoria.length > 0)) && (
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-3 text-sm flex items-center gap-2">
                        <span className="text-lg">💡</span> Sugestões de Melhoria
                      </h4>
                      <ul className="space-y-2">
                        {(resumeAnalysis.sugestoes_melhoria || resumeAnalysis.full_report?.sugestoes_melhoria || []).map((sugestao, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-blue-600 mt-0.5">●</span>
                            <span className="text-zinc-700">{sugestao}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Habilidades Evidenciadas */}
                  {(resumeAnalysis.habilidades_evidenciadas || resumeAnalysis.full_report?.habilidades_evidenciadas) && (
                    <div>
                      <h4 className="font-semibold text-zinc-900 mb-3 text-sm">📊 Habilidades Evidenciadas</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(resumeAnalysis.habilidades_evidenciadas || resumeAnalysis.full_report?.habilidades_evidenciadas || {}).map(([skill, level]) => (
                          <div key={skill} className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-zinc-700">{skill}</span>
                              <span className="text-xs font-semibold text-zinc-600">{level}/100</span>
                            </div>
                            <div className="w-full bg-zinc-200 rounded-full h-2">
                              <div 
                                className="bg-primary-500 h-2 rounded-full transition-all"
                                style={{ width: `${level}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Próximos Passos */}
                  {((resumeAnalysis.proximos_passos && resumeAnalysis.proximos_passos.length > 0) || (resumeAnalysis.full_report?.proximos_passos && resumeAnalysis.full_report.proximos_passos.length > 0)) && (
                    <div className="bg-gradient-to-r from-primary-50 to-emerald-50 border border-primary-200 rounded-lg p-4">
                      <h4 className="font-semibold text-zinc-900 mb-3 text-sm flex items-center gap-2">
                        <span className="text-lg">🎯</span> Próximos Passos
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside">
                        {(resumeAnalysis.proximos_passos || resumeAnalysis.full_report?.proximos_passos || []).map((passo, idx) => (
                          <li key={idx} className="text-sm text-zinc-700 ml-2">{passo}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>


        {/* ==================== ROADMAP - PRÓXIMAS FEATURES ==================== */}
        <div className="mt-12 mb-8">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Próximas Features</h2>
            <p className="text-zinc-600 text-sm">Funcionalidades em desenvolvimento para melhorar sua experiência</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
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
        </div>

      </main>
    </div>
  );
}
