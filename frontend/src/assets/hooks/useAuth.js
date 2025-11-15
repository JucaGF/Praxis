/**
 * Hook de autenticação para React
 * 
 * Este hook gerencia o estado de autenticação do usuário usando Supabase.
 * Fornece informações sobre o usuário logado e estado de carregamento.
 * 
 * Funcionalidades:
 * - Obtém sessão atual do Supabase
 * - Escuta mudanças no estado de autenticação
 * - Fornece estado de loading enquanto verifica autenticação
 * - Retorna usuário logado ou null
 * 
 * @module useAuth
 * @returns {Object} Objeto com user, isLoggedIn e loading
 * @returns {Object|null} user - Dados do usuário logado ou null
 * @returns {boolean} isLoggedIn - Indica se o usuário está logado
 * @returns {boolean} loading - Indica se está verificando autenticação
 * 
 * @example
 * ```jsx
 * function MyComponent() {
 *   const { user, isLoggedIn, loading } = useAuth();
 *   
 *   if (loading) return <Loading />;
 *   if (!isLoggedIn) return <Login />;
 *   
 *   return <div>Olá, {user.email}</div>;
 * }
 * ```
 */

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Hook para gerenciar autenticação do usuário
 * 
 * @returns {Object} Objeto com user, isLoggedIn e loading
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Obtém a sessão atual do Supabase
     */
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) console.error("Erro ao obter sessão:", error);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    // Obtém sessão inicial
    getSession();

    // Escuta mudanças no estado de autenticação
    // Isso dispara quando o usuário faz login, logout, etc
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Limpa subscription ao desmontar componente
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Adicionar propriedade isLoggedIn para compatibilidade
  const isLoggedIn = !!user;

  return { user, isLoggedIn, loading };
}
