# Estatisticas — Referencia de Graficos no Ecme

> Objetivo: registrar como a pagina de Estatisticas pode evoluir visualmente usando o demo do Ecme como referencia de composicao, ritmo e tipo de grafico, sem copiar o dominio original do template.

---

## 1. Fonte de referencia

Demo analisado:

- `/home/dedzec/Downloads/Ecme - React Tailwind Admin Template/demo`

Arquivos-base observados:

- `src/components/shared/Chart.tsx`
- `src/configs/chart.config.ts`
- `src/views/dashboards/AnalyticDashboard/AnalyticDashboard.tsx`
- `src/views/dashboards/AnalyticDashboard/components/AnalyticChart.tsx`
- `src/views/dashboards/AnalyticDashboard/components/DeviceSession.tsx`
- `src/views/dashboards/EcommerceDashboard/components/Overview.tsx`
- `src/views/dashboards/MarketingDashboard/components/AdsPerformance.tsx`

---

## 2. O que o Ecme faz bem

### Composicao de dashboard

Os dashboards do Ecme seguem um padrao consistente:

- cards-resumo no topo
- um grafico principal ocupando mais largura
- widgets secundarios ao lado ou abaixo
- controles pequenos e claros de periodo/categoria
- tudo encapsulado em cards com espacamento limpo

Isso combina bem com a nossa pagina `/statistics`, que hoje ja tem hero, cards-resumo e um grafico principal.

### Linguagem visual dos graficos

O Ecme usa uma linguagem previsivel e boa para leitura:

- linhas suaves (`curve: 'smooth'`)
- barras com cantos arredondados
- legendas discretas ou ocultas quando nao agregam valor
- tooltips limpos
- pouca poluicao visual no eixo
- destaque maior para a forma do dado do que para decoracao excessiva

### Layout responsivo

Os dashboards normalmente:

- agrupam o grafico principal em area maior
- movem cards auxiliares para colunas laterais no desktop
- colapsam tudo em pilha vertical no mobile

Esse comportamento deve ser preservado na nossa pagina de estatisticas.

---

## 3. Padroes tecnicos observados no Ecme

### Wrapper compartilhado de grafico

O Ecme concentra a integracao com ApexCharts em:

- `src/components/shared/Chart.tsx`

Esse wrapper:

- padroniza opcoes por tipo (`line`, `bar`, `area`, `donut`, `radar`)
- injeta `xAxis`
- permite `customOptions`
- resolve detalhes de legenda e responsividade

### Defaults centralizados

O Ecme centraliza defaults em:

- `src/configs/chart.config.ts`

Padroes que valem como referencia:

- `toolbar: { show: false }`
- `dataLabels: { enabled: false }`
- `stroke.width` entre `2` e `2.5`
- `curve: 'smooth'`
- gradiente leve para area chart
- donut sem legenda pesada e com centro limpo

### Cards interativos com grafico vinculado

No componente `Overview.tsx`, o Ecme usa:

- cards de KPI clicaveis
- troca da serie principal conforme o KPI selecionado
- seletor de periodo no header do card

Esse padrao e especialmente bom para a nossa evolucao da pagina de estatisticas.

### Grafico misto

No componente `AdsPerformance.tsx`, o Ecme usa:

- barras + linha no mesmo grafico
- tooltip customizado
- troca de categoria por `Segment`

Esse padrao serve como referencia para comparativos de conteudo e administracao no nosso projeto.

---

## 4. Como adaptar isso para o projeto Flashcards

### Fase atual da nossa pagina

Hoje a pagina `/statistics` ja cobre:

- cards-resumo de estudo
- filtro por `7`, `30` e `90` dias
- grafico principal de revisoes por dia
- bloco lateral de leitura rapida

### Proximo passo visual recomendado

Evoluir a pagina mantendo a estrutura atual, mas aproximando a experiencia do Ecme com:

- um grafico principal mais refinado
- widgets secundarios menores abaixo
- cards-resumo com relacao mais clara com o grafico principal

---

## 5. Proposta de graficos para a pagina de Estatisticas

### Bloco 1 — Revisoes por dia

Tipo recomendado:

- `line` ou `area`

Referencia Ecme:

- `AnalyticChart.tsx`
- `Overview.tsx`

Aplicacao no projeto:

- eixo X com dias
- eixo Y com total de revisoes
- linha suave
- area leve sob a linha para dar profundidade
- sem legenda visivel quando houver apenas uma serie

### Bloco 2 — Distribuicao por avaliacao

Tipo recomendado:

- `donut`

Aplicacao no projeto:

- Again
- Hard
- Good
- Easy

Uso:

- ajuda a entender qualidade do estudo, nao apenas volume

Referencia Ecme:

- `DeviceSession.tsx`

### Bloco 3 — Conteudo disponivel

Tipo recomendado:

- `bar`

Aplicacao no projeto:

- decks visiveis
- grupos de flashcards
- cards totais
- cards devidos

Uso:

- bom para a Fase 2 de estatisticas de conteudo

Referencia Ecme:

- defaults de barra em `chart.config.ts`

### Bloco 4 — Comparativo misto

Tipo recomendado:

- `bar + line`

Aplicacao no projeto:

- barras: revisoes por periodo
- linha: retencao media ou tempo medio

Uso:

- mais adequado para fase administrativa ou analitica avancada

Referencia Ecme:

- `AdsPerformance.tsx`

---

## 6. Recomendacoes praticas para implementacao

### Recomendacao 1

Criar um wrapper local para graficos em vez de configurar cada grafico direto dentro da pagina.

Exemplo de destino:

- `Frontend/src/app/main/statistics/components/StatisticsChart.tsx`

Objetivo:

- centralizar tema
- centralizar tooltip
- centralizar responsividade
- evitar duplicacao de configuracao

### Recomendacao 2

Usar `react-apexcharts` para os proximos graficos da pagina de Estatisticas se a intencao for aproximar mais do Ecme.

Motivo:

- o Ecme usa ApexCharts
- o nosso frontend ja possui `react-apexcharts` instalado
- isso reduz friccao para reproduzir tipos como donut e mixed chart

Observacao:

- o grafico atual de revisoes por dia foi implementado com `echarts-for-react`
- nao e obrigatorio migrar agora
- mas vale escolher uma biblioteca dominante para a pagina antes de expandir a Fase 2

### Recomendacao 3

Evitar excesso de graficos na mesma primeira dobra.

Melhor composicao:

- cards KPI no topo
- 1 grafico principal
- 2 widgets secundarios abaixo

Isso preserva leitura e fica mais proximo do ritmo de dashboard do Ecme.

---

## 7. Sugestao de evolucao da nossa pagina

### Versao 1.1

- manter cards atuais
- refinar o grafico principal para area/line com visual mais proximo do Ecme
- adicionar donut de distribuicao por rating

### Versao 1.2

- adicionar bloco de conteudo com barras
- total de decks
- total de flashcards
- total de cards
- cards devidos

### Versao 1.3

- adicionar comparativo administrativo para `admin` e `develop`
- mixed chart
- filtros por perfil e periodo

---

## 8. Decisao recomendada agora

- Usar o Ecme como referencia de linguagem visual e composicao.
- Nao copiar o dashboard legado nem o dominio do template.
- Se a pagina de Estatisticas continuar crescendo, criar um wrapper local de graficos inspirado no `Chart.tsx` do Ecme.
- Antes de adicionar novos widgets, decidir se a pagina vai consolidar em `echarts` ou migrar para `react-apexcharts`.
