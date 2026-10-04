import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
}

export const AuthContext = createContext<AuthState | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
