'use client'

import { useEffect, useState } from 'react'

export interface CategoryOption {
  id: string
  name: string
}

export interface LocationOption {
  id: string
  name: string
  type?: string
}

export function useApiOptions(): {
  apiCategories: CategoryOption[]
  apiLocations: LocationOption[]
  optionsLoading: boolean
  optionsError: string | null
} {
  const [apiCategories, setApiCategories] = useState<CategoryOption[]>([])
  const [apiLocations, setApiLocations] = useState<LocationOption[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setOptionsLoading(true)
    setOptionsError(null)
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/locations').then((r) => r.json()),
    ])
      .then(([catRes, locRes]) => {
        if (cancelled) return
        const err: string[] = []
        if (catRes.success && catRes.data) setApiCategories(catRes.data)
        else err.push(catRes.error?.message || 'Failed to load categories')
        if (locRes.success && locRes.data) setApiLocations(locRes.data)
        else err.push(locRes.error?.message || 'Failed to load locations')
        if (err.length) setOptionsError(err.join('. '))
      })
      .catch((e) => {
        if (!cancelled) setOptionsError(e?.message || 'Failed to load options')
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { apiCategories, apiLocations, optionsLoading, optionsError }
}
