import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGuard } from '../features/auth/AuthGuard'
import { AuthPage } from '../features/auth/AuthPage'
import { AuthProvider } from '../features/auth/AuthProvider'
import { ConnectionsPage } from '../features/connections/ConnectionsPage'
import { ConnectionDetailPage } from '../features/connections/ConnectionDetailPage'
import { ContactsPage } from '../features/contacts/ContactsPage'
import { MessagesPage } from '../features/messages/MessagesPage'

export const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<AuthGuard requireUser={false} />}>
          <Route path="/login" element={<AuthPage key="login" mode="login" />} />
          <Route path="/cadastro" element={<AuthPage key="register" mode="register" />} />
        </Route>
        <Route element={<AuthGuard requireUser />}>
          <Route path="/conexoes" element={<ConnectionsPage />} />
          <Route path="/conexoes/:connectionId" element={<ConnectionDetailPage />}>
            <Route index element={<ContactsPage />} />
            <Route path="contatos" element={<ContactsPage />} />
            <Route path="mensagens" element={<MessagesPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/conexoes" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)
