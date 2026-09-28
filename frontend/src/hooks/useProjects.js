import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAppStore } from '../store/useAppStore'

export function useProjects() {
  // Mesmo formato do useProfile: `loading` é derivado do idioma da resposta.
  const [result, setResult] = useState({ lang: null, data: [], error: null })
  const lang = useAppStore((s) => s.lang)

  useEffect(() => {
    // Cada troca de idioma dispara uma busca nova. O controller aborta a
    // anterior e `signal.aborted` descarta a resposta que chegar atrasada,
    // para que a do idioma antigo não sobrescreva a do idioma atual.
    const controller = new AbortController()

    api
      .get('/projects/', { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return
        setResult({ lang, data: res.data, error: null })
      })
      .catch((err) => {
        // Cancelamento não é erro: quem cancelou já iniciou outra busca.
        if (controller.signal.aborted) return
        setResult((prev) => ({ lang, data: prev.data, error: err }))
      })

    return () => controller.abort()
  }, [lang])

  const loading = result.lang !== lang
  return { data: result.data, loading, error: loading ? null : result.error }
}
