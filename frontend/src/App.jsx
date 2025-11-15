/**
 * Componente principal da aplicação React
 * 
 * Este componente configura o roteamento da aplicação usando React Router.
 * Gerencia rotas públicas e protegidas, autenticação e navegação.
 * 
 * Rotas:
 * - Públicas: /, /login, /cadastro, /github-callback, /cadastro-sucesso, /force-logout
 * - Protegidas: /home, /perfil, /desafio/:id, /challenge-result, /onboarding
 * 
 * @module App
 */

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// --- Páginas ---
import Landing from "./assets/pages/Landing";
import Login from "./assets/pages/Login";
import Cadastro from "./assets/pages/Cadastro";
import Home from "./assets/pages/Home";
import Profile from "./assets/pages/Profile";
import Challenge from "./assets/pages/Challenge";
import ChallengeResult from "./assets/pages/ChallengeResult";
import Onboarding from "./assets/pages/Onboarding";
import ForceLogout from "./assets/pages/ForceLogout";
import GitHubCallback from "./assets/pages/GitHubCallback";
import CadastroSucesso from "./assets/pages/CadastroSucesso";

// --- Hook de autenticação ---
import { useAuth } from "./assets/hooks/useAuth";

// --- Toast Provider ---
import { ToastProvider } from "./assets/components/ui/Toast";

/**
 * Componente de loading spinner
 * 
 * Exibido enquanto a aplicação verifica autenticação do usuário.
 * 
 * @returns {JSX.Element} Componente de loading
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        <p className="text-zinc-600">Carregando...</p>
      </div>
    </div>
  );
}

/**
 * Componente de rota protegida
 * 
 * Verifica se o usuário está autenticado antes de renderizar o conteúdo.
 * Se não estiver autenticado, redireciona para /login.
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Componente filho a ser renderizado
 * @returns {JSX.Element} Componente filho ou redirecionamento
 */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

/**
 * Componente de rota pública
 * 
 * Verifica se o usuário está autenticado.
 * Se estiver autenticado, redireciona para /home.
 * Se não estiver, renderiza o conteúdo público.
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Componente filho a ser renderizado
 * @returns {JSX.Element} Componente filho ou redirecionamento
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/home" replace />;

  return children;
}

/**
 * Componente principal da aplicação
 * 
 * Configura o roteamento da aplicação com React Router.
 * Envolve a aplicação com ToastProvider para notificações.
 * 
 * @returns {JSX.Element} Componente principal da aplicação
 */
export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* --- Rota pública (acessível a todos) --- */}
          <Route path="/" element={<Landing />} />

          {/* --- Rota de emergência para forçar logout (sempre acessível) --- */}
          <Route path="/force-logout" element={<ForceLogout />} />

          {/* --- Rotas públicas (redirecionam se já estiver logado) --- */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/cadastro"
            element={
              <PublicRoute>
                <Cadastro />
              </PublicRoute>
            }
          />

          {/* --- Rotas de callback OAuth (públicas) --- */}
          <Route path="/github-callback" element={<GitHubCallback />} />
          <Route path="/cadastro-sucesso" element={<CadastroSucesso />} />

          {/* --- Rotas protegidas (só para logados) --- */}
          <Route
            path="/onboarding"
            element={
              <PrivateRoute>
                <Onboarding />
              </PrivateRoute>
            }
          />
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/desafio/:id"
            element={
              <PrivateRoute>
                <Challenge />
              </PrivateRoute>
            }
          />
          <Route
            path="/challenge-result"
            element={
              <PrivateRoute>
                <ChallengeResult />
              </PrivateRoute>
            }
          />

          {/* --- Fallback: redireciona para home se rota não encontrada --- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
