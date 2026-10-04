import { useEffect, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '../features/auth/useAuth'
import { db, functions } from './firebase'

type RecordDates = { createdAt: Timestamp | null; updatedAt: Timestamp | null }
export type Connection = RecordDates & { id: string; tenantId: string; name: string }
export type Contact = Connection & { connectionId: string; phone: string }
export type Message = RecordDates & {
  id: string
  tenantId: string
  connectionId: string
  contactIds: string[]
  recipients: { id: string; name: string; phone: string }[]
  text: string
  status: 'sent' | 'scheduled'
  scheduledAt: Timestamp | null
  sentAt: Timestamp | null
}

type ReadState<T> = { data: T; loading: boolean; error: string | null }

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
      case 'functions/permission-denied': return 'Você não tem acesso a estes dados.'
      case 'functions/unauthenticated': return 'Sua sessão expirou. Saia e entre novamente.'
      case 'unavailable':
      case 'functions/unavailable': return 'Não foi possível conectar ao servidor. Tente novamente.'
      case 'functions/invalid-argument':
      case 'functions/failed-precondition':
      case 'functions/not-found':
      case 'functions/resource-exhausted': return error.message
      default: return 'Não foi possível concluir a operação. Tente novamente.'
    }
  }
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export const callBackend = async (name: string, data: unknown): Promise<unknown> => {
  const result = await httpsCallable<unknown, unknown>(functions, name)(data)
  return result.data
}

const useTenantCollection = <T extends { id: string; createdAt: Timestamp | null }>(
  collectionName: string, connectionId?: string,
): ReadState<T[]> => {
  const { user } = useAuth()
  const tenantId = user?.uid
  const scope = `${tenantId ?? ''}/${collectionName}/${connectionId ?? ''}`
  const [state, setState] = useState<ReadState<T[]> & { scope: string }>({
    scope: '', data: [], loading: true, error: null,
  })

  useEffect(() => {
    if (!tenantId) return
    const filters = [where('tenantId', '==', tenantId)]
    if (connectionId !== undefined) filters.push(where('connectionId', '==', connectionId))
    return onSnapshot(query(collection(db, collectionName), ...filters), (snapshot) => {
      const data = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as T)
      data.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
      setState({ scope, data, loading: false, error: null })
    }, (error) => setState({ scope, data: [], loading: false, error: getErrorMessage(error) }))
  }, [tenantId, collectionName, connectionId, scope])

  return state.scope === scope && tenantId
    ? state : { data: [], loading: Boolean(tenantId), error: null }
}

export const useConnections = () => useTenantCollection<Connection>('connections')
export const useContacts = (connectionId: string) => useTenantCollection<Contact>('contacts', connectionId)
export const useMessages = (connectionId: string) => useTenantCollection<Message>('messages', connectionId)

export const useConnection = (id: string): ReadState<Connection | null> => {
  const { user } = useAuth()
  const tenantId = user?.uid
  const scope = `${tenantId ?? ''}/${id}`
  const [state, setState] = useState<ReadState<Connection | null> & { scope: string }>({
    scope: '', data: null, loading: true, error: null,
  })
  useEffect(() => {
    if (!tenantId || !id) return
    return onSnapshot(doc(db, 'connections', id), (snapshot) => {
      const data = snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as Connection : null
      setState({ scope, data, loading: false, error: null })
    }, (error) => setState({ scope, data: null, loading: false, error: getErrorMessage(error) }))
  }, [tenantId, id, scope])
  return state.scope === scope && tenantId
    ? state : { data: null, loading: Boolean(tenantId && id), error: null }
}
