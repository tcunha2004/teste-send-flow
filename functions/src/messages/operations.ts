import { Timestamp, type Transaction } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { db } from '../shared/firebase'
import { activeConnection, authenticatedInput, documentId, futureTimestamp, ownedDocument, recipientIds, textField } from '../shared/validation'

type Recipient = { id: string; name: string; phone: string }

async function getRecipients(transaction: Transaction, ids: string[], tenantId: string, connectionId: string, previous: Recipient[] = []) {
  const snapshots = await transaction.getAll(...ids.map((id) => db.collection('contacts').doc(id)))
  return snapshots.map((snapshot): Recipient => {
    // Preserve the recorded recipient when an existing message is edited after
    // deleting that contact. New recipients must always exist in this connection.
    const recorded = previous.find((recipient) => recipient.id === snapshot.id)
    if (!snapshot.exists && recorded) return recorded
    const contact = ownedDocument(snapshot, tenantId)
    if (contact.connectionId !== connectionId) {
      throw new HttpsError('invalid-argument', 'Todos os contatos devem pertencer à conexão selecionada.')
    }
    return { id: snapshot.id, name: contact.name, phone: contact.phone }
  })
}

export const createMessage = onCall(async (request) => {
  const { input, tenantId } = authenticatedInput(request)
  const connectionId = documentId(input.connectionId)
  const contactIds = recipientIds(input.contactIds)
  const text = textField(input.text, 'Mensagem', 5000)
  const scheduledAt = futureTimestamp(input.scheduledAt)
  const ref = db.collection('messages').doc()
  await db.runTransaction(async (transaction) => {
    const connectionRef = await activeConnection(transaction, connectionId, tenantId)
    const recipients = await getRecipients(transaction, contactIds, tenantId, connectionId)
    const now = Timestamp.now()
    if (scheduledAt && scheduledAt.toMillis() <= now.toMillis()) {
      throw new HttpsError('invalid-argument', 'O agendamento deve estar no futuro.')
    }
    transaction.create(ref, {
      tenantId, connectionId, contactIds, recipients, text,
      status: scheduledAt ? 'scheduled' : 'sent', scheduledAt,
      sentAt: scheduledAt ? null : now, createdAt: now, updatedAt: now,
    })
    transaction.update(connectionRef, { updatedAt: now })
  })
  return { id: ref.id }
})

export const updateMessage = onCall(async (request) => {
  const { input, tenantId } = authenticatedInput(request)
  const id = documentId(input.id)
  const contactIds = recipientIds(input.contactIds)
  const text = textField(input.text, 'Mensagem', 5000)
  const ref = db.collection('messages').doc(id)
  await db.runTransaction(async (transaction) => {
    const previous = ownedDocument(await transaction.get(ref), tenantId)
    await activeConnection(transaction, previous.connectionId, tenantId)
    const recipients = await getRecipients(transaction, contactIds, tenantId, previous.connectionId, previous.recipients)
    const scheduledAt = previous.status === 'scheduled'
      ? futureTimestamp(input.scheduledAt, true) : previous.scheduledAt
    transaction.update(ref, { contactIds, recipients, text, scheduledAt, updatedAt: Timestamp.now() })
  })
  return { id }
})

export const deleteMessage = onCall(async (request) => {
  const { input, tenantId } = authenticatedInput(request)
  const id = documentId(input.id)
  const ref = db.collection('messages').doc(id)
  await db.runTransaction(async (transaction) => {
    const data = ownedDocument(await transaction.get(ref), tenantId)
    await activeConnection(transaction, data.connectionId, tenantId)
    transaction.delete(ref)
  })
  return { success: true }
})
