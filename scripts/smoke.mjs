import assert from 'node:assert/strict'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, collection, query, where, getDocs, terminate } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions'
import { Timestamp } from 'firebase-admin/firestore'

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8085'
process.env.GCLOUD_PROJECT = 'demo-broadcast'
const { processDueMessages } = await import('../functions/lib/messages/scheduler.js')
const apps = []
const connections = []
const createClient = async (suffix, authenticated = true) => {
  const app = initializeApp({ projectId: 'demo-broadcast', apiKey: 'emulator-test-key', appId: 'demo' }, suffix)
  const auth = getAuth(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  const db = getFirestore(app)
  connectFirestoreEmulator(db, '127.0.0.1', 8085)
  const functions = getFunctions(app, 'us-central1')
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
  const call = async (name, data) => (await httpsCallable(functions, name)(data)).data
  const client = { app, auth, db, call }
  apps.push(client)
  if (authenticated) await createUserWithEmailAndPassword(auth, `smoke-${crypto.randomUUID()}@example.test`, 'Smoke-senha-123!')
  return client
}
const rejected = async (operation, codes) => assert.rejects(operation, (error) => codes.includes(error.code))

try {
  const a = await createClient('smoke-a')
  const b = await createClient('smoke-b')
  const anonymous = await createClient('smoke-anonymous', false)
  await rejected(() => anonymous.call('createConnection', { name: 'Bloqueada' }), ['functions/unauthenticated'])
  const createConnection = async (client, name) => {
    const { id } = await client.call('createConnection', { name })
    connections.push({ client, id })
    return id
  }
  const first = await createConnection(a, 'Conexão A')
  const second = await createConnection(a, 'Conexão alternativa A')
  const foreign = await createConnection(b, 'Conexão B')
  await a.call('updateConnection', { id: first, name: 'Conexão editada' })
  assert.equal((await getDoc(doc(a.db, 'connections', first))).data().name, 'Conexão editada')
  await rejected(() => getDoc(doc(b.db, 'connections', first)), ['permission-denied'])
  await rejected(() => getDoc(doc(anonymous.db, 'connections', first)), ['permission-denied'])
  await rejected(() => getDocs(collection(a.db, 'connections')), ['permission-denied'])
  await rejected(() => setDoc(doc(a.db, 'connections', first), { tenantId: a.auth.currentUser.uid }), ['permission-denied'])
  await rejected(() => b.call('updateConnection', { id: first, name: 'Intrusão' }), ['functions/not-found', 'functions/permission-denied'])
  await rejected(() => b.call('createContact', { connectionId: first, name: 'Intrusão', phone: '11999999999' }), ['functions/not-found', 'functions/permission-denied'])
  const contact = (await a.call('createContact', { connectionId: first, name: 'Ana', phone: '11999999999' })).id
  const other = (await a.call('createContact', { connectionId: second, name: 'Outra', phone: '11888888888' })).id
  const foreignContact = (await b.call('createContact', { connectionId: foreign, name: 'Bruno', phone: '11777777777' })).id
  await a.call('updateContact', { id: contact, name: 'Ana editada', phone: '11666666666' })
  const contacts = await getDocs(query(collection(a.db, 'contacts'), where('tenantId', '==', a.auth.currentUser.uid), where('connectionId', '==', first)))
  assert.deepEqual(contacts.docs.map((d) => d.id), [contact])
  const base = { connectionId: first, contactIds: [contact], text: 'Envio simulado', scheduledAt: null }
  for (const contactIds of [[], [other], [foreignContact]]) {
    await rejected(() => a.call('createMessage', { ...base, contactIds }), ['functions/invalid-argument', 'functions/not-found', 'functions/permission-denied'])
  }
  await rejected(() => a.call('createMessage', { ...base, text: ' ' }), ['functions/invalid-argument'])
  await rejected(() => a.call('createMessage', { ...base, scheduledAt: new Date(Date.now() - 1000).toISOString() }), ['functions/invalid-argument'])
  const sent = (await a.call('createMessage', base)).id
  const original = (await getDoc(doc(a.db, 'messages', sent))).data()
  assert.equal(original.status, 'sent')
  assert.equal(original.recipients[0].name, 'Ana editada')
  await a.call('updateMessage', { id: sent, contactIds: [contact], text: 'Texto editado', scheduledAt: null })
  assert.equal((await getDoc(doc(a.db, 'messages', sent))).data().sentAt.toMillis(), original.sentAt.toMillis())
  const scheduled = (await a.call('createMessage', { ...base, scheduledAt: new Date(Date.now() + 60_000).toISOString() })).id
  await a.call('updateMessage', { id: scheduled, contactIds: [contact], text: 'Agendada editada', scheduledAt: new Date(Date.now() + 120_000).toISOString() })
  const deleted = (await a.call('createMessage', { ...base, scheduledAt: new Date(Date.now() + 60_000).toISOString() })).id
  await a.call('deleteMessage', { id: deleted })
  assert.equal(await processDueMessages(Timestamp.fromMillis(Date.now() + 180_000)), 1)
  assert.equal(await processDueMessages(Timestamp.fromMillis(Date.now() + 180_000)), 0)
  assert.equal((await getDoc(doc(a.db, 'messages', scheduled))).data().status, 'sent')
  const afterProcessing = await getDocs(query(collection(a.db, 'messages'), where('tenantId', '==', a.auth.currentUser.uid)))
  assert.equal(afterProcessing.docs.some((item) => item.id === deleted), false)
  await a.call('deleteContact', { id: contact })
  assert.equal((await getDoc(doc(a.db, 'messages', sent))).data().recipients[0].phone, '11666666666')
  await a.call('updateMessage', { id: sent, contactIds: [contact], text: 'Histórico preservado', scheduledAt: null })
  await a.call('createContact', { connectionId: first, name: 'Contato para cascata', phone: '11555555555' })
  await a.call('deleteConnection', { id: first })
  const remaining = await getDocs(query(collection(a.db, 'messages'), where('tenantId', '==', a.auth.currentUser.uid), where('connectionId', '==', first)))
  assert.equal(remaining.empty, true)
  const remainingContacts = await getDocs(query(collection(a.db, 'contacts'), where('tenantId', '==', a.auth.currentUser.uid), where('connectionId', '==', first)))
  assert.equal(remainingContacts.empty, true)
  assert.equal((await getDoc(doc(b.db, 'connections', foreign))).exists(), true)
  console.log('OK: CRUD, isolamento entre contas, validações, histórico, agendamento, idempotência e cascata.')
} finally {
  for (const { client, id } of connections) {
    await client.call('deleteConnection', { id }).catch(() => {})
  }
  for (const client of apps) {
    if (client.auth.currentUser) await deleteUser(client.auth.currentUser).catch(() => {})
    await terminate(client.db)
    await deleteApp(client.app)
  }
  const { getApps: getAdminApps, deleteApp: deleteAdminApp } = await import('firebase-admin/app')
  await Promise.all(getAdminApps().map(deleteAdminApp))
}
