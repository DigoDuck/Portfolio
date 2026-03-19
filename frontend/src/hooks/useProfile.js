import { useState, useEffect } from "react";
import api from "../api/client";
import { useAppStore } from "../store/useAppStore";

export function useProfile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lang = useAppStore((s) => s.lang);

  useEffect(() => {
    setLoading(true);
    api
      .get("/profile")
      .then((res) => setData(res.data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [lang]); // Recarrega quando o idioma mudar

  return { data, loading, error };
}
