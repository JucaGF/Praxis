// src/pages/Dashboard.jsx

import React from "react";
// Importa o hook customizado para gerenciar a autenticação
import { useAuth } from "../hooks/useAuth";
// Importa o Navigate do React Router para redirecionamento
import { Navigate } from "react-router-dom";

export default function Dashboard() {
  // Desestrutura os valores e funções do nosso hook
  const { user, loading, signOut, isLoggedIn } = useAuth();

  // --- 1. Estado de Carregamento ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 font-sans">
        <p className="text-xl font-medium text-gray-700">
          Carregando Dashboard...
        </p>
      </div>
    );
  }

  // --- 2. Proteção de Rota (Não Logado) ---
  // Se terminou de carregar (loading=false) e não está logado (isLoggedIn=false), redireciona.
  if (!isLoggedIn) {
    // Redireciona para a rota de login
    return <Navigate to="/login" replace />;
  }

  // --- 3. Exibição de Dados (Logado) ---
  // Pega o nome do usuário dos metadados que salvamos no cadastro
  const userName = user.user_metadata?.nome || user.email;
  const userProfissao = user.user_metadata?.profissao || "Não definida";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 font-sans">
      <div className="p-10 text-center bg-white shadow-2xl rounded-xl border border-gray-200 max-w-md">
        <h1 className="text-3xl font-bold text-yellow-600 mb-4">
          Bem-vindo(a) à Praxis!
        </h1>
        <p className="text-base text-gray-700 mb-8">
          Sua conta para **{userName}** está ativa.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Sua profissão: **{userProfissao}**.
        </p>
        <button
          onClick={signOut} // Chama a função de logout do Supabase
          className="py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150 font-semibold text-lg shadow-md"
        >
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
