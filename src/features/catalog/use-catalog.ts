import { useEffect, useState } from 'react'
import { catalogRepository } from '../../catalog/client'
import type { CatalogManifest, SpeciesRecord } from '../../catalog/types'

type Result = {
  attempt: number
  data?: { manifest: CatalogManifest; species: SpeciesRecord[] }
  error?: boolean
}
export function useCatalog() {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result>({ attempt: -1 })
  useEffect(() => {
    let active = true
    void catalogRepository
      .load()
      .then((data) => {
        if (active) setResult({ attempt, data })
      })
      .catch(() => {
        if (active) setResult({ attempt, error: true })
      })
    return () => {
      active = false
    }
  }, [attempt])
  return {
    data: result.attempt === attempt ? result.data : undefined,
    error: result.attempt === attempt && result.error,
    retry: () => {
      catalogRepository.retry()
      setAttempt((n) => n + 1)
    },
  }
}
