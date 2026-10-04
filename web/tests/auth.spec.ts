import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

const password = 'Senha-teste-123!'
const authEndpoint = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:'
const firestoreEndpoint = 'http://127.0.0.1:8085/v1/projects/demo-broadcast/databases/(default)/documents'
const emails: string[] = []

const expectLocalAuth = async (page: Page) => {
  const emulator = await page.evaluate(async () => {
    const modulePath = '/src/lib/firebase.ts'
    const { auth } = await import(modulePath)
    return auth.emulatorConfig
  })
  expect(emulator, 'Os testes exigem VITE_USE_FIREBASE_EMULATORS=true.').toMatchObject({
    host: '127.0.0.1', port: 9099,
  })
}

const newEmail = () => {
  const email = `auth-${crypto.randomUUID()}@example.test`
  emails.push(email)
  return email
}

const authenticate = async (request: APIRequestContext, email: string, operation = 'signInWithPassword') => {
  const response = await request.post(`${authEndpoint}${operation}?key=emulator-test-key`, {
    data: { email, password, returnSecureToken: true },
  })
  expect(response.ok()).toBeTruthy()
  return response.json() as Promise<{ idToken: string; localId: string }>
}

const registerAccount = async (page: Page, email: string) => {
  await page.goto('/cadastro')
  await expectLocalAuth(page)
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
  await page.getByLabel(/^Senha/).fill(password)
  await page.getByLabel(/^Confirmar senha/).fill(password)
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page).toHaveURL('/conexoes')
  await expect(page.getByText(email, { exact: true })).toBeVisible()
}

const enterAccount = async (page: Page, email: string, value = password) => {
  await expectLocalAuth(page)
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
  await page.getByLabel(/^Senha/).fill(value)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

test.afterEach(async ({ request }) => {
  // Remove somente as contas que este teste criou; preserva os demais dados locais.
  for (const email of emails.splice(0)) {
    const response = await request.post(`${authEndpoint}signInWithPassword?key=emulator-test-key`, {
      data: { email, password, returnSecureToken: true },
    })
    if (response.ok()) {
      const { idToken } = await response.json()
      await request.post(`${authEndpoint}delete?key=emulator-test-key`, { data: { idToken } })
    }
  }
})

test('protege acesso direto e limpa o formulário ao alternar login e cadastro', async ({ page }) => {
  await page.goto('/conexoes')
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('heading', { name: 'Conexões', exact: true })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('rascunho@example.test')
  await page.getByLabel(/^Senha/).fill('segredo')
  await page.getByRole('link', { name: 'Criar conta' }).click()
  await expect(page.getByRole('heading', { name: 'Crie sua conta' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue('')
  await expect(page.getByLabel(/^Senha/)).toHaveValue('')
})

test('cadastro, restauração sem tela pública, saída entre abas e login com outra conta', async ({ page, context }) => {
  const emailA = newEmail()
  const emailB = newEmail()
  await registerAccount(page, emailA)

  // Detecta uma eventual aparição do formulário público durante a restauração.
  await page.addInitScript(() => {
    const headings: string[] = []
    Object.assign(window, { restoredHeadings: headings })
    new MutationObserver(() => {
      document.querySelectorAll('h1').forEach((heading) => headings.push(heading.textContent ?? ''))
    }).observe(document, { subtree: true, childList: true })
  })
  await page.reload()
  await expect(page.getByText(emailA, { exact: true })).toBeVisible()
  const headings = await page.evaluate(() =>
    (window as unknown as { restoredHeadings: string[] }).restoredHeadings)
  expect(headings).not.toContain('Entre no Broadcast')

  // Cria uma entrada privada anterior para verificar o botão Voltar após a saída.
  await page.goto('/login')
  await expect(page).toHaveURL('/conexoes')

  const secondTab = await context.newPage()
  await secondTab.goto('/login')
  await expect(secondTab).toHaveURL('/conexoes')
  await expect(secondTab.getByText(emailA, { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  for (const tab of [page, secondTab]) {
    await expect(tab).toHaveURL('/login')
    await expect(tab.getByText(emailA, { exact: true })).toHaveCount(0)
    await expect(tab.getByRole('heading', { name: 'Conexões', exact: true })).toHaveCount(0)
  }
  await page.goBack()
  await expect(page).toHaveURL('/login')
  await page.reload()
  await expect(page).toHaveURL('/login')

  await enterAccount(page, emailA)
  await expect(page).toHaveURL('/conexoes')
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page).toHaveURL('/login')
  await registerAccount(page, emailB)
  await expect(secondTab.getByText(emailB, { exact: true })).toBeVisible()
  await expect(secondTab.getByText(emailA, { exact: true })).toHaveCount(0)
})

test('informa credenciais inválidas e email duplicado sem perder valores', async ({ page, request }) => {
  const email = newEmail()
  await authenticate(request, email, 'signUp')
  await page.goto('/login')
  await enterAccount(page, email, 'senha-incorreta')
  await expect(page.getByRole('alert')).toContainText('Email ou senha incorretos')
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue(email)
  await expect(page).toHaveURL('/login')

  await page.getByRole('link', { name: 'Criar conta' }).click()
  await expect(page.getByRole('heading', { name: 'Crie sua conta' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
  await page.getByLabel(/^Senha/).fill(password)
  await page.getByLabel(/^Confirmar senha/).fill('diferente')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByText('As senhas devem ser iguais.')).toBeVisible()
  await page.getByLabel(/^Confirmar senha/).fill(password)
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Este email já está cadastrado')
})

test('falha de rede permite nova tentativa e limita a uma submissão por vez', async ({ page, request }) => {
  const email = newEmail()
  await authenticate(request, email, 'signUp')
  await page.goto('/login')
  const pattern = '**/accounts:signInWithPassword*'
  await page.route(pattern, (route) => route.abort())
  await enterAccount(page, email)
  await expect(page.getByRole('alert')).toContainText('Verifique sua conexão')
  await page.unroute(pattern)

  let release!: () => void
  const paused = new Promise<void>((resolve) => { release = resolve })
  await page.route(pattern, async (route) => {
    await paused
    await route.continue()
  })
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeDisabled()
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeDisabled()
  release()
  await expect(page).toHaveURL('/conexoes')
})

test('Firestore continua rejeitando acesso anônimo, leitura entre contas e gravação direta', async ({ request }) => {
  const accountA = await authenticate(request, newEmail(), 'signUp')
  const accountB = await authenticate(request, newEmail(), 'signUp')
  const documentUrl = `${firestoreEndpoint}/connections/auth-test-${crypto.randomUUID()}`
  // Credencial administrativa exclusiva do emulador, usada somente para a fixture.
  const seeded = await request.patch(documentUrl, {
    headers: { Authorization: 'Bearer owner' },
    data: { fields: { tenantId: { stringValue: accountA.localId }, name: { stringValue: 'Teste de acesso' } } },
  })
  expect(seeded.ok()).toBeTruthy()
  try {
    const anonymous = await request.get(documentUrl)
    expect(anonymous.status()).toBe(403)
    for (const idToken of [accountA.idToken, accountB.idToken]) {
      const headers = { Authorization: `Bearer ${idToken}` }
      const read = await request.get(documentUrl, { headers })
      expect(read.status()).toBe(403)
      const write = await request.patch(documentUrl, {
        headers, data: { fields: { tenantId: { stringValue: accountB.localId } } },
      })
      expect(write.status()).toBe(403)
    }
  } finally {
    await request.delete(documentUrl, { headers: { Authorization: 'Bearer owner' } })
  }
})
