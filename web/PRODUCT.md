# Broadcast — contexto do produto

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pessoas que criam uma conta para organizar listas de contatos e preparar mensagens de broadcast. Cada usuário autenticado representa um cliente independente, com acesso apenas aos próprios dados. Equipes, convites e vários usuários por cliente estão fora do escopo.

## Product Purpose

Entregar um teste técnico de broadcast: selecionar contatos de uma conexão, escrever uma mensagem e simular seu envio imediato ou agendado. O sucesso depende do fluxo completo, de atualizações em tempo real, do isolamento entre clientes e do processamento de mensagens agendadas no backend mesmo com o navegador fechado.

## Operating Context

- O usuário se cadastra ou entra, cria uma conexão, cadastra contatos e prepara mensagens para um ou mais contatos dessa conexão.
- Conexão é um agrupamento nomeado de contatos e mensagens; não representa uma integração com serviço externo.
- O usuário consulta mensagens, filtra por status e gerencia conexões, contatos e mensagens.
- O desenvolvimento local usa Firebase Emulator Suite e Vite. A publicação e a execução automática na nuvem ainda precisam ser verificadas conforme o roteiro.

## Capabilities and Constraints

- Envio exclusivamente simulado. Não há mensagens reais, confirmação de entrega ou integração com WhatsApp, SMS ou email.
- Os status exibidos são **Agendada** e **Enviada**; no código, `scheduled` e `sent`.
- O agendamento exige uma data e um horário futuros. O processamento ocorre no backend e não promete precisão no segundo exato.
- As listagens devem acompanhar alterações em tempo real quando aplicável.
- React, TypeScript, Vite, Material UI e Tailwind CSS compõem o frontend em `/web`; Firebase Authentication, Firestore e Cloud Functions compõem os serviços, com backend em `/functions`.
- A lógica usa funções, componentes funcionais e hooks, sem classes para organizá-la.
- O Firestore utiliza coleções na raiz, sem subcoleções. Regras e validações do backend devem impedir acesso e relacionamentos entre dados de clientes distintos.
- Conforme ARCHITECTURE.md, as leituras são diretas do Firestore e as alterações passam por Cloud Functions autenticadas, que validam propriedade e relacionamentos.
- Pagamentos, planos de assinatura e um produto completo pronto para produção estão fora do escopo.

### Propostas ainda ajustáveis

A seção 10 de PROJECT.md registra propostas iniciais, e não exigências adicionais do teste:

- Autenticação por email e senha.
- **Enviada** representa uma simulação concluída, sem confirmação de entrega.
- Editar texto e destinatários de mensagens enviadas não simula um novo envio automaticamente.
- Editar texto, destinatários e horário de mensagens agendadas mantém o horário no futuro.
- Excluir uma conexão também exclui seus contatos e mensagens pelo backend.
- Preservar nomes e telefones dos destinatários na mensagem mantém o histórico após a exclusão de contatos.
- Armazenar datas como timestamps e apresentá-las no horário local do usuário.

Mudanças dessas decisões devem ser refletidas nas referências do projeto quando aprovadas.

## Brand Commitments

O nome presente no projeto é **Broadcast**. A interface inicial e a documentação usam português do Brasil. Não foram confirmados outros compromissos de marca ou voz.

## Evidence on Hand

- [PROJECT.md](../PROJECT.md): autoridade para escopo, requisitos e decisões do teste.
- [ARCHITECTURE.md](../ARCHITECTURE.md): autoridade para estrutura, autenticação, dados e fluxos do backend.
- [STEPS.md](../STEPS.md): ordem de implementação e registro de incrementos concluídos e verificados.
- [README.md](../README.md): configuração e execução local.
- O código inicial e STEPS.md mostram a preparação do projeto concluída e uma tela provisória. Os fluxos de negócio ainda não estão concluídos; requisitos descritos aqui não são evidência de funcionalidade entregue.
- Não há depoimentos, clientes reais ou métricas de resultado fornecidos para sustentar alegações comerciais.

Este arquivo resume o contexto para o Impeccable; as referências acima continuam sendo as autoridades do projeto.

## Product Principles

- Manter o escopo simples e limitado ao teste técnico.
- Deixar claro que o envio é uma simulação.
- Garantir o isolamento dos dados em regras e validações, além da interface.
- Fazer o agendamento funcionar independentemente de uma tela aberta.
- Implementar os incrementos na ordem de STEPS.md e marcar apenas o que foi concluído e verificado.
