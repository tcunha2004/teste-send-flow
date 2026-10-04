import { Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { db } from '../shared/firebase'
import { authenticatedInput, documentId, ownedDocument, textField } from '../shared/validation'

export const createConnection = onCall(async (request) => {
  const { input, tenantId } = authenticatedInput(request)
  const name = textField(input.name, 'Nome')
  const ref = db.collection('connections').doc()
  const now = Timestamp.now()
  await ref.create({ tenantId, name, createdAt: now, updatedAt: now })
  return { id: ref.id }
})

export const updateConnection = onCall(async (request) => {
  const { input, tenantId } = authenticatedInput(request)
  const id = documentId(input.id)
  const name = textField(input.name, 'Nome')
  const ref = db.collection('connections').doc(id)
  await db.runTransaction(async (transaction) => {
    const data = ownedDocument(await transaction.get(ref), tenantId)
    if (data.deleting) throw new HttpsError('failed-precondition', 'Esta conexão está sendo excluída.')
    transaction.update(ref, { name, updatedAt: Timestamp.now() })
  })
  return { id }
})

export const deleteConnection = onCall({ timeoutSeconds: 120 }, async (request) => {
  const { input, tenantId } = authenticatedInput(request)
  const id = documentId(input.id)
  const ref = db.collection('connections').doc(id)
  // The parent lock prevents new children during batched cleanup. Retrying a
  // failed deletion resumes the cleanup, including connections over 500 writes.
  await db.runTransaction(async (transaction) => {
    ownedDocument(await transaction.get(ref), tenantId)
    transaction.update(ref, { deleting: true, updatedAt: Timestamp.now() })
  })
  for (const collection of ['contacts', 'messages']) {
    let remaining = true
    while (remaining) {
      const children = await db.collection(collection)
        .where('tenantId', '==', tenantId).where('connectionId', '==', id).limit(400).get()
      remaining = children.size === 400
      if (!children.empty) {
        const batch = db.batch()
        children.docs.forEach((child) => batch.delete(child.ref))
        await batch.commit()
      }
    }
  }
  await ref.delete()
  return { success: true }
})
