# Broadcast

Aplicação de broadcast com React, TypeScript e Firebase. O envio será simulado. As etapas 1 e 2 estão implementadas: estrutura, emuladores e autenticação com email e senha. Os demais fluxos serão implementados conforme o roteiro.

Referências: [escopo](./PROJECT.md), [arquitetura](./ARCHITECTURE.md) e [etapas](./STEPS.md).

Para criar interfaces, siga o [design system global](./web/DESIGN.md), com a direção visual aprovada e os padrões de componentes e estados para as próximas telas.

## Requisitos

- Node.js 22 e npm;
- Java 21 para o emulador do Firestore.

No macOS com Homebrew, instale Java com `brew install openjdk@21`. O comando de emuladores detecta essa instalação automaticamente. Em outros sistemas, configure `JAVA_HOME` ou disponibilize `java` no `PATH`.

A Firebase CLI é uma dependência do projeto; não precisa ser instalada globalmente.

## Configuração

Na raiz, instale as dependências de `/web` e `/functions`:

```bash
npm install
```

Copie `web/.env.example` para `web/.env.local` e preencha os campos com a configuração da aplicação Web do Firebase:

```bash
cp web/.env.example web/.env.local
```

O `.env.local` desta máquina já foi preenchido a partir do `.env` original, que foi preservado. Os arquivos com valores locais são ignorados pelo Git.

Mantenha `VITE_USE_FIREBASE_EMULATORS=true` para desenvolver localmente. Nesse modo, frontend e emuladores usam o projeto `demo-broadcast`, com dados separados do projeto na nuvem. Reinicie o Vite após alterar o `.env.local`.

## Executar localmente

No primeiro terminal, na raiz:

```bash
npm run emulators
```

No segundo terminal, também na raiz:

```bash
npm run dev
```

- Aplicação: http://127.0.0.1:5180
- Painel dos emuladores: http://127.0.0.1:4000
- Authentication: porta 9099;
- Firestore: porta 8085;
- Functions: porta 5001.

O primeiro início baixa os emuladores e precisa de internet. Não é necessário fazer login na Firebase CLI para usar o projeto de demonstração. Encerre os processos com `Ctrl+C`.

As portas 5180 e 8085 foram escolhidas porque as portas padrão já estavam ocupadas nesta máquina. Se precisar alterá-las, ajuste `web/vite.config.ts` para o frontend e mantenha as portas do Firebase iguais em `firebase.json` e `web/src/lib/firebase.ts`.

Os dados locais são descartados ao encerrar os emuladores. Para reutilizá-los:

```bash
npm run emulators -- --import=.emulator-data --export-on-exit=.emulator-data
```

Esse comando cria o diretório na primeira saída e carrega os dados nas próximas execuções.

O comando de emuladores compila as Functions antes de iniciar. Para recompilar automaticamente durante alterações no backend, abra outro terminal e execute:

```bash
npm run watch --workspace functions
```

## Verificações

### Autenticação

Abra `/cadastro` para criar uma conta ou `/login` para entrar. A sessão persiste após recarregar a página; `/conexoes` exige autenticação e oferece a ação **Sair**. Login e saída são sincronizados entre abas do mesmo navegador. O gerenciamento de conexões será implementado na etapa 4.

Para executar os cinco testes de integração de autenticação, mantenha os emuladores de Authentication e Firestore ativos com `npm run emulators` e `VITE_USE_FIREBASE_EMULATORS=true` no frontend. Na primeira execução, instale o navegador de testes:

```bash
npx playwright install chromium
npm run test:auth
```

O Playwright inicia o Vite automaticamente quando necessário. Os testes usam Chromium, criam contas e um documento temporário no projeto `demo-broadcast`, e removem somente as fixtures criadas. Verificam cadastro, login, restauração, rotas protegidas, saída entre abas, troca de contas, validação, erros de rede e rejeição de acesso direto ao Firestore. Como as regras ainda bloqueiam tudo, a leitura do próprio cliente também deve ser rejeitada nesta etapa.

### Build e qualidade

```bash
npm run typecheck
npm run lint
npm run build
```

Uma função callable `health` permite verificar o backend local sem acessar dados de clientes:

```bash
curl -X POST \
  http://127.0.0.1:5001/demo-broadcast/us-central1/health \
  -H 'Content-Type: application/json' \
  -d '{"data":{}}'
```

O resultado esperado é `{"result":{"status":"ok"}}`.

As regras do Firestore começam com todo acesso do frontend bloqueado. As permissões de leitura por cliente serão implementadas na etapa de segurança.

Na preparação inicial, build, checagem de tipos e lint passaram. Foram verificadas a inicialização dos emuladores, a chamada `health`, a criação de uma conta local e a rejeição de leitura pública no Firestore.

Na etapa 2, os cinco testes de autenticação, build, checagem de tipos e lint passaram. Login, cadastro e a tela privada foram inspecionados em desktop e celular. O build ainda informa um bundle acima de 500 kB; a divisão de código pode ser revisada quando as demais telas forem implementadas.

O `npm audit` ainda aponta alertas em dependências transitivas dos SDKs e da CLI Firebase. O `npm audit fix` sem mudanças incompatíveis foi executado; não aplicamos `--force`, que propõe trocar versões principais dos pacotes. Essa revisão deve ser retomada antes da publicação.

## Estrutura

```text
web/          Frontend e inicialização do SDK Firebase
functions/    Cloud Functions e inicialização do Admin SDK
scripts/      Inicialização local dos emuladores
```

O npm organiza `web` e `functions` como workspaces: cada parte tem suas dependências, com um único `package-lock.json` na raiz.

## Projeto na nuvem

O projeto real está associado em `.firebaserc`. Não foi feita nenhuma publicação nesta etapa.

Para trabalhar com a nuvem, será necessário autenticar a CLI (`npm run firebase -- login`) e, para publicar Functions, habilitar o plano Blaze. As Functions usam inicialmente a região `us-central1`, também configurada no frontend.

Na etapa de publicação, configuraremos o frontend com `VITE_USE_FIREBASE_EMULATORS=false`, publicaremos regras, índices e Functions e validaremos o agendamento na nuvem. O build gera `web/dist`, configurado para Firebase Hosting.

Documentação: [emuladores Firebase](https://firebase.google.com/docs/emulator-suite), [Functions](https://firebase.google.com/docs/functions/get-started), [Vite](https://vite.dev/guide/), [Tailwind](https://tailwindcss.com/docs/installation/using-vite) e [integração com Material UI](https://mui.com/material-ui/integrations/tailwindcss/tailwindcss-v4/).
