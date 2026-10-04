import { getApp, getApps, initializeApp } from 'firebase/app'
import { browserLocalPersistence, connectAuthEmulator, getAuth, initializeAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'

const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS !== 'false'

const requiredEnv = (key: keyof ImportMetaEnv): string => {
  const value = import.meta.env[key]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Configure ${key} em web/.env.local antes de iniciar.`)
  }
  return value
}

// Reutiliza a instância durante atualizações do Vite para não reconectar emuladores.
const initialized = getApps().length > 0
const app = initialized ? getApp() : initializeApp({
  apiKey: requiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: useEmulators ? 'demo-broadcast' : requiredEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: requiredEnv('VITE_FIREBASE_APP_ID'),
})

// Define a persistência desde a criação para manter a sessão sincronizada entre abas.
export const auth = initialized ? getAuth(app) : initializeAuth(app, {
  persistence: browserLocalPersistence,
})
export const db = getFirestore(app)
export const functions = getFunctions(app, 'us-central1')

if (useEmulators && !initialized) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8085)
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}
