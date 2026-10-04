import { setGlobalOptions } from 'firebase-functions/v2'
import { onCall } from 'firebase-functions/v2/https'
import './shared/firebase'

setGlobalOptions({ region: 'us-central1', maxInstances: 5 })

// Verifica a infraestrutura sem ler ou alterar dados de clientes.
export const health = onCall(() => ({ status: 'ok' }))
