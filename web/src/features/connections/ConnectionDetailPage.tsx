import { Link, Outlet, useLocation, useParams } from 'react-router-dom'
import { Alert, Button, CircularProgress, Tab, Tabs, Typography } from '@mui/material'
import { AppHeader } from '../../components/AppHeader'
import { useConnection } from '../../lib/broadcast'

export const ConnectionDetailPage = () => {
  const { connectionId = '' } = useParams()
  const { data: connection, loading, error } = useConnection(connectionId)
  const location = useLocation()
  const base = `/conexoes/${connectionId}`
  const activeTab = location.pathname.endsWith('/mensagens') ? 'messages' : 'contacts'

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <AppHeader />
        <Button component={Link} to="/conexoes" className="mt-5 min-h-11">Todas as conexões</Button>
        {loading ? <div className="flex justify-center py-16"><CircularProgress aria-label="Carregando conexão" /></div> : error ? <Alert severity="error" className="mt-4">{error}</Alert> : !connection ? (
          <Alert severity="warning" className="mt-4">Esta conexão não está disponível. Volte à lista para escolher outra.</Alert>
        ) : (
          <>
            <Typography component="h1" variant="h4" className="mt-3 mb-4 break-words font-semibold">{connection.name}</Typography>
            <Tabs value={activeTab} aria-label="Áreas da conexão" className="mb-6 border-b border-slate-200">
              <Tab value="contacts" label="Contatos" component={Link} to={base} />
              <Tab value="messages" label="Mensagens" component={Link} to={`${base}/mensagens`} />
            </Tabs>
            <Outlet key={connectionId} />
          </>
        )}
      </div>
    </main>
  )
}
