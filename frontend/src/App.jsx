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

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return <LoadingSpinner />;
  }

  // Se não tem usuário, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se tem usuário, renderiza a rota protegida
  return children;
}

// --- Rota pública (redireciona se já estiver logado) ---
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  // Se já está logado, redireciona IMEDIATAMENTE sem mostrar a página
  if (user) {
    return <Navigate to="/home" replace />;
  }

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return <LoadingSpinner />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* --- Rota pública (acessível a todos) --- */}
        <Route path="/" element={<Landing />} />

        {/* --- Rotas públicas (só para não logados) --- */}
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

              {/* --- Rota fallback (404) --- */}
              <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
