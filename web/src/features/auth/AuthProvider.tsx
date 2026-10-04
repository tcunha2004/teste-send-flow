import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { AuthContext } from './useAuth'
import type { AuthState } from './useAuth'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null })

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    const fail = () => {
      if (active) {
        setState({
          user: null,
          loading: false,
          error: 'Não foi possível restaurar sua sessão. Recarregue a página para tentar novamente.',
        })
      }
    }

    void auth.authStateReady().then(() => {
      if (!active) return
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setState({ user, loading: false, error: null })
      }, fail)
    }).catch(fail)

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}
