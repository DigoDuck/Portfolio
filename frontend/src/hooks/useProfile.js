import { useState, useEffect } from "react";
import api from "../api/client";
import { useAppStore } from "../store/useAppStore";

export function useProfile() {
  // A resposta guarda o idioma a que pertence. `loading` é derivado disso em vez
  // de ser estado próprio: não há setState síncrono no efeito, e a troca de
  // idioma já conta como carregando no mesmo render em que acontece.
  const [result, setResult] = useState({ lang: null, data: null, error: null });
  const lang = useAppStore((s) => s.lang);

  useEffect(() => {
    // Cada troca de idioma dispara uma busca nova. O controller aborta a
    // anterior e `signal.aborted` descarta a resposta que chegar atrasada,
    // para que a do idioma antigo não sobrescreva a do idioma atual.
    const controller = new AbortController();

    api
      .get("/profile", { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        setResult({ lang, data: res.data, error: null });
      })
      .catch((err) => {
        // Cancelamento não é erro: quem cancelou já iniciou outra busca.
        if (controller.signal.aborted) return;
        setResult((prev) => ({ lang, data: prev.data, error: err }));
      });

    return () => controller.abort();
  }, [lang]); // Recarrega quando o idioma mudar

  const loading = result.lang !== lang;
  return { data: result.data, loading, error: loading ? null : result.error };
}
