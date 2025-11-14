// src/pages/ForceLogout.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

/**
 * Página de emergência para forçar logout e limpar sessão
 * 
 * Use esta página quando:
 * - Você apagou sua conta do Supabase mas ainda está vendo sessão ativa
 * - Está preso em loop de redirecionamento
 * - Precisa limpar completamente a sessão local
 * 
 * Acesse via: /force-logout
 */
export default function ForceLogout() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("waiting"); // waiting | cleaning | success | error
  const [message, setMessage] = useState("");

  const handleForceLogout = async () => {
    try {
      setStatus("cleaning");
      setMessage("Limpando sessão do Supabase...");
      
      // 1. Fazer logout do Supabase
      await supabase.auth.signOut();
      
      setMessage("Limpando dados locais...");
      
      // 2. Limpar TUDO do localStorage e sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      setMessage("Limpando cookies (se houver)...");
      
      // 3. Tentar limpar cookies (alguns navegadores não permitem via JS)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      setStatus("success");
      setMessage("✅ Sessão limpa com sucesso!");
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
      
    } catch (error) {
      console.error("❌ Erro ao forçar logout:", error);
      setStatus("error");
      setMessage(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white shadow-2xl rounded-2xl p-8 border border-red-100">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <span className="text-3xl">🚪</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Forçar Logout
            </h1>
            <p className="text-sm text-gray-600">
              Esta página irá limpar completamente sua sessão local
            </p>
          </div>

          {/* Informações */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 mb-2 font-semibold">
              ⚠️ Use esta opção se:
            </p>
            <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
              <li>Você apagou sua conta do Supabase diretamente</li>
              <li>Está preso em loop de redirecionamento</li>
              <li>A sessão parece corrompida ou inválida</li>
              <li>O botão normal de logout não funciona</li>
            </ul>
          </div>

          {/* Status */}
          {status === "waiting" && (
            <button
              onClick={handleForceLogout}
              className="w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition cursor-pointer shadow-md"
            >
              🚪 Limpar Sessão Agora
            </button>
          )}

          {status === "cleaning" && (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-6">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-600 font-semibold mb-2">{message}</p>
              <p className="text-xs text-gray-500">Redirecionando...</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-6">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-red-600 mb-4">{message}</p>
              <button
                onClick={handleForceLogout}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition cursor-pointer"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Ajuda adicional */}
          {status === "waiting" && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-3">
                Se mesmo assim não funcionar, limpe os dados do site manualmente:
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Chrome/Edge:</strong> F12 → Application → Clear storage</p>
                <p><strong>Firefox:</strong> F12 → Storage → Clear All</p>
                <p><strong>Safari:</strong> Develop → Clear caches</p>
              </div>
            </div>
          )}
        </div>

        {/* Link de volta */}
        {status === "waiting" && (
          <div className="text-center mt-4">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-gray-600 hover:text-gray-900 transition"
            >
              ← Voltar para página inicial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}









