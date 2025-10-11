import { useState } from 'react'

interface AlertState {
  message: string
  type: 'success' | 'error' | 'info'
}

export function useAlert() {
  const [alert, setAlert] = useState<AlertState | null>(null)

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlert({ message, type })
  }

  const closeAlert = () => {
    setAlert(null)
  }

  return { alert, showAlert, closeAlert }
}
