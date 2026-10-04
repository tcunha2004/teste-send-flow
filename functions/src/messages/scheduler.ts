import { Timestamp } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { db } from '../shared/firebase'

// Exported separately so the emulator can exercise scheduling without a browser
// or a public endpoint that would expose administrative processing.
export async function processDueMessages(now = Timestamp.now()): Promise<number> {
  const candidates = await db.collection('messages')
    .where('status', '==', 'scheduled').where('scheduledAt', '<=', now)
    .orderBy('scheduledAt').limit(300).get()
  let processed = 0
  // Small batches limit concurrent Firestore transactions while retaining enough
  // throughput for this technical exercise. Remaining messages run next minute.
  for (let offset = 0; offset < candidates.size; offset += 20) {
    const results = await Promise.all(candidates.docs.slice(offset, offset + 20).map((candidate) =>
      db.runTransaction(async (transaction) => {
        const current = await transaction.get(candidate.ref)
        if (!current.exists || current.get('status') !== 'scheduled') return false
        const scheduledAt = current.get('scheduledAt') as Timestamp | null
        if (!scheduledAt || scheduledAt.toMillis() > now.toMillis()) return false
        const connection = await transaction.get(db.collection('connections').doc(current.get('connectionId')))
        if (!connection.exists || connection.get('deleting') || connection.get('tenantId') !== current.get('tenantId')) return false
        transaction.update(candidate.ref, { status: 'sent', sentAt: now, updatedAt: now })
        return true
      }),
    ))
    processed += results.filter(Boolean).length
  }
  return processed
}

export const processScheduledMessages = onSchedule({ schedule: 'every 1 minutes', timeZone: 'UTC', maxInstances: 1 }, async () => {
  await processDueMessages()
})
