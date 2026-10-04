import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, GlobalStyles } from '@mui/material'
import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import { App } from './app/App'
import './lib/firebase'
import './index.css'

const theme = createTheme({
  palette: { primary: { main: '#2563eb' } },
  typography: { fontFamily: 'system-ui, sans-serif' },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>,
)
