import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Snackbar, TextField, Typography } from '@mui/material'
import { AppHeader } from '../../components/AppHeader'
import { callBackend, getErrorMessage, useConnections } from '../../lib/broadcast'
import type { Connection } from '../../lib/broadcast'

export const ConnectionsPage = () => {
  const { data: connections, loading, error } = useConnections()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Connection | null>(null)
  const [deleting, setDeleting] = useState<Connection | null>(null)
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const openEditor = (connection: Connection | null = null) => {
    setEditing(connection)
    setName(connection?.name ?? '')
    setOperationError(null)
    setEditorOpen(true)
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    if (!name.trim()) {
      setOperationError('Informe o nome da conexão.')
      return
    }
    setPending(true)
    setOperationError(null)
    try {
      await callBackend(editing ? 'updateConnection' : 'createConnection', editing ? { id: editing.id, name: name.trim() } : { name: name.trim() })
      setEditorOpen(false)
      setNotice(editing ? 'Conexão atualizada.' : 'Conexão criada.')
    } catch (cause) {
      setOperationError(getErrorMessage(cause))
    } finally {
      setPending(false)
    }
  }

  const remove = async () => {
    if (!deleting || pending) return
    setPending(true)
    setOperationError(null)
    try {
      await callBackend('deleteConnection', { id: deleting.id })
      setDeleting(null)
      setNotice('Conexão excluída.')
    } catch (cause) {
      setOperationError(getErrorMessage(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <AppHeader />
        <div className="mt-8 mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Typography component="h1" variant="h4" className="font-semibold">Conexões</Typography>
            <Typography className="mt-2 text-slate-600">Organize seus contatos e mensagens em cada conexão.</Typography>
          </div>
          <Button variant="contained" onClick={() => openEditor()} className="min-h-11">Criar conexão</Button>
        </div>
        {error && <Alert severity="error" className="mb-4">{error}</Alert>}
        {loading ? <div className="flex justify-center py-16"><CircularProgress aria-label="Carregando conexões" /></div> : connections.length === 0 && !error ? (
          <Paper elevation={0} className="rounded-2xl border border-slate-200 p-6 sm:p-8">
            <Typography component="h2" variant="h6">Sua primeira conexão</Typography>
            <Typography className="mt-2 mb-5 text-slate-600">Crie uma conexão para cadastrar contatos e preparar um broadcast.</Typography>
            <Button variant="outlined" onClick={() => openEditor()} className="min-h-11">Criar conexão</Button>
          </Paper>
        ) : (
          <div className="grid gap-4">
            {connections.map((connection) => (
              <Paper key={connection.id} elevation={0} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-5">
                <Typography component={Link} to={`/conexoes/${connection.id}`} variant="h6" className="min-w-0 flex-1 break-words text-blue-600 no-underline hover:underline">{connection.name}</Typography>
                <div className="flex flex-wrap gap-2">
                  <Button component={Link} to={`/conexoes/${connection.id}`} variant="outlined" className="min-h-11">Abrir</Button>
                  <Button onClick={() => openEditor(connection)} className="min-h-11">Editar</Button>
                  <Button color="error" onClick={() => { setOperationError(null); setDeleting(connection) }} className="min-h-11">Excluir</Button>
                </div>
              </Paper>
            ))}
          </div>
        )}
      </div>
      <Dialog open={editorOpen} onClose={() => { if (!pending) setEditorOpen(false) }} fullWidth maxWidth="sm">
        <form onSubmit={save}>
          <DialogTitle>{editing ? 'Editar conexão' : 'Criar conexão'}</DialogTitle>
          <DialogContent>
            {operationError && <Alert severity="error" className="mb-4">{operationError}</Alert>}
            <TextField autoFocus required fullWidth margin="dense" label="Nome da conexão" value={name} onChange={(event) => setName(event.target.value)} disabled={pending} slotProps={{ htmlInput: { maxLength: 100 } }} />
          </DialogContent>
          <DialogActions className="p-4">
            <Button onClick={() => setEditorOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="submit" variant="contained" loading={pending}>{editing ? 'Salvar alterações' : 'Criar conexão'}</Button>
          </DialogActions>
        </form>
      </Dialog>
      <Dialog open={Boolean(deleting)} onClose={() => { if (!pending) setDeleting(null) }} fullWidth maxWidth="sm">
        <DialogTitle>Excluir conexão</DialogTitle>
        <DialogContent>
          {operationError && <Alert severity="error" className="mb-4">{operationError}</Alert>}
          <Typography>Excluir “{deleting?.name}”? Todos os contatos e mensagens desta conexão também serão excluídos. Esta ação não pode ser desfeita.</Typography>
        </DialogContent>
        <DialogActions className="p-4">
          <Button autoFocus onClick={() => setDeleting(null)} disabled={pending}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={remove} loading={pending}>Excluir conexão</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice('')} message={notice} />
    </main>
  )
}
