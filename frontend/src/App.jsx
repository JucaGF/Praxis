// src/App.jsx
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
import QuestionarioSoft from "./assets/pages/Questionario_soft"; // ✅ Soft Skills
import QuestionarioHardBack from "./assets/pages/Questionario_hard_back"; // ✅ Backend
import QuestionarioHardFront from "./assets/pages/Questionario_hard_front"; // ✅ Frontend
import QuestionarioHardDados from "./assets/pages/Questionario_hard_dados"; // ✅ Engenheiro de Dados
import QuestionarioHardFullstack from "./assets/pages/Questionario_hard_fullstack"; // ✅ Full Stack

// --- Hook de autenticação ---
import { useAuth } from "./assets/hooks/useAuth";

// --- Componente de Loading ---
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

// --- Rota protegida ---
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

// --- Rota pública (redireciona se já estiver logado) ---
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/home" replace />;

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* --- Rota pública (acessível a todos) --- */}
        <Route path="/" element={<Landing />} />

        {/* --- Rotas públicas --- */}
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

        {/* ✅ Questionários */}
        <Route path="/questionario-soft" element={<QuestionarioSoft />} />
        <Route
          path="/questionario-hard-back"
          element={<QuestionarioHardBack />}
        />
        <Route
          path="/questionario-hard-front"
          element={<QuestionarioHardFront />}
        />
        <Route
          path="/questionario-hard-dados"
          element={<QuestionarioHardDados />}
        />
        <Route
          path="/questionario-hard-fullstack"
          element={<QuestionarioHardFullstack />}
        />

        {/* --- Rotas protegidas (só para logados) --- */}
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

        {/* --- Fallback --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
