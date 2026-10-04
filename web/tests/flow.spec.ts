import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

test('conexão, contato, envio imediato, agendamento, filtros e edição pelo navegador', async ({ page, request }) => {
  test.setTimeout(60_000)
  const email = `flow-${crypto.randomUUID()}@example.test`
  const password = 'Teste-flow-123!'
  let connectionId = ''
  const base = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:'
  const capture = async (name: string) => {
    await mkdir('../.impeccable/review', { recursive: true })
    await page.locator('.MuiSnackbar-root').waitFor({ state: 'hidden', timeout: 6000 })
    for (const [device, width, height] of [['desktop', 1280, 900], ['mobile', 375, 812]] as const) {
      await page.setViewportSize({ width, height })
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: `../.impeccable/review/${device}-${name}.png`, fullPage: true })
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    }
    await page.setViewportSize({ width: 1280, height: 900 })
  }
  try {
    await page.goto('/cadastro')
    const emulator = await page.evaluate(async () => {
      const modulePath = '/src/lib/firebase.ts'
      return (await import(modulePath)).auth.emulatorConfig
    })
    expect(emulator).toMatchObject({ host: '127.0.0.1', port: 9099 })
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
    await page.getByLabel(/^Senha/).fill(password)
    await page.getByLabel(/^Confirmar senha/).fill(password)
    await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
    await expect(page).toHaveURL('/conexoes')
    await page.getByRole('button', { name: 'Criar conexão', exact: true }).first().click()
    await page.getByRole('textbox', { name: /^Nome da conexão/ }).fill('Clientes de teste')
    await page.getByRole('dialog').getByRole('button', { name: 'Criar conexão', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Clientes de teste', exact: true })).toBeVisible()
    await capture('connections')
    await page.getByRole('link', { name: 'Clientes de teste', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Clientes de teste' })).toBeVisible()
    connectionId = new URL(page.url()).pathname.split('/')[2]!
    await page.getByRole('button', { name: 'Cadastrar contato', exact: true }).first().click()
    await page.getByRole('textbox', { name: /^Nome/ }).fill('Ana teste')
    await page.getByRole('textbox', { name: /^Telefone/ }).fill('11999999999')
    await page.getByRole('dialog').getByRole('button', { name: 'Cadastrar contato', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Ana teste' })).toBeVisible()
    await capture('contacts')
    await page.getByRole('tab', { name: 'Mensagens', exact: true }).click()
    const compose = async (text: string) => {
      await page.getByRole('button', { name: 'Nova mensagem', exact: true }).click()
      await page.getByRole('combobox', { name: /^Destinatários/ }).click()
      await page.getByRole('option').filter({ hasText: 'Ana teste' }).click()
      await page.keyboard.press('Escape')
      await page.getByRole('textbox', { name: /^Texto da mensagem/ }).fill(text)
    }
    await compose('Olá, envio simulado de teste.')
    await page.getByRole('button', { name: 'Enviar agora', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('article').filter({ hasText: 'Olá, envio simulado de teste.' })).toContainText('Enviada')
    await compose('Mensagem para depois.')
    await page.getByRole('radio', { name: 'Agendar', exact: true }).check()
    const future = new Date(Date.now() + 600_000)
    const pad = (value: number) => String(value).padStart(2, '0')
    const local = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`
    await page.getByLabel(/^Data e horário do agendamento/).fill(local)
    await page.getByRole('button', { name: 'Agendar', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('article').filter({ hasText: 'Mensagem para depois.' })).toContainText('Agendada')
    await capture('messages')
    await page.getByRole('combobox', { name: 'Filtrar por status' }).click()
    await page.getByRole('option', { name: 'Agendadas', exact: true }).click()
    await expect(page.locator('article')).toHaveCount(1)
    await page.locator('article').getByRole('button', { name: 'Editar', exact: true }).click()
    await page.getByRole('textbox', { name: /^Texto da mensagem/ }).fill('Agendada editada.')
    await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('article')).toContainText('Agendada editada.')
    await page.locator('article').getByRole('button', { name: 'Excluir', exact: true }).click()
    await page.getByRole('button', { name: 'Excluir mensagem', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('article')).toHaveCount(0)
  } finally {
    const response = await request.post(`${base}signInWithPassword?key=emulator-test-key`, { data: { email, password, returnSecureToken: true } })
    if (response.ok()) {
      const { idToken } = await response.json()
      if (connectionId) await request.post('http://127.0.0.1:5001/demo-broadcast/us-central1/deleteConnection', {
        headers: { Authorization: `Bearer ${idToken}` }, data: { data: { id: connectionId } },
      })
      await request.post(`${base}delete?key=emulator-test-key`, { data: { idToken } })
    }
  }
})
