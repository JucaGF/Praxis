/**
 * Cliente Supabase - Autenticação e banco de dados
 * 
 * Este módulo configura e exporta o cliente Supabase para autenticação
 * e acesso ao banco de dados.
 * 
 * Funcionalidades:
 * - Autenticação de usuários (login, logout, registro)
 * - Gerenciamento de sessões (tokens JWT)
 * - Acesso ao banco de dados (queries, mutations)
 * - Real-time subscriptions (opcional)
 * 
 * Configuração:
 * - VITE_SUPABASE_URL: URL do projeto Supabase
 * - VITE_SUPABASE_ANON_KEY: Chave anônima do Supabase
 * 
 * Uso:
 * ```javascript
 * import { supabase } from './lib/supabaseClient';
 * 
 * // Autenticação
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'password'
 * });
 * 
 * // Acesso ao banco
 * const { data, error } = await supabase
 *   .from('profiles')
 *   .select('*');
 * ```
 */

import { createClient } from "@supabase/supabase-js";

/**
 * URL do projeto Supabase.
 * 
 * Obtida da variável de ambiente VITE_SUPABASE_URL.
 * Obrigatória para o funcionamento da aplicação.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

/**
 * Chave anônima do Supabase.
 * 
 * Obtida da variável de ambiente VITE_SUPABASE_ANON_KEY.
 * Obrigatória para o funcionamento da aplicação.
 * Esta chave é segura para uso no frontend (RLS protegido).
 */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação de variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO: Variáveis do Supabase não configuradas!");
  console.error("Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no .env");
}

/**
 * Cliente Supabase configurado.
 * 
 * Instância do cliente Supabase usada para autenticação
 * e acesso ao banco de dados em toda a aplicação.
 * 
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
