'use client'

import { useState, useEffect } from 'react'
import { DEFAULT_MODEL_ID } from '@/shared/lib/models'

export function useGlobalModel() {
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID)

  useEffect(() => {
    const saved = localStorage.getItem('chat_model_id')
    if (saved) {
      setModelId(saved)
    }
  }, [])

  const setAndSaveModelId = (id: string) => {
    setModelId(id)
    localStorage.setItem('chat_model_id', id)
  }

  return { modelId, setModelId: setAndSaveModelId }
}
