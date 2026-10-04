import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Typography } from '@mui/material'
import { useAuth } from '../features/auth/useAuth'
import { getAuthErrorMessage, logout } from '../features/auth/authService'

export const AppHeader = () => {
  const { user } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      await logout()
    } catch (cause) {
      setError(getAuthErrorMessage(cause))
      setPending(false)
    }
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <Typography component={Link} to="/conexoes" variant="h6" className="font-semibold text-blue-600 no-underline">Broadcast</Typography>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Typography variant="body2" className="break-all text-slate-600">{user?.email}</Typography>
          <Button variant="outlined" onClick={handleLogout} loading={pending} className="min-h-11">Sair</Button>
        </div>
      </header>
      {error && <Alert severity="error" className="mt-4">{error}</Alert>}
    </>
  )
}
