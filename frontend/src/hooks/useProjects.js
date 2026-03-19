import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAppStore } from '../store/useAppStore'

export function useProjects() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const lang = useAppStore((s) => s.lang)

  useEffect(() => {
    api.get('/projects/')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [lang])

  return { data, loading }
}