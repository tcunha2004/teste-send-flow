import { Timestamp } from 'firebase-admin/firestore'
import { onCall } from 'firebase-functions/v2/https'
import { db } from '../shared/firebase'
import { activeConnection, authenticatedInput, documentId, ownedDocument, phoneField, textField } from '../shared/validation'

export const createContact = onCall(async (request) => {
  const { input, tenantId } = authenticatedInput(request)
  const connectionId = documentId(input.connectionId)
  const name = textField(input.name, 'Nome')
  const phone = phoneField(input.phone)
  const ref = db.collection('contacts').doc()
  await db.runTransaction(async (transaction) => {
    const connectionRef = await activeConnection(transaction, connectionId, tenantId)
    const now = Timestamp.now()
    transaction.create(ref, { tenantId, connectionId, name, phone, createdAt: now, updatedAt: now })
    transaction.update(connectionRef, { updatedAt: now })
  })
  return { id: ref.id }
})

export const updateContact = onCall(async (request) => {
  const { input, tenantId } = authenticatedInput(request)
  const id = documentId(input.id)
  const name = textField(input.name, 'Nome')
  const phone = phoneField(input.phone)
  const ref = db.collection('contacts').doc(id)
  await db.runTransaction(async (transaction) => {
    const data = ownedDocument(await transaction.get(ref), tenantId)
    await activeConnection(transaction, data.connectionId, tenantId)
    transaction.update(ref, { name, phone, updatedAt: Timestamp.now() })
  })
  return { id }
})

export const deleteContact = onCall(async (request) => {
  const { input, tenantId } = authenticatedInput(request)
  const id = documentId(input.id)
  const ref = db.collection('contacts').doc(id)
  await db.runTransaction(async (transaction) => {
    const data = ownedDocument(await transaction.get(ref), tenantId)
    await activeConnection(transaction, data.connectionId, tenantId)
    transaction.delete(ref)
  })
  return { success: true }
})
