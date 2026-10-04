import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, InputAdornment, Paper, TextField, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { getAuthErrorMessage, login, register } from './authService'

export const AuthPage = ({ mode }: { mode: 'login' | 'register' }) => {
  const isRegister = mode === 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationError, setConfirmationError] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    setError(null)
    setConfirmationError(false)

    if (isRegister && password !== confirmation) {
      setConfirmationError(true)
      return
    }

    setPending(true)
    try {
      await (isRegister ? register(email, password) : login(email, password))
    } catch (cause) {
      setError(getAuthErrorMessage(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <Paper elevation={0} className="w-full max-w-md rounded-2xl border border-slate-200 p-6 sm:p-8">
        <Typography component="h1" variant="h4" className="font-semibold">
          {isRegister ? 'Crie sua conta' : 'Entre no Broadcast'}
        </Typography>
        <Typography className="mt-3 text-slate-600">
          {isRegister
            ? 'Organize suas conexões, contatos e mensagens em um só lugar.'
            : 'Acesse sua conta para organizar contatos e preparar mensagens.'}
        </Typography>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            id="email" label="Email" type="email" autoComplete="email" required fullWidth
            value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending}
            slotProps={{ htmlInput: { autoCapitalize: 'none', spellCheck: false } }}
          />
          <TextField
            id="password" label="Senha" type={showPassword ? 'text' : 'password'}
            autoComplete={isRegister ? 'new-password' : 'current-password'} required fullWidth
            value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending}
            helperText={isRegister ? 'Use pelo menos 6 caracteres.' : undefined}
            slotProps={{
              htmlInput: { minLength: isRegister ? 6 : undefined },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Button type="button" size="small" className="min-h-11" disabled={pending}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </InputAdornment>
                ),
              },
            }}
          />
          {isRegister && (
            <TextField
              id="confirmation" label="Confirmar senha" type={showPassword ? 'text' : 'password'}
              autoComplete="new-password" required fullWidth disabled={pending}
              value={confirmation} onChange={(event) => {
                setConfirmation(event.target.value)
                setConfirmationError(false)
              }}
              error={confirmationError}
              helperText={confirmationError ? 'As senhas devem ser iguais.' : undefined}
            />
          )}
          <Button type="submit" variant="contained" size="large" loading={pending} fullWidth>
            {isRegister ? 'Criar conta' : 'Entrar'}
          </Button>
        </form>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1">
          <Typography variant="body2" className="text-slate-600">
            {isRegister ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
          </Typography>
          <Button component={RouterLink} to={isRegister ? '/login' : '/cadastro'} disabled={pending}
            className="min-h-11">
            {isRegister ? 'Entrar' : 'Criar conta'}
          </Button>
        </div>
      </Paper>
    </main>
  )
}
