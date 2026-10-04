# Roteiro de desenvolvimento

Siga a ordem abaixo. Implemente e verifique cada etapa antes de marcar sua conclusão. Use [PROJECT.md](./PROJECT.md) para o escopo e [ARCHITECTURE.md](./ARCHITECTURE.md) para as decisões técnicas.

## 1. Preparar o projeto

- [x] Criar `/web` com Vite, React e TypeScript; instalar Material UI e Tailwind CSS.
- [x] Inicializar `/functions` com TypeScript e configurar Firebase, regras e índices na raiz.
- [x] Configurar os emuladores de Authentication, Firestore e Functions e documentar os comandos de execução.

**Verificar:** frontend e emuladores iniciam localmente.

Verificado: Vite inicia em `http://127.0.0.1:5180`; emuladores de Auth, Firestore e Functions iniciam; a função `health` responde; cadastro local retorna usuário e token; leitura pública do Firestore é rejeitada. Build, checagem de tipos e lint passaram. Comandos e pré-requisitos estão no [README.md](./README.md).

## 2. Implementar autenticação

- [x] Configurar o SDK do Firebase e sua conexão com os emuladores.
- [x] Criar cadastro, login, saída e o provider de autenticação com persistência da sessão.
- [x] Proteger as rotas internas e aguardar a restauração da sessão antes de mostrar as telas.

**Verificar:** cadastrar, entrar, atualizar a página e sair; dados privados são limpos na saída.

Verificado: cinco testes de integração com Chromium e emuladores passaram (`npm run test:auth`). Cobrem cadastro, login, restauração após recarregar sem exibir o formulário público, saída sincronizada entre abas, bloqueio ao voltar para uma rota privada, troca entre duas contas sem exibir a identidade anterior, erros de credenciais, email duplicado, confirmação de senha e falha de rede com nova tentativa. O Firestore permanece fechado: leitura anônima, leitura entre contas e gravação direta foram rejeitadas. Build, checagem de tipos e lint passaram; login, cadastro e tela interna foram inspecionados em desktop e celular. Nesta etapa, os dados privados exibidos são os da sessão; as listagens serão implementadas nas próximas etapas.

## 3. Preparar dados e segurança

- [x] Definir os tipos de conexões, contatos e mensagens conforme a modelagem proposta.
- [x] Configurar regras para leitura apenas pelo dono e bloquear gravações diretas pelo frontend.
- [x] Preparar no backend a validação de autenticação, campos e propriedade dos documentos.

**Verificar:** acesso sem login e acesso a dados de outra conta são rejeitados. Repetir essa verificação nas próximas etapas.

## 4. Implementar conexões

- [x] Criar Functions para cadastrar, editar e excluir conexões.
- [x] Criar a tela com listagem em tempo real e formulários.
- [x] Garantir que a exclusão também limpe contatos e mensagens vinculados, com validação do cliente.

**Verificar:** CRUD completo e isolamento usando duas contas.

## 5. Implementar contatos

- [x] Criar Functions para cadastrar, editar e excluir contatos, validando a conexão.
- [x] Criar a tela de contatos da conexão com listagem em tempo real.

**Verificar:** CRUD completo; contatos de uma conexão não aparecem em outra; excluir uma conexão limpa seus contatos.

## 6. Implementar envio imediato

- [x] Criar seleção de contatos e formulário de mensagem.
- [x] Criar a Function que valida os destinatários e salva a mensagem como **Enviada**, com horário do backend e cópia dos destinatários.
- [x] Listar mensagens em tempo real.

**Verificar:** envio simulado funciona; texto vazio, ausência de destinatários e contatos de outra conexão são rejeitados.

## 7. Implementar agendamento

- [x] Adicionar data e horário ao formulário e salvar mensagens futuras como **Agendadas**.
- [x] Criar a rotina periódica que processa mensagens vencidas com transações.
- [x] Registrar os índices necessários e testar a lógica localmente com execução controlada.

**Verificar:** horários passados são rejeitados; mensagens vencidas mudam para **Enviadas**; repetir a rotina não reprocessa mensagens enviadas.

## 8. Completar o gerenciamento de mensagens

- [x] Implementar filtros de enviadas e agendadas.
- [x] Implementar edição e exclusão conforme as decisões do `PROJECT.md`.
- [x] Tratar conflitos entre edição, exclusão e processamento agendado.

**Verificar:** filtros e CRUD funcionam; mensagens excluídas não reaparecem; excluir uma conexão limpa suas mensagens.

## 9. Revisar a aplicação

- [x] Ajustar navegação, formulários, estados de carregamento, listas vazias e mensagens de erro.
- [x] Verificar o fluxo completo com duas contas, incluindo tentativas de acesso indevido ao Firestore e às Functions.
- [x] Executar build, checagem de tipos e os testes relevantes para segurança e agendamento.

**Verificar:** os requisitos do `PROJECT.md` estão atendidos e as verificações passam.

Verificado em 04/10/2026: `npm run test:smoke` passou com CRUD completo, duas contas, rejeição de acesso sem login e entre clientes, bloqueio de gravações diretas, contatos de outra conexão, validação de texto/destinatários/horários, preservação de histórico, edição de enviadas sem novo envio, processamento controlado de agendadas, idempotência, exclusão sem recriação e cascata. Os seis testes de navegador passaram, incluindo o fluxo de conexão, contato, envio, agendamento, filtros, edição e exclusão. Typecheck, lint e build de produção passaram. Conexões, contatos e mensagens foram inspecionados em desktop e celular. A execução periódica na nuvem foi verificada na etapa 10.

## 10. Publicar e documentar

- [x] Configurar o projeto Firebase na nuvem, Authentication e Firestore; habilitar o faturamento necessário para Functions e agendamento.
- [x] Publicar regras, índices, Functions e frontend; configurar o frontend para os serviços da nuvem.
- [x] Agendar uma mensagem, fechar a aplicação e verificar depois a alteração automática de status.
- [x] Finalizar o README com instalação, configuração, execução local, publicação e decisões técnicas.

**Verificar:** a aplicação publicada funciona e outra pessoa consegue executar o projeto seguindo o README.

Verificado na nuvem em 04/10/2026: Hosting em https://teste-send-flow.web.app, regras e índices publicados, onze Functions ativas e job do Cloud Scheduler habilitado a cada minuto. Cadastro, conexão, contato e envio imediato passaram no site publicado. Uma mensagem agendada mudou automaticamente para Enviada sem navegador aberto. A primeira execução do job levou alguns minutos após a criação. Retenção de imagens de Functions configurada para um dia. Código concluído e commitado antes de 17:55; Hosting publicado antes das 18:00; verificação final da rotina concluída às 18:02.
