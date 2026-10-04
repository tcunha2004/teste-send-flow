---
name: Broadcast
description: Interface clara e funcional para organizar contatos e mensagens simuladas.
colors:
  primary: "#2563eb"
  surface: "#ffffff"
  canvas: "oklch(98.4% 0.003 247.858)"
  border: "oklch(92.9% 0.013 255.508)"
  text: "rgba(0, 0, 0, 0.87)"
  text-secondary: "oklch(44.6% 0.043 257.281)"
  text-muted: "oklch(55.4% 0.046 257.417)"
typography:
  headline:
    fontFamily: "system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 600
    lineHeight: 1.235
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  supporting:
    fontFamily: "system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
rounded:
  control: "4px"
  panel: "1rem"
spacing:
  unit: "0.25rem"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "32px"
  panel-wide:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "48px"
---

# Design System: Broadcast

## Overview

**Creative North Star: "Organização tranquila"**

Uma interface clara e funcional, em que o usuário identifica a conexão atual, encontra seus contatos e entende o estado de cada mensagem. A personalidade aparece no azul das ações, no ritmo dos espaços e no texto direto. Os componentes Material UI fornecem uma linguagem familiar para tarefas recorrentes.

Este guia vale para cadastro, login, conexões, contatos e mensagens. A direção foi confirmada pelo usuário. O frontmatter registra a base encontrada no tema e na tela inicial; as orientações abaixo estabelecem os padrões para as próximas implementações. Não significa que as telas ou todos os componentes já foram construídos ou verificados.

**Key Characteristics:**

- Fundos claros, superfícies brancas e destaque azul.
- Tipografia do sistema com hierarquia curta e legível.
- Profundidade discreta e bordas para separar regiões.
- Ações explícitas, estados compreensíveis e comportamento consistente.
- Adaptação ao celular sem perder ações ou informações essenciais.

Fontes da base atual: `src/main.tsx`, `src/app/App.tsx`, `src/index.css` e os valores resolvidos do tema Material UI e do Tailwind instalado. `PRODUCT.md` guarda o contexto do produto. `../PROJECT.md`, `../ARCHITECTURE.md` e `../STEPS.md` continuam sendo as autoridades de escopo, arquitetura e sequência de implementação.

## Colors

### Primary

- **Azul de ação** (`primary`): ação principal, seleção, links e indicadores de foco. O azul identifica o que o usuário pode fazer ou onde está.

### Neutral

- **Branco de superfície** (`surface`): formulários, diálogos e painéis de conteúdo.
- **Fundo claro** (`canvas`): fundo das telas, separando a área de trabalho das superfícies.
- **Borda suave** (`border`): divisões entre painéis e linhas; não é a única indicação de um campo interativo.
- **Texto principal** (`text`): títulos, valores e informações essenciais.
- **Texto secundário** (`text-secondary`): descrições e instruções.
- **Texto discreto** (`text-muted`): metadados não essenciais. Não usar indiscriminadamente em texto pequeno; verificar contraste sobre o fundo real.

### Estados semânticos

Nas próximas telas, usar as cores semânticas do tema Material UI: `success` para sucesso e **Enviada**, `info` para **Agendada**, `warning` para atenção e `error` para falhas e ações destrutivas. Não criar uma paleta própria por funcionalidade. `info` e os demais estados devem ser centralizados no tema quando forem implementados.

Um status sempre deve incluir o texto. **Enviada** significa envio simulado, sem confirmação de entrega. **Agendada** significa que aguarda processamento do backend; a interface não deve antecipar a mudança de status por um temporizador local.

**The Action Color Rule.** Reservar o azul para interação, seleção e orientação. Não preencher todas as regiões com a cor primária nem usar cor como única forma de comunicar um estado.

**The Contrast Rule.** Validar contraste de texto normal de pelo menos 4,5:1, texto grande de 3:1 e limites essenciais de controles e foco de 3:1. São critérios de implementação, ainda não uma certificação das telas.

## Typography

**Body Font:** `system-ui, sans-serif`, também utilizada nos títulos e controles. Não depender de fontes externas.

**Character:** texto familiar, direto e legível. Peso e espaçamento estabelecem a hierarquia; títulos não precisam de efeitos decorativos.

### Hierarquia

- **Título de tela:** papel `headline` do frontmatter; a base atual corresponde a `Typography` com variante `h4` e peso semibold. Em celulares, ajustar quando necessário para evitar quebras excessivas.
- **Título de seção:** usar a variante `h6` do Material UI. É uma orientação para telas futuras, não um token customizado existente.
- **Corpo:** papel `body` para instruções, texto de mensagens e conteúdo principal.
- **Texto de apoio:** papel `supporting` para data, horário, contagem e ajuda breve.
- **Rótulos e ações:** usar as variantes do Material UI; escrever em português do Brasil, com frases curtas e verbos concretos. Preferir capitalização de frase nos novos botões, centralizando essa alteração no tema quando implementada.

**The Hierarchy Rule.** Uma tela tem um título principal e uma sequência coerente de seções. A variante visual não substitui a semântica: definir `component="h1"`, `h2` e demais níveis conforme a estrutura.

Não truncar o texto de uma mensagem sem oferecer acesso ao conteúdo completo. Em telefones, emails e identificadores longos, permitir quebra ou truncamento com uma forma acessível de consultar o valor completo.

## Layout

### Ritmo e densidade

Usar a escala de espaçamento do frontmatter. O passo básico é de quatro pixels; oito, dezesseis e vinte e quatro organizam controles e grupos. Os passos maiores separam seções. A tela provisória utiliza um painel estreito centralizado: essa composição não é uma obrigação para as telas internas.

Nas próximas telas, manter dezesseis pixels nas margens em celular e vinte e quatro ou trinta e dois em telas maiores. Agrupar rótulo, campo e ajuda; separar grupos e seções com espaço maior. Não espalhar margens arbitrárias em cada componente.

### Estrutura das telas

- **Autenticação:** uma coluna, formulário de largura confortável e caminhos claros entre cadastro e login.
- **Área interna:** navegação, título, ação principal e conteúdo. Ao abrir uma conexão, manter seu nome visível e oferecer retorno à lista.
- **Contatos e mensagens:** agrupar dentro do contexto da conexão. Filtros e ações pertencem à lista que controlam.

Definir a navegação concreta na implementação da etapa correspondente; este guia não exige sidebar, indicadores ou dashboards adicionais.

### Responsividade

O Material UI será a referência de breakpoints para a aplicação: `xs` (0), `sm` (600), `md` (900), `lg` (1200) e `xl` (1536), em pixels. Hoje o Tailwind usa sua própria escala padrão. Ao implementar layouts compartilhados, alinhar essa escala aos breakpoints do Material UI ou usar uma única fonte para as decisões de layout; não assumir que `sm` tem o mesmo significado nas duas bibliotecas.

No celular, empilhar campos e ações quando não couberem, permitir filtros em mais de uma linha e manter áreas clicáveis com pelo menos 44 × 44 pixels. Se uma tabela tiver colunas demais, usar uma apresentação em lista com os mesmos dados e ações essenciais. Rolagem horizontal deve ficar restrita à região tabular, nunca à página inteira.

**The Context Rule.** Nome da conexão, título da tarefa e status relevante devem ser encontráveis sem depender de cor, hover ou do tamanho da tela.

## Elevation & Depth

Superfícies planas com bordas suaves são a base. O painel inicial usa `Paper` com `elevation={0}`. Não colocar sombras fortes em todos os cards.

Reservar elevação para elementos temporariamente sobrepostos: menus, popovers e diálogos. Utilizar a elevação do Material UI, sem criar sombras independentes por tela. Evitar cards aninhados quando um subtítulo, espaço ou divisor resolve a organização.

**The Depth Rule.** Profundidade deve explicar sobreposição ou prioridade, não ornamentar cada bloco de conteúdo.

## Shapes

Controles seguem a forma padrão do Material UI (`control`); painéis principais podem usar os cantos mais suaves de `panel`. Chips de status conservam a forma própria do componente. Não aplicar o raio dos painéis a todos os elementos.

Ícones devem vir de um único conjunto compatível com Material UI quando necessário. Ícones complementam rótulos; botões somente com ícone exigem nome acessível e tooltip quando útil. Não adicionar uma biblioteca de ícones apenas para decorar a tela.

## Components

A implementação atual contém `Paper`, `Typography` e `Chip`. Os padrões a seguir orientam a criação dos demais componentes nas etapas previstas; não representam funcionalidade já disponível.

| Padrão | Componente base | Regra global |
| --- | --- | --- |
| Ação principal | `Button` contained | Uma ação principal por região de tarefa; rótulo descreve o resultado. |
| Ação secundária | `Button` outlined ou text | Apoiar a ação principal com menor destaque. |
| Exclusão | `Button` ou `IconButton` com semântica de erro | Confirmar o item e explicar o alcance da exclusão. |
| Campo | `TextField` outlined | Rótulo persistente, ajuda quando necessária e erro junto ao campo. |
| Painel | `Paper` sem elevação | Agrupar uma região de tarefa; usar borda e espaço com moderação. |
| Status | `Chip` com texto | Usar **Agendada** e **Enviada**, com cor semântica. |
| Lista | `List` ou `Table` | Escolher conforme a comparação necessária; manter ações acessíveis. |
| Confirmação ou edição breve | `Dialog` | Título, conteúdo conciso e ações claras; suportar teclado e restauração de foco. |
| Aviso contextual | `Alert` | Explicar um problema que exige compreensão ou ação. |
| Retorno breve de operação | `Snackbar` | Informar sucesso sem bloquear a tarefa; não guardar o único relato de erro. |

### Formulários e ações

Manter rótulos visíveis; placeholder não substitui label. Marcar campos obrigatórios e apresentar erros em linguagem acionável. Exemplo: “Selecione pelo menos um contato.” Preservar os valores digitados após uma falha.

Durante o envio, desabilitar a ação correspondente, exibir progresso e evitar submissões duplicadas. Não desabilitar a tela inteira quando uma operação local está em andamento. Aguardar o resultado autorizado pelo backend antes de comunicar sucesso.

Usar os rótulos do produto: **Conexão**, **Contato**, **Enviar agora**, **Agendar**, **Agendada** e **Enviada**. No fluxo de criação de mensagens, indicar claramente que o envio é simulado. Não substituir conexão por conta de WhatsApp ou sugerir entrega real.

### Estados obrigatórios

| Estado | Comportamento |
| --- | --- |
| Carregamento inicial | Mostrar indicador ou skeleton com nome acessível; aguardar antes de afirmar que a lista está vazia. |
| Lista vazia | Explicar o que falta e oferecer a ação disponível, como “Criar conexão”. |
| Filtro sem resultados | Explicar que o filtro não encontrou mensagens e permitir ajustá-lo ou limpá-lo. |
| Erro de leitura | Mensagem junto à região afetada; oferecer nova tentativa quando aplicável. |
| Operação em andamento | Indicador associado à ação e proteção contra repetição. |
| Operação concluída | Feedback breve e atualização dos dados pelo fluxo previsto. |
| Erro de validação | Explicação perto do campo ou grupo correspondente, preservando entradas. |
| Sessão sendo restaurada | Estado neutro de carregamento, antes de escolher tela pública ou privada. |
| Conflito ou item excluído | Explicar que o registro mudou ou não está disponível; oferecer retorno ou atualização. |

### Datas, exclusões e acessibilidade

Mostrar datas e horários no horário local do usuário. No agendamento, indicar o contexto de fuso horário e não prometer execução no segundo exato. Exibir os timestamps e status recebidos dos serviços, sem inventar resultados.

Ao confirmar exclusão de uma conexão, apresentar os efeitos de limpeza de contatos e mensagens conforme a decisão vigente em PROJECT.md. Preferir “Excluir conexão” a “Confirmar”, e “Cancelar” para interromper. Ação destrutiva nunca deve ser a única saída ou receber foco inicial automaticamente.

Permitir o uso por teclado com foco visível e ordem lógica. Associar rótulos e erros aos controles, anunciar feedback relevante e respeitar `prefers-reduced-motion`. Transições devem ser breves e explicar mudança de estado; evitar animações contínuas em listas ou alterações em tempo real que roubem o foco.

## Do's and Don'ts

### Do

- Consultar este guia antes de criar telas e componentes.
- Centralizar tokens e overrides no tema Material UI; usar Tailwind para layout e espaçamento com a mesma escala.
- Criar componentes compartilhados quando houver repetição real, mantendo a implementação simples.
- Aplicar a mesma semântica de cor, status, ação e erro em todas as funcionalidades.
- Verificar cada fluxo alterado em desktop e celular, incluindo teclado e estados relevantes.
- Seguir STEPS.md e verificar isolamento entre clientes nas etapas que envolvam dados.
- Atualizar este guia quando uma decisão visual aprovada mudar; extrair tokens reais conforme a implementação amadurecer.

### Don't

- Criar temas, escalas de espaçamento ou variantes independentes para cada tela.
- Sobrescrever a mesma propriedade simultaneamente no tema, em `sx` e no Tailwind sem uma razão clara.
- Tratar os padrões futuros descritos aqui como componentes já implementados.
- Usar apenas cor, placeholder, hover ou ícone sem nome para comunicar informação essencial.
- Mostrar clientes, métricas ou confirmações de entrega fictícias.
- Adicionar fluxos ou dashboards fora do teste técnico para preencher espaço.
- Marcar etapas como concluídas apenas por terem sido documentadas.
