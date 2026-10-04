import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Snackbar, TextField, Typography } from '@mui/material'
import { callBackend, getErrorMessage, useContacts } from '../../lib/broadcast'
import type { Contact } from '../../lib/broadcast'

export const ContactsPage = () => {
  const { connectionId = '' } = useParams()
  const { data: contacts, loading, error } = useContacts(connectionId)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState<Contact | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pending, setPending] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const openEditor = (contact: Contact | null = null) => {
    setEditing(contact)
    setName(contact?.name ?? '')
    setPhone(contact?.phone ?? '')
    setOperationError(null)
    setEditorOpen(true)
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    if (!name.trim() || !phone.trim()) {
      setOperationError('Informe o nome e o telefone do contato.')
      return
    }
    setPending(true)
    setOperationError(null)
    try {
      await callBackend(editing ? 'updateContact' : 'createContact', editing ? { id: editing.id, name: name.trim(), phone: phone.trim() } : { connectionId, name: name.trim(), phone: phone.trim() })
      setEditorOpen(false)
      setNotice(editing ? 'Contato atualizado.' : 'Contato cadastrado.')
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
      await callBackend('deleteContact', { id: deleting.id })
      setDeleting(null)
      setNotice('Contato excluído.')
    } catch (cause) {
      setOperationError(getErrorMessage(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <section aria-labelledby="contacts-title">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography id="contacts-title" component="h2" variant="h6">Contatos</Typography>
          <Typography variant="body2" className="mt-1 text-slate-600">{loading ? 'Carregando sua lista…' : `${contacts.length} ${contacts.length === 1 ? 'contato cadastrado' : 'contatos cadastrados'}`}</Typography>
        </div>
        <Button variant="contained" onClick={() => openEditor()} className="min-h-11">Cadastrar contato</Button>
      </div>
      {error && <Alert severity="error" className="mb-4">{error}</Alert>}
      {loading ? <div className="flex justify-center py-12"><CircularProgress aria-label="Carregando contatos" /></div> : contacts.length === 0 && !error ? (
        <Paper elevation={0} className="rounded-xl border border-slate-200 p-6">
          <Typography component="h3" variant="h6">Adicione seus destinatários</Typography>
          <Typography className="mt-2 mb-4 text-slate-600">Cadastre contatos nesta conexão para selecionar quem receberá o envio simulado.</Typography>
          <Button variant="outlined" onClick={() => openEditor()} className="min-h-11">Cadastrar contato</Button>
        </Paper>
      ) : (
        <div className="grid gap-3">
          {contacts.map((contact) => (
            <Paper key={contact.id} elevation={0} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Typography component="h3" className="break-words font-semibold">{contact.name}</Typography>
                <Typography variant="body2" className="mt-1 break-all text-slate-600">{contact.phone}</Typography>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => openEditor(contact)} className="min-h-11">Editar</Button>
                <Button color="error" onClick={() => { setOperationError(null); setDeleting(contact) }} className="min-h-11">Excluir</Button>
              </div>
            </Paper>
          ))}
        </div>
      )}
      <Dialog open={editorOpen} onClose={() => { if (!pending) setEditorOpen(false) }} fullWidth maxWidth="sm">
        <form onSubmit={save}>
          <DialogTitle>{editing ? 'Editar contato' : 'Cadastrar contato'}</DialogTitle>
          <DialogContent>
            {operationError && <Alert severity="error" className="mb-4">{operationError}</Alert>}
            <div className="flex flex-col gap-4 pt-2">
              <TextField autoFocus required fullWidth label="Nome" value={name} onChange={(event) => setName(event.target.value)} disabled={pending} slotProps={{ htmlInput: { maxLength: 100 } }} />
              <TextField required fullWidth label="Telefone" type="tel" helperText="Inclua o DDD. Exemplo: +55 11 99999-9999." value={phone} onChange={(event) => setPhone(event.target.value)} disabled={pending} slotProps={{ htmlInput: { maxLength: 30 } }} />
            </div>
          </DialogContent>
          <DialogActions className="p-4">
            <Button onClick={() => setEditorOpen(false)} disabled={pending}>Cancelar</Button>
            <Button type="submit" variant="contained" loading={pending}>{editing ? 'Salvar alterações' : 'Cadastrar contato'}</Button>
          </DialogActions>
        </form>
      </Dialog>
      <Dialog open={Boolean(deleting)} onClose={() => { if (!pending) setDeleting(null) }} fullWidth maxWidth="sm">
        <DialogTitle>Excluir contato</DialogTitle>
        <DialogContent>
          {operationError && <Alert severity="error" className="mb-4">{operationError}</Alert>}
          <Typography>Excluir “{deleting?.name}”? O histórico das mensagens já criadas será preservado.</Typography>
        </DialogContent>
        <DialogActions className="p-4">
          <Button autoFocus onClick={() => setDeleting(null)} disabled={pending}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={remove} loading={pending}>Excluir contato</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice('')} message={notice} />
    </section>
  )
}
