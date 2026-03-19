import { useState, useEffect } from 'react'
import api from '../api/client'

export function useSkills() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/skills/')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}