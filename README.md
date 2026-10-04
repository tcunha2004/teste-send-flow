# Broadcast

Aplicação de broadcast com React, TypeScript, Vite, Material UI, Tailwind CSS e Firebase. Envio exclusivamente simulado, sem integração com SMS ou WhatsApp.

Implementados: autenticação, CRUD de conexões e contatos, seleção de destinatários, envio imediato, agendamento, filtros e edição/exclusão de mensagens. As listas atualizam em tempo real e cada conta acessa apenas seus dados. As etapas 1–9 foram verificadas localmente. A publicação e a execução automática na nuvem estão pendentes.

Referências: [escopo](./PROJECT.md), [arquitetura](./ARCHITECTURE.md), [etapas](./STEPS.md) e [design system](./web/DESIGN.md).

## Instalar e configurar

Requisitos: Node.js 22, npm e Java 21 para o emulador do Firestore.

```bash
npm install
cp web/.env.example web/.env.local
```

Preencha `web/.env.local` com a configuração Web do Firebase. Nesta máquina, o arquivo já está preenchido para `teste-send-flow`. Os arquivos `.env` ficam fora do Git e não devem conter credenciais administrativas no frontend.

Para desenvolvimento, mantenha `VITE_USE_FIREBASE_EMULATORS=true`. Os serviços usam `demo-broadcast`, sem alterar os dados da nuvem. Reinicie o Vite ao alterar variáveis.

No macOS, `brew install openjdk@21` instala o Java; o script detecta a instalação Homebrew. Em outros sistemas, configure `JAVA_HOME` ou `java` no PATH.

## Executar localmente

Em dois terminais na raiz:

```bash
npm run emulators
```

```bash
npm run dev
```

Aplicação: http://127.0.0.1:5180. Painel dos emuladores: http://127.0.0.1:4000. Portas: Auth 9099, Firestore 8085 e Functions 5001. O primeiro início baixa os emuladores. Encerre com Ctrl+C.

Para preservar dados locais:

```bash
npm run emulators -- --import=.emulator-data --export-on-exit=.emulator-data
```

Para recompilar Functions durante desenvolvimento:

```bash
npm run watch --workspace functions
```

## Fluxo de uso

1. Crie uma conta em `/cadastro` ou entre em `/login`.
2. Crie uma conexão e abra sua lista de contatos.
3. Cadastre contatos com nome e telefone.
4. Abra a aba **Mensagens**, selecione destinatários e escreva o texto.
5. Escolha **Enviar agora** ou **Agendar**, informando um horário futuro local.
6. Consulte os status **Enviada** e **Agendada** e use os filtros, edição ou exclusão.

O SDK mantém a sessão e sincroniza entrada/saída entre abas. Excluir uma conexão também remove seus contatos e mensagens. Excluir um contato preserva o histórico de destinatários nas mensagens. Editar uma enviada não simula um novo envio.

## Verificações essenciais

Com os emuladores ativos:

```bash
npm run test:smoke
npm run typecheck
npm run lint
npm run build:production
```

O smoke testa CRUD, duas contas, isolamento de leitura/mutações, bloqueio de gravações diretas, relações entre contatos e conexões, validação de mensagens, histórico, cascata e processamento de agendadas com idempotência. O relógio é controlado nesse teste; ele usa apenas `demo-broadcast` e remove suas fixtures. Uma rejeição PERMISSION_DENIED no log é esperada na tentativa de escrita proibida.

Para o navegador, instale Chromium uma vez e execute:

```bash
npx playwright install chromium
npm run test:e2e
```

São seis testes: cinco de autenticação/segurança e um fluxo completo de conexão, contato e mensagens. O Playwright inicia o Vite quando necessário. `npm run test:auth` executa somente os cinco testes de autenticação.

Typecheck, lint, smoke, seis testes de navegador e build de produção passaram. As telas foram inspecionadas em desktop e celular. O build ainda informa um bundle acima de 500 kB; isso não impede a execução.

## Publicar e obter o link

A publicação completa exige **plano Blaze com faturamento habilitado**: Cloud Functions e Cloud Scheduler não estão disponíveis neste fluxo no Spark. Blaze cobra por uso e possui cotas gratuitas; não há garantia de custo zero. Consulte os [preços oficiais](https://firebase.google.com/pricing).

No [console do projeto](https://console.firebase.google.com/project/teste-send-flow/overview):

1. Habilite Blaze e vincule a conta de faturamento.
2. Em Authentication → Sign-in method, habilite **Email/Password**.
3. Crie o banco **Cloud Firestore**, no modo nativo e com regras de produção. O deploy publicará as regras próprias.
4. Confira a configuração Web em `web/.env.local` para o projeto `teste-send-flow`.

Na raiz:

```bash
npm run firebase -- login
npm run deploy
```

`npm run deploy` gera o frontend com `VITE_USE_FIREBASE_EMULATORS=false` e publica regras, índices, Functions e Hosting. Não precisa alterar a configuração local usada no desenvolvimento. A CLI pode solicitar confirmação da retenção de imagens de Functions; configure a retenção indicada no prompt. Os índices podem levar alguns minutos para ficar prontos após o primeiro deploy.

O comando imprime a **Hosting URL**: esse é o link para entregar. Para o site padrão do projeto, a URL esperada é `https://teste-send-flow.web.app`; só considere o link válido após o deploy e a verificação.

Depois da publicação, faça cadastro, crie conexão/contato, envie uma mensagem e agende outra. Feche a aplicação, aguarde o horário e a próxima execução bem-sucedida da rotina, então confirme o status **Enviada**. A função executa a cada minuto; não promete precisão no segundo exato.

Caso os índices ainda estejam criando, aguarde antes de repetir as consultas. Firebase Hosting já está configurado com rewrite das rotas para `index.html`.

## Organização e decisões

```text
web/src/app/          Rotas e providers
web/src/features/     Autenticação, conexões, contatos e mensagens
web/src/lib/          Firebase, tipos, chamadas e hooks de leitura
web/src/components/   Header compartilhado
functions/src/        CRUD, validações e processamento de agendadas
scripts/              Emuladores e smoke local
```

O projeto usa npm workspaces e um único lockfile. A lógica é funcional, com componentes e hooks, sem classes próprias. Firestore usa somente coleções na raiz (`connections`, `contacts`, `messages`). Todas as alterações passam por Functions; o tenant é obtido do token, não do formulário. Transações tratam concorrência e evitam recriar mensagens excluídas. A exclusão de conexão bloqueia novos filhos e limpa dados em lotes.

Limites do teste: nomes de até 100 caracteres, telefones com 6 a 20 dígitos, até 100 destinatários e texto de até 5.000 caracteres. O processador trata até 300 agendadas por execução; o restante fica para a próxima rodada.

Não foi realizada publicação nesta sessão. O agendamento foi verificado pela lógica de backend local; sua execução automática na nuvem é a verificação final pendente da etapa 10.
