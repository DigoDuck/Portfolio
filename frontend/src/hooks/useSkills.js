import { useState, useEffect } from 'react'
import api from '../api/client'

export function useSkills() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    api
      .get('/skills/', { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return
        setData(res.data)
        setLoading(false)
      })
      .catch((err) => {
        // Cancelamento não é erro: só acontece quando o componente desmonta.
        if (controller.signal.aborted) return
        setError(err)
        setLoading(false)
      })

    return () => controller.abort()
  }, [])

  return { data, loading, error }
}
