import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function GitHubCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleGitHubCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
          // Usuário autenticado com GitHub - verifica se precisa fazer onboarding
          const user = data.session.user;

          try {
            const response = await fetch(
              `${
                import.meta.env.VITE_API_URL || "http://localhost:8000"
              }/attributes`,
              {
                headers: {
                  Authorization: `Bearer ${data.session.access_token}`,
                },
              }
            );

            if (response.status === 404 || !response.ok) {
              navigate("/onboarding", { replace: true });
              return;
            }

            const attributes = await response.json();

            const hasRealData =
              attributes &&
              attributes.tech_skills &&
              Object.keys(attributes.tech_skills).length > 0 &&
              attributes.soft_skills &&
              Object.keys(attributes.soft_skills).length > 0;

            if (!hasRealData) {
              navigate("/onboarding", { replace: true });
              return;
            }

            navigate("/home", { replace: true });
          } catch (apiError) {
            console.warn("⚠️ Erro ao verificar attributes:", apiError);
            navigate("/onboarding", { replace: true });
          }
        } else {
          setError("Falha na autenticação com GitHub");
        }
      } catch (err) {
        setError(`Erro: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    handleGitHubCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processando autenticação...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Erro</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}
