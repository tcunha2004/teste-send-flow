import { useState } from 'react'
import { Alert, Button, Paper, Typography } from '@mui/material'
import { useAuth } from '../auth/useAuth'
import { getAuthErrorMessage, logout } from '../auth/authService'

export const ConnectionsPage = () => {
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
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <Typography variant="h6">Broadcast</Typography>
          <div className="flex min-w-0 flex-wrap items-center gap-4">
            <Typography variant="body2" className="break-all text-slate-600">{user?.email}</Typography>
            <Button variant="outlined" onClick={handleLogout} loading={pending} className="min-h-11">
              Sair
            </Button>
          </div>
        </header>
        {error && <Alert severity="error" className="mt-6">{error}</Alert>}
        <Typography component="h1" variant="h4" className="mt-8 font-semibold">Conexões</Typography>
        <Paper elevation={0} className="mt-6 rounded-2xl border border-slate-200 p-6 sm:p-8">
          <Typography component="h2" variant="h6">Sua conta está pronta</Typography>
          <Typography className="mt-3 text-slate-600">
            O gerenciamento de conexões estará disponível em uma próxima etapa.
          </Typography>
        </Paper>
      </div>
    </main>
  )
}
