// src/App.jsx
import { useEffect } from "react";

export default function Landing() {
  useEffect(() => {
    // ano no footer
    const y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());

    // Rotação "Pratique. Evolua. Cresça."
    const el = document.getElementById("rotating-word");
    if (el) {
      const words = ["Pratique.", "Evolua.", "Cresça."];
      let i = 0;
      const setWord = (w) => {
        if (w.toLowerCase().startsWith("evolua")) el.classList.add("text-primary-600");
        else el.classList.remove("text-primary-600");
        el.textContent = w;
      };
      const cycle = () => {
        el.classList.remove("word-in");
        el.classList.add("word-out");
        setTimeout(() => {
          i = (i + 1) % words.length;
          setWord(words[i]);
          el.classList.remove("word-out");
          el.classList.add("word-in");
        }, 200);
      };
      setWord(words[0]);
      el.classList.add("word-in");
      const it = setInterval(cycle, 2200);
      return () => clearInterval(it);
    }
  }, []);

  useEffect(() => {
    // Efeito global: chips fogem do mouse
    const chips = document.querySelectorAll(".shadow-chip");
    const repelStrength = 250;
    const maxMove = 60;

    const onMove = (e) => {
      const mouseX = e.clientX, mouseY = e.clientY;
      chips.forEach((chip) => {
        const rect = chip.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx, dy = mouseY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < repelStrength) {
          const force = (repelStrength - dist) / repelStrength;
          const moveX = -dx * force * (maxMove / repelStrength);
          const moveY = -dy * force * (maxMove / repelStrength);
          chip.style.transform = `translate(${moveX}px, ${moveY}px)`;
        } else {
          chip.style.transform = "";
        }
      });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", () => {
      chips.forEach((chip) => (chip.style.transform = ""));
    });
    return () => {
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <a href="#" className="flex items-center gap-2 group" aria-label="Início">
              <div className="w-8 h-8 rounded-md bg-primary-500 text-zinc-900 grid place-content-center font-black group-hover:bg-primary-600 transition">P</div>
              <span className="font-extrabold tracking-tight text-xl">Praxis<span className="text-primary-600">:</span></span>
            </a>
            <div className="flex items-center gap-3">
              <a href="#login" className="px-4 py-2 text-sm font-medium hover:text-zinc-700">Entrar</a>
              <a href="#signup" className="px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800">Criar conta</a>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative py-28 md:py-40 flex flex-col items-center text-center">
            <h1 className="font-display font-black tracking-tight text-4xl sm:text-6xl md:text-7xl leading-[1.05]">
              <span id="rotating-word" className="inline-block">Pratique.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-zinc-600 text-center mx-auto">
              Uma plataforma prática de desenvolvimento profissional que te guia em uma jornada de aprendizado.
            </p>

            {/* CHIPS */}
            <div className="select-none" aria-hidden="true">
              <div className="absolute inset-0 z-0">
                {/* Seus chips existentes — copie/cole os seus blocos e pode adicionar outros aqui */}
                <div className="absolute top-[5%] left-[4%] floaty" data-delay="1">
                  <span className="inline-block rounded-xl bg-white border border-zinc-200 px-5 py-2 shadow-chip">Desafios práticos</span>
                </div>
                <div className="absolute top-[25%] left-[10%] drifty" data-delay="2">
                  <span className="inline-block rounded-xl bg-white border border-zinc-200 px-5 py-2 shadow-chip">Feedback contínuo</span>
                </div>
                <div className="absolute top-[15%] left-[35%] floaty" data-delay="3">
                  <span className="inline-block rounded-xl bg-white border border-zinc-200 px-5 py-2 shadow-chip">Portfólio</span>
                </div>
                <div className="absolute top-[10%] right-[12%] drifty" data-delay="4">
                  <span className="inline-block rounded-xl bg-white border border-zinc-200 px-5 py-2 shadow-chip">Soft skills</span>
                </div>
                <div className="absolute top-[35%] right-[8%] floaty" data-delay="5">
                  <span className="inline-block rounded-xl bg-white border border-zinc-200 px-5 py-2 shadow-chip">Tech skills</span>
                </div>
                <div className="absolute top-[15%] right-[25%] drifty" data-delay="3">
                  <span className="inline-block rounded-xl bg-white border border-zinc-200 px-5 py-2 shadow-chip">Relatórios</span>
                </div>

                <div className="hidden sm:block">
                  <div className="absolute bottom-[23%] left-[20%] floaty" data-delay="2">
                    <span className="inline-block rounded-xl bg-white border border-zinc-200 px-5 py-2 shadow-chip">Simulações reais</span>
                  </div>
                  <div className="absolute bottom-[19%] left-[45%] drifty" data-delay="4">
                    <span className="inline-block rounded-xl bg-white border border-zinc-200 px-5 py-2 shadow-chip">Progresso</span>
                  </div>
                  <div className="absolute bottom-[20%] left-[65%] floaty" data-delay="1">
                    <span className="inline-block rounded-xl bg-white border border-zinc-200 px-5 py-2 shadow-chip">Trilha de carreira</span>
                  </div>
                  <div className="absolute bottom-[10%] right-[8%] drifty" data-delay="5">
                    <span className="inline-block rounded-xl bg-white border border-zinc-200 px-5 py-2 shadow-chip">Projetos reais</span>
                  </div>
                  <div className="absolute bottom-[12%] left-[6%] drifty" data-delay="3">
                    <span className="inline-block rounded-xl bg-white border border-zinc-200 px-5 py-2 shadow-chip">Evolução</span>
                  </div>
                </div>
              </div>
            </div>
            {/* /CHIPS */}
          </div>
        </div>
      </section>

      {/* SEÇÃO COMO FUNCIONA (igual a sua) */}
      <section id="como-funciona" className="border-t border-zinc-100 bg-zinc-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Como funciona?</h2>
          <p className="mt-3 max-w-2xl text-zinc-600">Junte-se à essa jornada.</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              ["1) Crie seu perfil","Informe habilidades, nível e objetivos. Usamos isso para personalizar os desafios."],
              ["2) Receba desafios práticos","Simulações de mercado: bugfix, tickets, planejamento e comunicação."],
              ["3) Envie soluções","Submeta seu código/entrega e registre decisões técnicas e soft skills."],
              ["4) Receba feedback","Retorno objetivo sobre técnica, comunicação e trabalho em equipe."],
              ["5) Evolua e desbloqueie trilhas","Acompanhe o progresso, monte portfólio e avance nas trilhas de carreira."]
            ].map(([t,d])=>(
              <article key={t} className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm hover:shadow-[0_0_90px_rgba(250,204,21,0.38)] transition">
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-zinc-600">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-sm text-zinc-500 flex flex-wrap items-center justify-between gap-4">
          <p>© <span id="year"></span> Praxis. Todos os direitos reservados.</p>
          <nav className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-700">Termos</a>
            <a href="#" className="hover:text-zinc-700">Privacidade</a>
            <a href="#" className="hover:text-zinc-700">Contato</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
