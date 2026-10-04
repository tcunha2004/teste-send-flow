# Arquitetura do projeto

Este documento explica como construiremos a aplicação descrita no [PROJECT.md](./PROJECT.md). É uma proposta inicial para orientar a implementação, não uma descrição de código já pronto.

## 1. Visão geral

O Firebase é uma plataforma com vários serviços. Usaremos três deles:

| Parte | Responsabilidade |
| --- | --- |
| React no navegador | Mostrar telas, receber informações e apresentar resultados |
| Firebase Authentication | Criar contas e verificar quem está conectado |
| Cloud Firestore | Guardar conexões, contatos e mensagens |
| Cloud Functions | Executar nosso código de backend nos servidores do Google |

O frontend usa o **SDK do Firebase**, uma biblioteca com funções prontas para conversar com esses serviços.

```text
Navegador (React)
  ├── cadastro e login ──────→ Firebase Authentication
  ├── leitura em tempo real → Firestore → regras verificam o acesso
  └── criar/editar/excluir ─→ Cloud Functions → validam e gravam no Firestore

Cloud Scheduler (relógio na nuvem)
  └── executa periodicamente → Cloud Function → atualiza mensagens vencidas
```

**Decisão do projeto:** ler diretamente do Firestore e realizar todas as alterações por Cloud Functions. Assim, as regras de negócio e as validações das alterações ficam concentradas no backend.

Não precisaremos criar um servidor Express separado. As Cloud Functions serão nosso backend.

## 2. Cadastro e login: o que acontece?

Usaremos email e senha.

### Cadastro

1. O usuário preenche email e senha no React.
2. Chamamos `createUserWithEmailAndPassword` pelo SDK.
3. O Firebase Authentication cria a conta e já autentica o usuário.
4. O SDK retorna um objeto `UserCredential`, que contém `user`.

### Login

1. O usuário preenche email e senha.
2. Chamamos `signInWithEmailAndPassword`.
3. O Firebase verifica as credenciais.
4. Se estiverem corretas, recebemos um `UserCredential` com o usuário autenticado. Se falhar, recebemos um erro para apresentar na tela.

O objeto `user` contém informações como `uid` (identificador único) e `email`. Não contém a senha. **O `uid` será o `tenantId` dos dados desse cliente.** Não criaremos uma cópia da senha no Firestore.

Referência: [autenticação com email e senha](https://firebase.google.com/docs/auth/web/password-auth).

### E o token?

Além dos dados do usuário, o SDK gerencia as credenciais da sessão. O **ID token** é uma credencial assinada que comprova a identidade do usuário nas requisições. Quando necessário, podemos obtê-lo com `user.getIdToken()`.

O SDK cuida da renovação do token. Para acessar o Firestore e chamar funções pelo SDK, não precisaremos montar manualmente um cabeçalho de autorização.

O `uid` identifica a pessoa; o token comprova sua identidade. Enviar apenas um `uid` não é suficiente para autenticar uma requisição.

Referências: [interface User](https://firebase.google.com/docs/reference/js/auth.user) e [chamada de funções autenticadas](https://firebase.google.com/docs/functions/callable).

## 3. Onde guardaremos a sessão? Usaremos cookie?

**Não criaremos cookies de sessão próprios.** Usaremos a persistência local gerenciada pelo SDK do Firebase Authentication, configurada com `browserLocalPersistence`.

O SDK mantém a sessão no armazenamento do navegador. Isso permite continuar conectado depois de atualizar a página ou fechar e abrir o navegador, enquanto a sessão continuar válida. Não salvaremos tokens manualmente em `localStorage`.

No React, um `AuthProvider` usará `onAuthStateChanged` para acompanhar o usuário conectado e disponibilizar `user` e `loading` às telas. Esse estado fica em memória; a restauração da sessão é responsabilidade do SDK.

Implementado na etapa 2: a instância de Authentication é criada com `initializeAuth` e `browserLocalPersistence` em `web/src/lib/firebase.ts`, antes de conectar o emulador. O provider aguarda `authStateReady` e acompanha a sessão com `onAuthStateChanged`, cancelando o listener ao desmontar. O React Router oferece `/login`, `/cadastro` e a rota privada `/conexoes`. Os guards aguardam a sessão inicial antes de renderizar ou redirecionar. A árvore privada é desmontada na saída e recriada por `uid` na troca de conta, descartando o estado local do cliente anterior. As futuras assinaturas de dados deverão cancelar seus listeners ao desmontar, conforme a seção 5.

Ao abrir a aplicação, aguardaremos a verificação inicial antes de decidir se mostramos login ou telas internas. Ao sair, chamaremos `signOut` e limparemos os dados exibidos.

Referências: [persistência da autenticação](https://firebase.google.com/docs/auth/web/auth-state-persistence) e [acompanhamento do usuário](https://firebase.google.com/docs/auth/web/manage-users).

## 4. Onde ficam os dados? Teremos banco local?

**O único banco da aplicação será o Cloud Firestore.** Não usaremos PostgreSQL, SQLite ou outro banco adicional.

O Firestore é um banco de documentos: cada documento contém campos, e documentos são agrupados em coleções. Podemos pensar em coleções como grupos de registros, embora não sejam tabelas SQL.

Teremos três coleções na raiz, sem subcoleções:

```text
connections/{id} → tenantId, name, createdAt, updatedAt
contacts/{id}    → tenantId, connectionId, name, phone, createdAt, updatedAt
messages/{id}    → tenantId, connectionId, contactIds, recipients,
                   text, status, scheduledAt, sentAt, createdAt, updatedAt
```

`recipients` guardará uma cópia dos nomes e telefones dos destinatários selecionados. Isso preserva o histórico mesmo se um contato for excluído depois. É um campo dentro da mensagem, não uma subcoleção.

Exemplo: um contato com `tenantId: "ana123"` e `connectionId: "loja456"` pertence à cliente Ana e à conexão Loja. Os identificadores fazem a ligação entre os documentos; o backend verifica se essa ligação é válida.

O React manterá em memória as listas recebidas e os formulários em edição. Isso é estado da interface, não outro banco. Não habilitaremos cache persistente do Firestore para uso offline nesta primeira versão.

Referência: [modelo de dados do Firestore](https://firebase.google.com/docs/firestore/data-model).

## 5. Como as listas atualizam em tempo real?

Usaremos `onSnapshot`: o frontend assina uma consulta, recebe os dados iniciais e depois recebe as alterações.

Exemplo: a tela de mensagens assina uma consulta com o `tenantId` do usuário e o `connectionId` selecionado. Quando o backend muda uma mensagem para **Enviada**, o Firestore avisa o navegador e o React atualiza a lista.

Não precisaremos de um botão para atualizar nem de consultar o banco a cada poucos segundos. Ao sair da tela ou trocar de usuário, cancelaremos as assinaturas e limparemos as listas anteriores.

Algumas consultas precisarão de índices, que ficarão registrados em `firestore.indexes.json`. Um índice ajuda o banco a localizar os documentos de uma consulta.

Referência: [atualizações em tempo real](https://firebase.google.com/docs/firestore/query-data/listen).

## 6. Como impediremos acesso a dados de outro cliente?

Teremos duas barreiras complementares:

| Caminho de acesso | Proteção |
| --- | --- |
| React lê o Firestore | As regras permitem leitura apenas quando o usuário está autenticado e o `tenantId` do documento corresponde ao seu `uid` |
| React tenta gravar diretamente no Firestore | As regras bloqueiam; as alterações devem passar pelas Functions |
| React chama uma Cloud Function | A função exige autenticação, valida os campos e verifica o dono dos documentos envolvidos |

Nas consultas do frontend, sempre incluiremos `tenantId == user.uid`. **As regras não filtram resultados automaticamente:** uma consulta que possa retornar dados de outro cliente é rejeitada.

Nas Functions, obteremos o cliente de `request.auth.uid`, e não de um `tenantId` enviado pelo formulário. Também verificaremos se a conexão e os contatos pertencem ao mesmo cliente e se os contatos pertencem à conexão escolhida.

As Functions usam o **Admin SDK**, uma biblioteca com acesso administrativo ao Firestore. Esse acesso não passa pelas regras do banco; por isso, a validação dentro das funções é obrigatória.

Referências: [regras e consultas](https://firebase.google.com/docs/firestore/security/rules-query) e [segurança do Firestore](https://firebase.google.com/docs/firestore/security/overview).

## 7. Como funcionam as Cloud Functions?

São funções que escreveremos em TypeScript na pasta `/functions` e publicaremos no Firebase. Em produção, executam na infraestrutura do Google; nosso computador pode estar desligado.

Usaremos dois tipos:

### Funções chamadas pelo frontend

Usaremos funções **callable** (`onCall` no backend e `httpsCallable` no frontend). São chamadas pela rede, mas o SDK organiza a requisição, a resposta e o envio do token de autenticação.

Exemplo ao criar um contato:

1. O React chama `createContact` com nome, telefone e identificador da conexão.
2. A função verifica se existe usuário autenticado e se a conexão pertence a ele.
3. Valida os campos e grava o documento com o `tenantId` obtido da autenticação.
4. Retorna o identificador criado ou um erro.
5. A assinatura em tempo real recebe o novo contato e atualiza a lista.

Teremos operações equivalentes para criar, editar e excluir conexões, contatos e mensagens. Excluir uma conexão também exigirá a limpeza dos seus contatos e mensagens no backend; o Firestore não faz essa exclusão automaticamente.

Referência: [funções callable](https://firebase.google.com/docs/functions/callable).

### Função executada pelo relógio

Uma função com `onSchedule` será acionada pelo Cloud Scheduler, por exemplo a cada minuto. Ela não precisa de um usuário conectado: é uma rotina interna autorizada da aplicação.

Referência: [funções agendadas](https://firebase.google.com/docs/functions/schedule-functions).

## 8. Fluxo de envio e agendamento

### Enviar agora

O React envia texto, conexão e contatos para uma função. Ela valida os dados e cria a mensagem com `status: "sent"` e `sentAt` usando o horário do backend. Isso representa o envio simulado.

### Agendar

O React envia os mesmos dados e o horário escolhido. A função verifica se o horário está no futuro e cria a mensagem com `status: "scheduled"`, `scheduledAt` preenchido e `sentAt: null`.

As datas serão armazenadas como timestamps, que representam um instante. A tela apresenta esse instante no horário local do usuário.

### Quando o horário chega

1. A rotina periódica procura mensagens com `status == "scheduled"` e `scheduledAt <= agora`.
2. Para cada candidata, usa uma transação para conferir novamente seu status e horário antes de atualizar.
3. Se ainda estiver vencida e agendada, altera para `sent` e registra `sentAt`.
4. A tela recebe a mudança em tempo real quando estiver aberta.

Uma **transação** permite verificar e alterar dados de forma consistente, inclusive quando duas operações acontecem juntas. Usaremos esse mecanismo para lidar com execução repetida e conflitos entre agendamento, edição e exclusão. Uma mensagem excluída não deve ser recriada pelo processador.

O Firestore não muda o status sozinho só porque a data passou. Essa lógica é nossa. Com a rotina a cada minuto, a alteração acontece na próxima execução bem-sucedida após o horário; não prometemos precisão no segundo exato.

Referências: [agendamento](https://firebase.google.com/docs/functions/schedule-functions) e [transações](https://firebase.google.com/docs/firestore/manage-data/transactions).

## 9. Como organizaremos o código?

```text
/
├── PROJECT.md
├── ARCHITECTURE.md
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── web/
│   └── src/
│       ├── app/          # Rotas e providers da aplicação
│       ├── lib/          # Inicialização do Firebase e conexão com emuladores
│       ├── features/
│       │   ├── auth/     # Telas, provider e funções de autenticação
│       │   ├── connections/
│       │   ├── contacts/
│       │   └── messages/
│       └── components/   # Componentes visuais reutilizáveis
└── functions/
    └── src/
        ├── index.ts      # Exporta as Cloud Functions
        ├── connections/  # Operações de conexões
        ├── contacts/     # Operações de contatos
        ├── messages/     # Operações de mensagens e rotina de envio
        └── shared/       # Inicialização do Admin SDK e validações comuns
```

Dentro de cada funcionalidade do frontend, manteremos suas telas, tipos, hooks de leitura e funções que chamam o backend. As telas não precisam conhecer todos os detalhes do Firebase.

Usaremos npm workspaces para instalar as dependências das duas pastas com um comando na raiz e manter um único arquivo de lock. Os comandos estão no [README.md](./README.md).

Usaremos funções comuns, componentes funcionais e hooks. Material UI fornecerá os componentes, e Tailwind ajudará no layout e na estilização.

## 10. Desenvolvimento local e publicação

Durante o desenvolvimento, usaremos o **Firebase Emulator Suite** para executar versões locais de Authentication, Firestore e Functions. O React continuará sendo executado pelo Vite.

Esses emuladores substituem os serviços da nuvem durante os testes; não são um segundo banco que precisa ser sincronizado. Configuraremos a aplicação e as Functions para usar o mesmo projeto de emulação. Podemos exportar e importar os dados de teste para reutilizá-los.

Na configuração inicial, os emuladores e o frontend usam `demo-broadcast`. O projeto real fica associado em `.firebaserc`, e seus campos de configuração ficam em `web/.env.local`. A opção `VITE_USE_FIREBASE_EMULATORS=true` mantém o desenvolvimento local; as Functions e o SDK do frontend usam inicialmente a região `us-central1`.

Testaremos o processamento de mensagens localmente invocando sua lógica de forma controlada. A execução periódica automática pelo Cloud Scheduler deverá ser verificada também no ambiente publicado.

Para publicar, criaremos um projeto Firebase, habilitaremos login com email e senha, criaremos o Firestore e publicaremos regras, índices e Functions. O frontend pode ser publicado no Firebase Hosting.

O frontend terá variáveis `VITE_FIREBASE_*` para identificar o projeto. Elas ficam visíveis no navegador e não substituem as regras de segurança. Credenciais administrativas pertencem ao backend e nunca devem entrar no código do frontend.

A publicação das Cloud Functions exige o plano **Blaze**, com faturamento habilitado. Functions e agendamento podem gerar custos; os emuladores permitem desenvolver localmente antes da publicação.

Referências: [Emulator Suite](https://firebase.google.com/docs/emulator-suite), [publicação de Functions](https://firebase.google.com/docs/functions/get-started) e [configuração do Firebase](https://firebase.google.com/docs/projects/learn-more#config-files-objects).

## 11. Como verificar se a arquitetura funciona?

- Entrar, atualizar a página e confirmar que a sessão é restaurada;
- Sair e confirmar que telas e listas privadas são limpas;
- Usar duas contas e verificar que nenhuma consegue ler ou alterar dados da outra, inclusive tentando acesso direto;
- Tentar associar contatos de outra conexão a uma mensagem e confirmar a rejeição;
- Agendar uma mensagem, fechar a aplicação e conferir depois que o backend mudou seu status;
- Verificar que editar ou excluir uma mensagem não permite que uma execução concorrente use dados antigos;
- Abrir duas abas e observar as alterações chegando em tempo real.

O [PROJECT.md](./PROJECT.md) define o que devemos entregar. Este arquivo define como as partes vão conversar para cumprir esses requisitos.

## 12. Implementação e verificação local

As operações callable de conexões, contatos e mensagens estão implementadas. O backend valida autenticação, propriedade, relações, nomes de até 100 caracteres, telefones com 6 a 20 dígitos, até 100 destinatários e mensagens de até 5.000 caracteres. A criação e alteração de filhos conferem a conexão em transações.

A exclusão de conexão registra `deleting: true` em uma transação, bloqueando novos filhos, e limpa contatos e mensagens em lotes de até 400 documentos antes de remover a conexão. Uma tentativa interrompida pode ser repetida para concluir a limpeza. O processador também confere que a conexão ainda existe e não está sendo excluída.

`processScheduledMessages` executa a cada minuto e chama `processDueMessages`, que processa até 300 mensagens por execução com transações. A lógica aceita um timestamp controlado nos testes locais; não há endpoint público de processamento administrativo. Mensagens enviadas conservam seu status e horário de envio ao editar. Destinatários já registrados podem ser mantidos quando o contato foi excluído.

As regras permitem apenas leituras do próprio tenant e bloqueiam todas as gravações diretas. As consultas incluem o uid, filtram a conexão quando aplicável, cancelam listeners ao desmontar e descartam resultados antigos na troca do contexto. O teste essencial de backend e o fluxo de navegador passaram; a publicação e a rotina automática na nuvem ainda precisam ser verificadas.
