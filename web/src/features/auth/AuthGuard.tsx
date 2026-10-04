import { Alert, Button, CircularProgress, Typography } from '@mui/material'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export const AuthGuard = ({ requireUser }: { requireUser: boolean }) => {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-4"
        role="status" aria-live="polite">
        <CircularProgress aria-label="Restaurando sessão" />
        <Typography>Restaurando sua sessão…</Typography>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-4">
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>Recarregar página</Button>
      </main>
    )
  }

  if (requireUser && !user) return <Navigate to="/login" replace />
  if (!requireUser && user) return <Navigate to="/conexoes" replace />

  // Uma troca de conta desmonta a árvore privada e descarta seu estado local.
  return <Outlet key={user?.uid ?? 'public'} />
}
