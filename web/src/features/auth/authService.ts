import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../../lib/firebase'

export const register = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email.trim(), password)

export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password)

export const logout = () => signOut(auth)

export const getAuthErrorMessage = (error: unknown): string => {
  if (!(error instanceof FirebaseError)) {
    return 'Não foi possível concluir a operação. Tente novamente.'
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Informe um email válido.'
    case 'auth/email-already-in-use':
      return 'Este email já está cadastrado. Entre com sua conta.'
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'A senha não atende aos requisitos. Use pelo menos 6 caracteres.'
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email ou senha incorretos. Confira os dados e tente novamente.'
    case 'auth/user-disabled':
      return 'Esta conta está desativada.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
    case 'auth/network-request-failed':
      return 'Não foi possível conectar. Verifique sua conexão e tente novamente.'
    default:
      return 'Não foi possível concluir a operação. Tente novamente.'
  }
}
