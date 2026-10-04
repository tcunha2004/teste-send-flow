import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  ListItemText,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link, useParams } from 'react-router-dom'
import {
  callBackend,
  getErrorMessage,
  useContacts,
  useMessages,
  type Message,
} from '../../lib/broadcast'

type MessageFilter = 'all' | 'sent' | 'scheduled'
type FieldErrors = { contacts?: string; text?: string; scheduledAt?: string }

const formatDate = (timestamp: Message['createdAt']) =>
  timestamp ? timestamp.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Aguardando registro'

const localDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const MessagesPage = () => {
  const { connectionId = '' } = useParams()
  const messages = useMessages(connectionId)
  const contacts = useContacts(connectionId)
  const [filter, setFilter] = useState<MessageFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Message | null>(null)
  const [contactIds, setContactIds] = useState<string[]>([])
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'now' | 'schedule'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [deleting, setDeleting] = useState<Message | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [notice, setNotice] = useState('')

  const openForm = (message: Message | null = null) => {
    setEditing(message)
    setText(message?.text ?? '')
    setContactIds(message?.contactIds ?? [])
    setMode(message?.status === 'scheduled' ? 'schedule' : 'now')
    setScheduledAt(message?.scheduledAt ? localDateTime(message.scheduledAt.toDate()) : '')
    setFieldErrors({})
    setFormError(null)
    setFormOpen(true)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const errors: FieldErrors = {}
    if (!contactIds.length || contactIds.length > 100) errors.contacts = 'Selecione entre 1 e 100 contatos.'
    if (!text.trim()) errors.text = 'Escreva o texto da mensagem.'
    if (text.trim().length > 5000) errors.text = 'Use até 5.000 caracteres.'
    const date = scheduledAt ? new Date(scheduledAt) : null
    if (mode === 'schedule' && (!date || !Number.isFinite(date.getTime()) || date.getTime() <= Date.now())) {
      errors.scheduledAt = 'Escolha uma data e um horário futuros.'
    }
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length) return
    setPending(true)
    try {
      const data = {
        contactIds,
        text: text.trim(),
        scheduledAt: mode === 'schedule' ? date!.toISOString() : null,
      }
      await callBackend(editing ? 'updateMessage' : 'createMessage', editing
        ? { id: editing.id, ...data }
        : { connectionId, ...data })
      setFormOpen(false)
      setNotice(editing ? 'Mensagem atualizada.' : mode === 'schedule' ? 'Mensagem agendada.' : 'Envio simulado concluído.')
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setPending(false)
    }
  }

  const remove = async () => {
    if (!deleting || deletePending) return
    setDeletePending(true)
    setDeleteError(null)
    try {
      await callBackend('deleteMessage', { id: deleting.id })
      setDeleting(null)
      setNotice('Mensagem excluída.')
    } catch (error) {
      setDeleteError(getErrorMessage(error))
    } finally {
      setDeletePending(false)
    }
  }

  const filtered = messages.data.filter((message) => filter === 'all' || message.status === filter)
  const missingRecipients = editing?.recipients.filter((recipient) => !contacts.data.some((contact) => contact.id === recipient.id)) ?? []
  const recipientOptions = [...contacts.data, ...missingRecipients]
  const selectedNames = contactIds.map((id) => recipientOptions.find((contact) => contact.id === id)?.name).filter(Boolean)

  return (
    <section className="space-y-6" aria-label="Mensagens da conexão">
      <Box className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Typography component="h2" variant="h6">Mensagens</Typography>
          <Typography variant="body2" color="text.secondary">Envio simulado. Nenhum contato receberá mensagens reais.</Typography>
        </div>
        <Button variant="contained" className="min-h-11" onClick={() => openForm()} disabled={contacts.loading || !!contacts.error || !contacts.data.length}>
          Nova mensagem
        </Button>
      </Box>
      {contacts.error && <Alert severity="error">Não foi possível carregar os contatos. {contacts.error}</Alert>}
      {!contacts.loading && !contacts.error && !contacts.data.length && (
        <Alert severity="info" action={<Button component={Link} to={`/conexoes/${connectionId}/contatos`} className="min-h-11">Cadastrar contatos</Button>}>
          Cadastre contatos nesta conexão para criar uma mensagem.
        </Alert>
      )}
      <TextField
        select
        label="Filtrar por status"
        value={filter}
        onChange={(event) => setFilter(event.target.value as MessageFilter)}
        size="small"
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="all">Todas as mensagens</MenuItem>
        <MenuItem value="sent">Enviadas</MenuItem>
        <MenuItem value="scheduled">Agendadas</MenuItem>
      </TextField>
      {messages.error && <Alert severity="error">Não foi possível carregar as mensagens. {messages.error}</Alert>}
      {messages.loading ? (
        <Box className="flex justify-center py-12"><CircularProgress aria-label="Carregando mensagens" /></Box>
      ) : !messages.error && filtered.length === 0 ? (
        <Paper elevation={0} className="rounded-2xl border border-slate-200 p-8">
          <Typography component="h3" variant="h6">{messages.data.length ? 'Nenhuma mensagem neste filtro' : 'Sua primeira mensagem começa aqui'}</Typography>
          <Typography color="text.secondary" className="mt-2">
            {messages.data.length ? 'Escolha outro status para consultar as mensagens.' : 'Selecione contatos, escreva o texto e escolha entre enviar agora ou agendar.'}
          </Typography>
          {messages.data.length > 0 && <Button onClick={() => setFilter('all')} className="mt-4 min-h-11">Mostrar todas</Button>}
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filtered.map((message) => (
            <Paper key={message.id} component="article" elevation={0} className="rounded-2xl border border-slate-200 p-6">
              <Box className="flex flex-wrap items-center justify-between gap-3">
                <Chip label={message.status === 'sent' ? 'Enviada' : 'Agendada'} color={message.status === 'sent' ? 'success' : 'info'} size="small" />
                <Typography variant="body2" color="text.secondary">
                  {message.status === 'scheduled' ? `Agendada para ${formatDate(message.scheduledAt)}` : `Envio simulado em ${formatDate(message.sentAt)}`}
                </Typography>
              </Box>
              <Typography className="mt-4 whitespace-pre-wrap break-words" sx={{ overflowWrap: 'anywhere' }}>{message.text}</Typography>
              <Typography variant="body2" color="text.secondary" className="mt-4">Destinatários ({message.recipients.length})</Typography>
              <Typography variant="body2" className="mt-1 break-words" sx={{ overflowWrap: 'anywhere' }}>
                {message.recipients.map((recipient) => `${recipient.name} (${recipient.phone})`).join(', ')}
              </Typography>
              <Box className="mt-4 flex flex-wrap gap-2">
                <Button variant="outlined" className="min-h-11" disabled={contacts.loading || !!contacts.error} onClick={() => openForm(message)}>Editar</Button>
                <Button color="error" className="min-h-11" onClick={() => { setDeleting(message); setDeleteError(null) }}>Excluir</Button>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
      <Dialog open={formOpen} onClose={() => { if (!pending) setFormOpen(false) }} fullWidth maxWidth="sm" aria-labelledby="message-form-title">
        <Box component="form" onSubmit={submit} noValidate>
          <DialogTitle id="message-form-title">{editing ? 'Editar mensagem' : 'Nova mensagem'}</DialogTitle>
          <DialogContent>
            <Stack spacing={3} className="pt-2">
              {formError && <Alert severity="error">{formError}</Alert>}
              {editing?.status === 'sent' && <Alert severity="info">Editar esta mensagem preserva o registro de envio simulado e não realiza um novo envio.</Alert>}
              {missingRecipients.length > 0 && <Alert severity="warning">Contatos excluídos do cadastro: {missingRecipients.map((recipient) => recipient.name).join(', ')}. Os destinatários registrados serão preservados enquanto permanecerem selecionados.</Alert>}
              <TextField
                select
                fullWidth
                required
                label="Destinatários"
                value={contactIds}
                onChange={(event) => { const value = event.target.value; setContactIds(typeof value === 'string' ? value.split(',') : value as string[]) }}
                error={!!fieldErrors.contacts}
                helperText={fieldErrors.contacts || `${contactIds.length}/100 contato(s) selecionado(s)`}
                disabled={pending || contacts.loading}
                slotProps={{ select: { multiple: true, renderValue: () => selectedNames.join(', ') } }}
              >
                {recipientOptions.map((contact) => (
                  <MenuItem key={contact.id} value={contact.id} disabled={!contactIds.includes(contact.id) && contactIds.length >= 100}>
                    <Checkbox checked={contactIds.includes(contact.id)} />
                    <ListItemText primary={contact.name} secondary={`${contact.phone}${missingRecipients.some((recipient) => recipient.id === contact.id) ? ' · Contato excluído' : ''}`} />
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                required
                multiline
                minRows={4}
                maxRows={12}
                label="Texto da mensagem"
                value={text}
                onChange={(event) => setText(event.target.value)}
                error={!!fieldErrors.text}
                helperText={fieldErrors.text || `${text.length.toLocaleString('pt-BR')}/5.000 caracteres`}
                slotProps={{ htmlInput: { maxLength: 5000 } }}
                disabled={pending}
              />
              {!editing && (
                <RadioGroup value={mode} onChange={(event) => setMode(event.target.value as 'now' | 'schedule')} aria-label="Quando enviar a mensagem">
                  <FormControlLabel value="now" control={<Radio disabled={pending} />} label="Enviar agora" />
                  <FormControlLabel value="schedule" control={<Radio disabled={pending} />} label="Agendar" />
                </RadioGroup>
              )}
              {mode === 'schedule' && (
                <TextField
                  fullWidth
                  required
                  type="datetime-local"
                  label="Data e horário do agendamento"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  error={!!fieldErrors.scheduledAt}
                  helperText={fieldErrors.scheduledAt || 'Horário local. O backend processa os agendamentos a cada minuto.'}
                  slotProps={{ inputLabel: { shrink: true } }}
                  disabled={pending}
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, pb: 3 }}>
            <Button onClick={() => setFormOpen(false)} disabled={pending} className="min-h-11">Cancelar</Button>
            <Button type="submit" variant="contained" loading={pending} className="min-h-11" disabled={contacts.loading || !!contacts.error}>
              {editing ? 'Salvar alterações' : mode === 'schedule' ? 'Agendar' : 'Enviar agora'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Dialog open={!!deleting} onClose={() => { if (!deletePending) setDeleting(null) }} fullWidth maxWidth="xs" aria-labelledby="delete-message-title">
        <DialogTitle id="delete-message-title">Excluir mensagem?</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" className="mb-4">{deleteError}</Alert>}
          <Typography>{deleting?.status === 'scheduled' ? 'A mensagem será excluída e seu envio agendado será cancelado.' : 'O registro desta mensagem será excluído.'}</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-3 whitespace-pre-wrap break-words" sx={{ overflowWrap: 'anywhere' }}>{deleting?.text}</Typography>
        </DialogContent>
        <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, pb: 3 }}>
          <Button onClick={() => setDeleting(null)} disabled={deletePending} className="min-h-11">Cancelar</Button>
          <Button color="error" variant="contained" onClick={remove} loading={deletePending} className="min-h-11">Excluir mensagem</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!notice} autoHideDuration={5000} onClose={() => setNotice('')}>
        <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>
      </Snackbar>
    </section>
  )
}
