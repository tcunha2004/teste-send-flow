# Orientações para o desenvolvimento

- Leia [PROJECT.md](./PROJECT.md) para entender o escopo, os requisitos e as decisões do projeto.
- Leia [ARCHITECTURE.md](./ARCHITECTURE.md) para entender a estrutura, a autenticação, os dados e os fluxos de backend.
- Leia [STEPS.md](./STEPS.md) e siga suas etapas em ordem, implementando e verificando cada incremento antes de avançar.
- Use esses três arquivos como referência durante todo o desenvolvimento. Atualize-os quando uma decisão aprovada mudar e marque no `STEPS.md` apenas os itens concluídos e verificados.
- Mantenha a implementação simples, organizada e limitada ao teste técnico.
- Organize o frontend em `/web` e as Cloud Functions em `/functions`.
- Use React, TypeScript, Vite, Material UI e Tailwind CSS no frontend, com Firebase Authentication, Firestore e Cloud Functions.
- Siga o paradigma funcional, usando funções, componentes funcionais e hooks, sem classes para organizar a lógica.
- Não utilize subcoleções no Firestore. Garanta o isolamento dos dados de cada cliente nas regras e nas validações do backend.
- Use leituras em tempo real quando aplicável. O processamento das mensagens agendadas deve acontecer no backend, mesmo com a aplicação fechada.
- Verifique os fluxos alterados e a segurança entre clientes antes de considerar uma tarefa concluída.
