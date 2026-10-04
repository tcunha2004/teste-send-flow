import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthGuard } from '../features/auth/AuthGuard'
import { AuthPage } from '../features/auth/AuthPage'
import { AuthProvider } from '../features/auth/AuthProvider'
import { ConnectionsPage } from '../features/connections/ConnectionsPage'

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
        </Route>
        <Route path="*" element={<Navigate to="/conexoes" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)
