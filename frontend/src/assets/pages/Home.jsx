// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchUser, fetchChallenges } from "../lib/api.js";
import {
  Pill,
  Difficulty,
  Skill,
  Meta,
  Card,
  PrimaryButton,
} from "../components/ui.jsx";

export default function Home() {
  const [user, setUser] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // carrega usuário + catálogo
  useEffect(() => {
    (async () => {
      try {
        const [u, c] = await Promise.all([fetchUser(), fetchChallenges()]);
        setUser(u);
        setCatalog(c);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // controla clique fora de cards
  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };
  useEffect(() => {
    const onDocClick = (e) => {
      if (!(e.target.closest && e.target.closest('[role="button"]'))) {
        setExpandedId(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // score para relevância
  const score = (ch, u) => {
    if (!u) return 0;
    let s = 0;
    if (ch.skills?.some((x) => u.skills.includes(x))) s += 2;
    if (ch.tags?.some((t) => u.interests.includes(t))) s += 1;
    if (u.level === "junior" && ch.difficulty === "Fácil") s += 1;
    if (u.level === "senior" && ch.difficulty === "Difícil") s += 1;
    return s;
  };

  const recommended = useMemo(() => {
    const avail = catalog.filter((c) => c.status === "available");
    return avail.sort((a, b) => score(b, user) - score(a, user));
  }, [catalog, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-600">
        Carregando…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 group"
            aria-label="Início"
          >
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
              className="px-3 py-1.5 rounded-md bg-primary-100 text-primary-800 border border-primary-200 text-sm"
            >
              Home
            </Link>
            <Link
              to="/perfil"
              className="px-3 py-1.5 rounded-md hover:bg-zinc-50 border border-zinc-200 text-sm"
            >
              Perfil
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {/* Perfil */}
        {user && (
          <Card className="p-5 mb-8">
            <div className="grid sm:grid-cols-2 gap-6 items-start">
              <div>
                <h3 className="text-zinc-800 font-semibold">
                  Olá, {user.name}! Seu Perfil de Habilidades
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Pontos Fortes
                  </Pill>
                  {user.skills.map((s) => (
                    <Skill key={s}>{s}</Skill>
                  ))}
                </div>
              </div>
              <div className="sm:text-right">
                <h3 className="text-zinc-800 font-semibold">Interesses</h3>
                <div className="mt-3 flex flex-wrap sm:justify-end gap-2">
                  {user.interests.map((i) => (
                    <Skill key={i}>{i}</Skill>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Recomendados */}
        <div className="mb-4">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            Recomendados para você
          </h2>
          <p className="text-zinc-600 text-sm">
            Baseado nas suas habilidades e interesses
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {recommended.slice(0, 3).map((c) => {
            const expanded = expandedId === c.id;
            return (
              <Card
                key={c.id}
                role="button"
                aria-expanded={expanded}
                onClick={() => toggleExpand(c.id)}
                className={
                  "p-5 cursor-pointer transition-transform duration-200 " +
                  (expanded
                    ? "ring-2 ring-primary-300 scale-[1.02]"
                    : "hover:scale-[1.01]")
                }
              >
                <div className="flex items-start justify-between">
                  <div className="h-9 w-9 rounded-md bg-primary-100 text-primary-800 grid place-content-center border border-primary-200">
                    ⚙️
                  </div>
                  <Difficulty level={c.difficulty} />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                  {c.title}
                </h3>
                <p className="mt-1.5 text-sm text-zinc-600">{c.desc}</p>

                <div className="mt-4">
                  <Meta icon="⏲️">{c.time}</Meta>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {c.skills.map((s) => (
                    <Skill key={s}>{s}</Skill>
                  ))}
                </div>

                <div
                  className={
                    "overflow-hidden transition-[max-height,opacity] duration-300 ease-out " +
                    (expanded
                      ? "max-h-[360px] opacity-100"
                      : "max-h-0 opacity-0")
                  }
                >
                  <div className="pt-4 mt-4 border-t border-zinc-200">
                    <p className="text-sm text-zinc-700">
                      <span className="font-medium">Objetivo:</span> resolver o
                      desafio aplicando as skills acima e registrando suas
                      decisões técnicas.
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-zinc-700">
                      <div>
                        <span className="font-medium">Pré-requisitos:</span>{" "}
                        {c.skills.join(", ")}
                      </div>
                      <div>
                        <span className="font-medium">
                          O que será avaliado:
                        </span>{" "}
                        clareza do código, testes básicos, comunicação (README)
                        e performance.
                      </div>
                      <div>
                        <span className="font-medium">Passos sugeridos:</span>{" "}
                        entender o bug/feature, planejar, implementar, testar e
                        documentar.
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <PrimaryButton>
                        <span onClick={(e) => e.stopPropagation()}>
                          Começar desafio
                        </span>
                      </PrimaryButton>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(null);
                        }}
                        className="rounded-lg px-4 py-2.5 text-sm font-medium border border-zinc-200 hover:bg-zinc-50"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Features futuras */}
        <div className="mt-8 grid md:grid-cols-2 gap-5">
          {/* Simulação de Entrevista */}
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div className="h-9 w-9 rounded-md bg-primary-100 text-primary-800 grid place-content-center border border-primary-200">
                💬
              </div>
              <Difficulty level="Em breve" />
            </div>

            <div className="mt-3">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-800 border border-primary-200">
                Roadmap
              </span>
            </div>

            <h3 className="mt-3 text-lg font-semibold text-zinc-900">
              Simulação de Entrevista
            </h3>
            <p className="mt-1.5 text-sm text-zinc-600">
              Pratique entrevistas técnicas e comportamentais com IA
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

          {/* Plano de Ação Personalizado */}
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div className="h-9 w-9 rounded-md bg-primary-100 text-primary-800 grid place-content-center border border-primary-200">
                🎯
              </div>
              <Difficulty level="Em breve" />
            </div>

            <div className="mt-3">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-primary-50 text-primary-800 border border-primary-200">
                Roadmap
              </span>
            </div>

            <h3 className="mt-3 text-lg font-semibold text-zinc-900">
              Plano de Ação Personalizado
            </h3>
            <p className="mt-1.5 text-sm text-zinc-600">
              Receba um roteiro baseado nas suas habilidades e objetivos
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
