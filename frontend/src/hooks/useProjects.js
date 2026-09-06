import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAppStore } from '../store/useAppStore'

export function useProjects() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const lang = useAppStore((s) => s.lang)

  useEffect(() => {
    // Cada troca de idioma dispara uma busca nova. O controller aborta a
    // anterior e `signal.aborted` descarta a resposta que chegar atrasada,
    // para que a do idioma antigo não sobrescreva a do idioma atual.
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    api
      .get('/projects/', { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return
        setData(res.data)
        setLoading(false)
      })
      .catch((err) => {
        // Cancelamento não é erro: quem cancelou já iniciou outra busca.
        if (controller.signal.aborted) return
        setError(err)
        setLoading(false)
      })

    return () => controller.abort()
  }, [lang])

  return { data, loading, error }
}
