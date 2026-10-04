import { Timestamp, type DocumentSnapshot, type Transaction } from 'firebase-admin/firestore'
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https'
import { db } from './firebase'

export type Input = Record<string, unknown>

export function authenticatedInput(request: CallableRequest<unknown>) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Entre na sua conta para continuar.')
  if (!request.data || typeof request.data !== 'object' || Array.isArray(request.data)) {
    throw new HttpsError('invalid-argument', 'Dados inválidos.')
  }
  return { tenantId: request.auth.uid, input: request.data as Input }
}

export function textField(value: unknown, label: string, max = 100): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new HttpsError('invalid-argument', `${label} deve ter entre 1 e ${max} caracteres.`)
  }
  return value.trim()
}

export function documentId(value: unknown): string {
  const id = textField(value, 'Identificador', 128)
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new HttpsError('invalid-argument', 'Identificador inválido.')
  return id
}

export function phoneField(value: unknown): string {
  const phone = textField(value, 'Telefone', 40)
  const digits = phone.replace(/\D/g, '')
  if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 6 || digits.length > 20) {
    throw new HttpsError('invalid-argument', 'Informe um telefone válido com 6 a 20 dígitos.')
  }
  return phone
}

export function recipientIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) {
    throw new HttpsError('invalid-argument', 'Selecione entre 1 e 100 contatos.')
  }
  const ids = value.map(documentId)
  if (new Set(ids).size !== ids.length) throw new HttpsError('invalid-argument', 'Há contatos repetidos.')
  return ids
}

export function futureTimestamp(value: unknown, required = false): Timestamp | null {
  if (value === null || value === undefined) {
    if (required) throw new HttpsError('invalid-argument', 'Informe uma data futura para o agendamento.')
    return null
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    throw new HttpsError('invalid-argument', 'Data de agendamento inválida.')
  }
  const milliseconds = Date.parse(value)
  if (!Number.isFinite(milliseconds) || milliseconds <= Date.now()) {
    throw new HttpsError('invalid-argument', 'O agendamento deve estar no futuro.')
  }
  return Timestamp.fromMillis(milliseconds)
}

export function ownedDocument(snapshot: DocumentSnapshot, tenantId: string) {
  if (!snapshot.exists || snapshot.get('tenantId') !== tenantId) {
    throw new HttpsError('not-found', 'Registro não encontrado.')
  }
  return snapshot.data()!
}

export async function activeConnection(transaction: Transaction, connectionId: string, tenantId: string) {
  const ref = db.collection('connections').doc(connectionId)
  const data = ownedDocument(await transaction.get(ref), tenantId)
  if (data.deleting === true) throw new HttpsError('failed-precondition', 'Esta conexão está sendo excluída.')
  return ref
}
