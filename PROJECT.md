# Projeto: aplicação de Broadcast

Este documento explica o teste técnico em linguagem simples e serve como referência durante o desenvolvimento.

## 1. O que vamos construir?

Uma aplicação em que uma pessoa cria uma conta, organiza listas de contatos e prepara mensagens para esses contatos.

**Broadcast significa enviar a mesma mensagem para várias pessoas.** Neste teste, o envio será apenas uma simulação: ninguém receberá SMS, WhatsApp ou qualquer outra mensagem de verdade.

O sistema deve permitir enviar uma mensagem na hora ou programá-la para depois. Quando chegar o horário de uma mensagem programada, o backend deverá mudar seu status automaticamente, mesmo que o usuário esteja com o navegador fechado.

## 2. Entendendo as partes do sistema

### Cliente

É o usuário que criou uma conta na aplicação. Cada conta representa um cliente independente.

O cliente pode fazer cadastro, entrar e acessar apenas seus próprios dados.

### Conexão

É um agrupamento com um nome, que possui seus próprios contatos e mensagens.

Para entender o teste, podemos pensar nela como uma lista ou um canal de organização. Por exemplo: uma conexão chamada **Clientes da loja** e outra chamada **Equipe interna**.

O enunciado exige apenas o nome da conexão. Não precisamos conectá-la a um serviço externo ou a uma conta de WhatsApp.

### Contato

É uma pessoa cadastrada dentro de uma conexão. Possui:

- Nome;
- Telefone.

Cada conexão tem sua própria lista de contatos.

### Mensagem

É um texto criado dentro de uma conexão e destinado a um ou mais contatos dessa mesma conexão.

Uma mensagem pode ter um dos dois status exigidos:

- **Agendada:** está aguardando a data e o horário definidos;
- **Enviada:** o envio já foi simulado.

## 3. Exemplo de uso

1. Ana cria uma conta e entra na aplicação.
2. Ana cria uma conexão chamada **Clientes da loja**.
3. Dentro dessa conexão, cadastra João e Maria, com seus telefones.
4. Ana seleciona João e Maria e escreve: “Olá! Hoje temos uma promoção.”
5. Se escolher **Enviar agora**, a mensagem fica com status **Enviada**.
6. Se escolher **Agendar**, informa uma data e um horário futuros, e a mensagem fica com status **Agendada**.
7. Quando o horário chegar, uma Cloud Function muda a mensagem para **Enviada**.
8. Ana pode consultar as mensagens e filtrar por status.

Se Bruno criar outra conta, ele terá suas próprias conexões, contatos e mensagens. Ele não poderá acessar os dados de Ana.

## 4. O que cada tela precisa permitir?

### Cadastro e login

- Criar uma conta usando Firebase Authentication;
- Entrar com uma conta existente;
- Sair da conta;
- Restringir o acesso às telas internas a usuários autenticados.

### Conexões

- Listar as conexões do cliente;
- Criar uma conexão;
- Editar seu nome;
- Excluir uma conexão;
- Abrir uma conexão para acessar seus contatos e mensagens.

### Contatos de uma conexão

- Listar os contatos da conexão selecionada;
- Cadastrar nome e telefone;
- Editar nome e telefone;
- Excluir um contato.

### Broadcast de uma conexão

- Selecionar um ou mais contatos;
- Escrever uma mensagem;
- Simular o envio imediato;
- Agendar o envio para uma data e um horário futuros;
- Listar as mensagens criadas;
- Filtrar mensagens enviadas e agendadas;
- Editar e excluir mensagens.

**CRUD** é apenas uma abreviação das quatro operações básicas: criar, consultar, editar e excluir.

## 5. Como os dados se relacionam?

```text
Cliente (conta do usuário)
  → possui conexões
    → cada conexão possui contatos
    → cada conexão possui mensagens
      → cada mensagem seleciona contatos daquela conexão
```

Essa árvore mostra a relação entre os dados. **Ela não representa subcoleções no Firestore**, pois o teste proíbe subcoleções.

### Modelagem inicial proposta

Usaremos coleções independentes na raiz do Firestore. Os documentos se relacionam por identificadores.

| Coleção | Campos principais | Finalidade |
| --- | --- | --- |
| `connections` | `id`, `tenantId`, `name`, `createdAt`, `updatedAt` | Conexões de cada cliente |
| `contacts` | `id`, `tenantId`, `connectionId`, `name`, `phone`, `createdAt`, `updatedAt` | Contatos de cada conexão |
| `messages` | `id`, `tenantId`, `connectionId`, `contactIds`, `text`, `status`, `scheduledAt`, `sentAt`, `createdAt`, `updatedAt` | Mensagens e seus destinatários |

- `id`: identificador do documento, que pode ser obtido do próprio Firestore;
- `tenantId`: identificador do cliente, usando o `uid` do Firebase Authentication;
- `connectionId`: identifica a conexão à qual o contato ou a mensagem pertence;
- `contactIds`: identificadores dos contatos selecionados;
- `status`: no código, podemos usar `scheduled` e `sent`; na interface, **Agendada** e **Enviada**;
- `scheduledAt`: momento programado para o envio, quando houver agendamento;
- `sentAt`: momento em que o envio foi simulado;
- `createdAt` e `updatedAt`: momentos de criação e última alteração.

Não precisamos de uma coleção de clientes apenas para autenticar: a conta já existe no Firebase Authentication. Uma coleção de perfis só será necessária se decidirmos guardar informações adicionais.

## 6. O que significa SaaS multi-tenant?

Significa que vários clientes usam a mesma aplicação, mas cada cliente tem um espaço de dados separado.

Neste projeto, **um usuário autenticado equivale a um cliente (tenant)**. Não há exigência de empresas com vários usuários, equipes ou convites.

O isolamento deve existir em duas camadas:

1. **Consultas:** o frontend busca apenas documentos cujo `tenantId` corresponde ao usuário conectado. Dentro de uma conexão, também filtra pelo `connectionId`.
2. **Segurança:** as regras do Firestore verificam quem está autenticado e impedem leitura ou alteração de dados de outro cliente.

Esconder dados na interface não é suficiente. Mesmo que alguém tente acessar o Firebase diretamente, as regras devem bloquear o acesso indevido.

Também precisamos impedir que um cliente altere o dono de um documento ou associe seus dados a uma conexão de outro cliente. Operações feitas por Cloud Functions devem validar a autorização e os relacionamentos, pois o acesso administrativo do backend não é limitado pelas regras do Firestore.

## 7. Como funciona o agendamento?

Fluxo proposto:

1. O usuário escolhe os contatos, escreve o texto e informa uma data e um horário futuros.
2. O backend valida e salva a mensagem com status `scheduled` e o campo `scheduledAt`.
3. Uma Cloud Function executada periodicamente procura mensagens agendadas cujo horário já chegou.
4. A função altera essas mensagens para `sent` e registra `sentAt`.
5. A interface recebe a atualização pelo Firestore em tempo real.

Essa função deve executar no backend, sem depender de uma tela aberta ou de um temporizador no navegador.

Uma execução periódica, por exemplo a cada minuto, é uma estratégia inicial simples. Nesse caso, a mudança de status ocorre na próxima execução após o horário programado, e não necessariamente no segundo exato. A configuração e os requisitos de execução no Firebase serão verificados na implementação.

O backend também deverá evitar processar novamente uma mensagem já enviada e tratar conflitos com edição ou exclusão.

## 8. Tecnologias obrigatórias e seus papéis

| Tecnologia | Para que será usada |
| --- | --- |
| React | Construir as telas e interações |
| TypeScript | Definir tipos e ajudar a detectar erros no código |
| Vite | Criar, executar e gerar a versão final do frontend |
| Material UI | Fornecer componentes como botões, campos, tabelas e janelas de confirmação |
| Tailwind CSS | Estilizar espaçamentos, layout e outros aspectos visuais |
| Firebase Authentication | Gerenciar cadastro e login |
| Firestore | Armazenar dados e acompanhar alterações em tempo real |
| Firebase Cloud Functions | Executar a lógica de backend, especialmente a mudança automática de status |

O código da aplicação seguirá o **paradigma funcional**: funções, componentes funcionais e hooks, sem criar classes para organizar a lógica do projeto.

### Direção visual aprovada

A aplicação seguirá uma interface clara e funcional: azul como destaque, fundos claros, tipografia do sistema, componentes Material UI e profundidade discreta. O [design system](./web/DESIGN.md) registra os padrões globais de cores, tipografia, espaçamento, componentes, responsividade e estados. Ele orienta as próximas telas; documentar um padrão não significa que já foi implementado ou verificado.

## 9. Organização inicial do projeto

```text
/
├── PROJECT.md       # Referência do escopo e das decisões
├── functions/       # Backend com Firebase Cloud Functions
├── web/             # Frontend com React, TypeScript e Vite
├── firestore.rules  # Regras de acesso aos dados
├── firestore.indexes.json # Índices necessários para as consultas
└── firebase.json    # Configuração do projeto Firebase
```

Dentro do frontend, separaremos configuração do Firebase, telas, componentes, hooks, tipos e funções de acesso aos dados. No backend, separaremos validações e operações de mensagens da rotina de agendamento.

As listagens de conexões, contatos e mensagens deverão acompanhar as alterações em tempo real sempre que aplicável.

## 10. Decisões que o enunciado não detalha

As escolhas abaixo são propostas iniciais, e não exigências adicionais do teste:

- Usar email e senha para cadastro e login;
- Tratar **Enviada** como o registro de uma simulação concluída, sem confirmação de entrega;
- Permitir editar texto e destinatários de uma mensagem enviada, sem simular um novo envio automaticamente;
- Permitir alterar texto, destinatários e horário de uma mensagem agendada, mantendo o novo horário no futuro;
- Ao excluir uma conexão, excluir também seus contatos e mensagens por uma operação de backend;
- Preservar um registro dos destinatários na mensagem, como nome e telefone no momento da criação, para que a exclusão de um contato não apague o histórico da mensagem;
- Guardar datas como timestamps e apresentá-las no horário local do usuário.

Essas decisões poderão ser ajustadas durante o desenvolvimento, mantendo este documento atualizado.

## 11. O que não faz parte do teste?

- Enviar mensagens reais;
- Integrar com WhatsApp, SMS ou email;
- Implementar pagamentos ou planos de assinatura;
- Criar um produto completo pronto para produção;
- Implementar equipes, permissões complexas ou vários usuários por cliente.

O foco é entregar o fluxo pedido com código organizado, dados bem modelados, isolamento entre clientes e agendamento funcionando no backend.

## 12. Checklist de conclusão

- [x] Cadastro, login e saída funcionando;
- [x] CRUD de conexões;
- [x] CRUD de contatos dentro de cada conexão;
- [x] Seleção de um ou mais contatos para uma mensagem;
- [x] Simulação de envio imediato;
- [x] Agendamento para data e horário futuros;
- [x] Mudança automática de Agendada para Enviada por Cloud Function;
- [x] Listagem, filtro, edição e exclusão de mensagens;
- [x] Atualizações em tempo real nas listagens;
- [x] Dados de clientes diferentes isolados por regras e validações;
- [x] Verificação do isolamento usando pelo menos duas contas;
- [x] Verificação de que o agendamento funciona com a aplicação fechada;
- [x] Nenhuma subcoleção no Firestore;
- [x] Frontend em `/web` e backend em `/functions`;
- [x] React, TypeScript, Vite, Material UI e Tailwind CSS em uso;
- [x] Código organizado com funções e componentes funcionais;
- [x] Instruções para configurar e executar o projeto documentadas ao final do desenvolvimento.

Verificações locais concluídas. A execução automática e o link na nuvem permanecem pendentes conforme a etapa 10 de STEPS.md.
