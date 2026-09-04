# Pesquisa: Tecnologia de Flashcards e Algoritmos de Repetição Espaçada

> Documento de referência técnica para o desenvolvimento do projeto Flashcards.

---

## 1. Fundamentos — Repetição Espaçada (Spaced Repetition)

### O que é?

Repetição espaçada é uma técnica de aprendizado baseada em evidências científicas onde o material é revisado em **intervalos crescentes de tempo**. A técnica explora o **efeito de espaçamento** (spacing effect) e combate a **curva do esquecimento** (forgetting curve), descoberta por Hermann Ebbinghaus em 1885.

### Princípio Central

- Cartões **difíceis** (errados frequentemente) → aparecem com **mais frequência**
- Cartões **fáceis** (acertados consistentemente) → aparecem com **menos frequência**
- A cada revisão bem-sucedida, o intervalo até a próxima revisão **aumenta**
- Se o usuário erra, o intervalo **diminui** (ou volta ao início)

### Curva do Esquecimento

A probabilidade de lembrar uma informação decai exponencialmente com o tempo se não houver revisão. A repetição espaçada intercepta essa curva nos momentos ideais para maximizar a retenção com mínimo esforço.

```
Retenção (%)
100% ┤━━━━━┓
 90% ┤     ┗━━━┓         ← Ponto ideal de revisão (~90%)
 80% ┤         ┗━━━━┓
 70% ┤              ┗━━━━━┓
 60% ┤                    ┗━━━━━━━
     └────────────────────────────→ Tempo
```

---

## 2. Como o Anki Funciona

### Conceitos Fundamentais

| Conceito | Descrição |
|---|---|
| **Note** | Registro de dados (não é um card diretamente). Contém campos (frente, verso, áudio, etc.) |
| **Card** | Gerado a partir de uma Note usando templates. Uma Note pode gerar múltiplos Cards |
| **Deck** | Coleção/baralho de cards organizados por tema |
| **Note Type** | Define quais campos uma Note tem e como os Cards são gerados |
| **Template** | Define a aparência do Card (frente/verso) usando HTML/CSS |

### Estados dos Cards

```
┌──────────┐    Primeira    ┌──────────┐    Graduação    ┌──────────┐
│   NEW    │───────────────→│ LEARNING │───────────────→│  REVIEW  │
│ (Novo)   │    revisão     │(Aprendendo)│  (acertar N    │(Revisão) │
└──────────┘                └──────────┘    vezes)       └────┬─────┘
                                 ↑                           │
                                 │         Errou (Lapse)     │
                                 │  ┌──────────┐             │
                                 └──┤ RELEARN  │←────────────┘
                                    │(Reaprender)│
                                    └──────────┘
```

### Fluxo de Estudo

1. O usuário vê a **pergunta** (frente do card)
2. Pensa na resposta
3. Clica em "Mostrar Resposta"
4. Compara sua resposta com a correta
5. Avalia com um dos botões: **Again** (1), **Hard** (2), **Good** (3), **Easy** (4)
6. O algoritmo calcula o **próximo intervalo** de revisão

### Siblings e Burying

Cards gerados da mesma Note são "siblings" (irmãos). O Anki pode automaticamente "enterrar" siblings para evitar que apareçam na mesma sessão de estudo.

### Fuzz Factor

O Anki adiciona uma pequena variação aleatória nos intervalos para evitar que cards introduzidos/revisados juntos fiquem sempre agrupados.

---

## 3. Algoritmos de Repetição Espaçada — Comparação

### 3.1 Sistema Leitner (1972)

**Tipo:** Baseado em caixas/boxes
**Complexidade:** Muito simples
**Usado por:** Flashcards físicos, apps simples

#### Como funciona:

```
Acertou →  promove para próxima caixa
Errou   →  volta para caixa 1

┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Caixa 1 │──→│ Caixa 2 │──→│ Caixa 3 │──→│ Caixa 4 │──→│ Caixa 5 │
│ Todo dia │   │ A cada  │   │ A cada  │   │ A cada  │   │ A cada  │
│          │   │ 2 dias  │   │ 5 dias  │   │ 8 dias  │   │ 14 dias │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
     ↑              │              │              │              │
     └──────────────┴──────────────┴──────────────┴──────────────┘
                          Errou (volta para Caixa 1)
```

#### Prós:
- Extremamente simples de implementar
- Fácil de entender para o usuário
- Funciona razoavelmente bem para pequenos conjuntos de cards

#### Contras:
- Intervalos fixos e arbitrários
- Não se adapta ao desempenho individual do usuário
- Não considera a dificuldade intrínseca do material
- Ineficiente para grandes volumes de cards

---

### 3.2 SM-2 — SuperMemo 2 (1987)

**Tipo:** Fator de facilidade + intervalos multiplicativos
**Complexidade:** Moderada
**Usado por:** Anki (como base até v23.10), Mnemosyne

#### Variáveis rastreadas por card:

| Variável | Descrição |
|---|---|
| `n` | Número de revisões consecutivas bem-sucedidas |
| `EF` | Easiness Factor (fator de facilidade) — quão fácil o card é. Inicial: **2.5** |
| `I` | Intervalo em dias até próxima revisão |

#### Escala de Avaliação (0-5):

| Nota | Significado |
|---|---|
| 0 | Apagão total |
| 1 | Incorreto, mas pareceu familiar |
| 2 | Incorreto, mas fácil de lembrar depois |
| 3 | Correto, com muito esforço |
| 4 | Correto, com hesitação |
| 5 | Correto, sem esforço |

#### Algoritmo (pseudocódigo):

```
SE nota >= 3 (resposta correta):
    SE n = 0: I = 1 dia
    SE n = 1: I = 6 dias
    SENÃO:    I = I × EF
    n = n + 1
SENÃO (resposta incorreta):
    n = 0
    I = 1 dia

// Atualizar fator de facilidade
EF = EF + (0.1 - (5 - nota) × (0.08 + (5 - nota) × 0.02))
SE EF < 1.3: EF = 1.3
```

#### Exemplo prático:

```
Card novo → Intervalo: 1 dia
Acertou   → Intervalo: 6 dias    (EF = 2.5)
Acertou   → Intervalo: 15 dias   (6 × 2.5)
Acertou   → Intervalo: 37 dias   (15 × 2.5)
Errou     → Volta para 1 dia, EF diminui
```

#### Prós:
- Simples e bem testado ao longo de décadas
- EF se adapta ao desempenho do usuário
- Implementação direta

#### Contras:
- **"Ease Hell"**: EF pode cair para 1.3 e ficar preso, forçando revisões frequentes
- Não modela a memória como fenômeno probabilístico
- Intervalos crescem linearmente com o EF (sem limites superiores inteligentes)
- Não considera atrasos nas revisões adequadamente

---

### 3.3 FSRS — Free Spaced Repetition Scheduler (2022+)

**Tipo:** Modelo DSR (Difficulty, Stability, Retrievability) baseado em machine learning
**Complexidade:** Alta
**Usado por:** Anki (desde v23.10 como opção), RemNote (desde v1.16)
**Versão atual:** FSRS-6 (21 parâmetros)

#### Modelo de Memória — DSR

O FSRS modela a memória com três componentes:

| Componente | Símbolo | Descrição |
|---|---|---|
| **Retrievability** | R | Probabilidade de lembrar (0 a 1). Decai com o tempo |
| **Stability** | S | Tempo (em dias) para R cair a 90%. Quanto maior, mais estável a memória |
| **Difficulty** | D | Dificuldade intrínseca do card (escala 1-10) |

#### Escala de Avaliação (1-4):

| Nota | Significado |
|---|---|
| 1 (Again) | Não lembrou |
| 2 (Hard) | Lembrou com muita dificuldade |
| 3 (Good) | Lembrou com algum esforço |
| 4 (Easy) | Lembrou sem esforço |

#### Fórmulas Principais (FSRS v4):

**Curva do Esquecimento:**

$$R(t, S) = \left(1 + \frac{t}{9 \cdot S}\right)^{-1}$$

Onde $R = 0.9$ quando $t = S$ (a estabilidade é definida como o intervalo para 90% de retenção).

**Próximo Intervalo:**

$$I(r, S) = 9 \cdot S \cdot \left(\frac{1}{r} - 1\right)$$

Onde $r$ é a retenção desejada (padrão: 0.9).

**Estabilidade Inicial (primeiro rating):**

$$S_0(G) = w_{G-1}$$

**Dificuldade Inicial:**

$$D_0(G) = w_4 - (G - 3) \cdot w_5$$

**Nova Estabilidade após Recall (acerto):**

$$S'_r(D, S, R, G) = S \cdot \left(e^{w_8} \cdot (11 - D) \cdot S^{-w_9} \cdot (e^{w_{10} \cdot (1-R)} - 1) \cdot w_{15}^{[\text{G=2}]} \cdot w_{16}^{[\text{G=4}]} + 1\right)$$

**Nova Estabilidade após Lapse (erro):**

$$S'_f(D, S, R) = w_{11} \cdot D^{-w_{12}} \cdot \left((S+1)^{w_{13}} - 1\right) \cdot e^{w_{14} \cdot (1-R)}$$

**Nova Dificuldade após revisão:**

$$D'(D, G) = w_7 \cdot D_0(3) + (1 - w_7) \cdot (D - w_6 \cdot (G - 3))$$

A fórmula de dificuldade usa **mean reversion** para evitar o "ease hell" do SM-2.

#### Propriedades do FSRS:

1. **Quanto maior D (dificuldade)** → menor o crescimento de estabilidade
2. **Quanto maior S (estabilidade)** → mais difícil aumentar ainda mais (diminishing returns)
3. **Quanto menor R (retrievability)** → maior o ganho de estabilidade se acertar (spacing effect)
4. **S_Inc sempre >= 1** se a revisão foi bem-sucedida
5. **Atrasos não crescem linearmente** — a estabilidade converge para um limite superior

#### Evolução das Versões:

| Versão | Parâmetros | Ano | Novidades |
|---|---|---|---|
| FSRS v1 | 7 | 2022 | Versão inicial, modelo simples |
| FSRS v2 | 14 | 2022 | Separação de recall/lapse stability |
| FSRS v3 | 13 | 2023 | Simplificação, mean reversion |
| FSRS v4 | 17 | 2023 | Curva de esquecimento melhorada, multiplicadores Hard/Easy |
| FSRS-4.5 | 17 | 2023 | Nova curva: decay=-0.5, factor=19/81 |
| FSRS-5 | 19 | 2024 | Linear damping, same-day reviews, D₀(4) como alvo |
| FSRS-6 | 21 | 2025 | Decay trainável, S converge em same-day reviews |

#### Prós:
- Baseado em pesquisa científica moderna (papers no ACM KDD e IEEE TKDE)
- Parâmetros otimizáveis por machine learning com dados do usuário
- Modela a memória de forma probabilística (mais realista)
- Evita "ease hell" com mean reversion
- Considera atrasos de revisão de forma inteligente
- Parâmetros padrão treinados em ~700 milhões de revisões de ~20 mil usuários
- Open-source e bem documentado

#### Contras:
- Complexidade de implementação significativamente maior
- Otimização de parâmetros requer dados suficientes do usuário
- Mais difícil de explicar para o usuário final

---

### 3.4 Outros Algoritmos Relevantes

#### DASH (Difficulty, Ability, Study History)
- Modelo que considera não só a dificuldade do material, mas também a **habilidade do estudante**
- Usado em contexto acadêmico

#### SSP-MMC (Stochastic Shortest Path - Minimize Memorization Cost)
- Base teórica do FSRS
- Paper original de Ye et al. no ACM KDD 2022
- Formula o problema de agendamento como um **caminho mais curto estocástico**

#### Neural Network-based
- Abordagens com redes neurais para prever momento ideal de revisão
- Mais experimental, menos explicável

#### Confidence-Based Repetition (CBR)
- Usado pelo Brainscape
- O usuário avalia sua **confiança** (1-5) em vez da qualidade da resposta
- Cards com menor confiança aparecem mais frequentemente

#### Pimsleur (Graduated-Interval Recall)
- Intervalos pré-definidos: 5s, 25s, 2min, 10min, 1h, 5h, 1 dia, 5 dias, 25 dias, 4 meses, 2 anos
- Otimizado para instrução por áudio
- Intervalos iniciais muito curtos (segundos)

---

## 4. Comparação Resumo

| Critério | Leitner | SM-2 | FSRS |
|---|---|---|---|
| **Complexidade** | Muito baixa | Baixa | Alta |
| **Adaptabilidade** | Nenhuma | Parcial (EF) | Total (ML) |
| **Parâmetros** | 0 | 3/card | 17-21 globais + 3/card |
| **Ease Hell** | N/A | Sim | Não (mean reversion) |
| **Modelo de memória** | Caixas | Fator linear | Probabilístico (DSR) |
| **Base científica** | Fraca | Moderada | Forte (KDD, TKDE) |
| **Atrasos de revisão** | Ignorados | Linear | Convergente |
| **Personalização** | Não | Manual | Automática (ML) |
| **Implementação** | ~50 linhas | ~100 linhas | ~300-500 linhas |

---

## 5. Recomendação para o Projeto

### Abordagem Sugerida: **FSRS como algoritmo principal, com fallback para SM-2**

#### Razões:

1. **FSRS é o estado da arte** — usado pelo Anki desde 2023, provado com bilhões de revisões
2. **Open-source** — implementações disponíveis em múltiplas linguagens (TypeScript, Rust, Python, Go, etc.)
3. **Parâmetros padrão funcionais** — não precisa de dados do usuário para começar (os defaults foram treinados em 700M+ reviews)
4. **SM-2 como fallback** — para simplicidade em cenários offline ou quando o usuário preferir

#### Implementações Open-Source Disponíveis:

| Linguagem | Repositório |
|---|---|
| TypeScript/JS | [open-spaced-repetition/ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) |
| Rust | [open-spaced-repetition/fsrs-rs](https://github.com/open-spaced-repetition/fsrs-rs) |
| Python | [open-spaced-repetition/py-fsrs](https://github.com/open-spaced-repetition/py-fsrs) |
| Go | [open-spaced-repetition/go-fsrs](https://github.com/open-spaced-repetition/go-fsrs) |
| Dart | [open-spaced-repetition/dart-fsrs](https://github.com/open-spaced-repetition/dart-fsrs) |
| Swift | [open-spaced-repetition/swift-fsrs](https://github.com/open-spaced-repetition/swift-fsrs) |

#### Estrutura de Dados Necessária por Card:

```typescript
interface CardState {
  // Identidade
  cardId: string;
  noteId: string;
  deckId: string;

  // Estado de memória (FSRS)
  stability: number;        // S — dias para R cair a 90%
  difficulty: number;        // D — dificuldade (1-10)
  elapsedDays: number;       // dias desde última revisão
  scheduledDays: number;     // dias agendados para próxima revisão
  reps: number;              // total de revisões
  lapses: number;            // total de vezes esquecido
  state: 'new' | 'learning' | 'review' | 'relearning';

  // Timestamps
  due: Date;                 // quando deve ser revisado
  lastReview: Date | null;   // última revisão
}

interface ReviewLog {
  cardId: string;
  rating: 1 | 2 | 3 | 4;    // Again, Hard, Good, Easy
  state: CardState['state']; // estado antes da revisão
  due: Date;                 // quando estava agendado
  stability: number;         // S antes da revisão
  difficulty: number;        // D antes da revisão
  elapsedDays: number;
  lastElapsedDays: number;
  scheduledDays: number;
  review: Date;              // quando foi realmente revisado
}
```

---

## 6. Conceitos Importantes para a Implementação

### Retenção Desejada (Desired Retention)

O FSRS permite configurar a **taxa de retenção desejada** (padrão: 90%). Isso afeta diretamente os intervalos:
- 90% → intervalos padrão
- 95% → intervalos ~50% mais curtos (mais revisões)
- 80% → intervalos ~2x mais longos (menos revisões)

### Learning Steps

Antes de um card "graduar" para o estado de revisão, ele passa por **passos de aprendizado**:
- Exemplo: `[1min, 10min]` — o card aparece após 1 minuto, depois após 10 minutos
- Se acertar todos os passos, gradua para Review com intervalo calculado pelo algoritmo

### Relearning Steps

Quando um card em Review é errado (lapse), ele entra em Relearning:
- Similar aos learning steps, mas para cards já conhecidos
- O intervalo após reaprender é calculado pela fórmula de post-lapse stability

### Maximum Interval

Limite superior para intervalos (padrão no Anki: 36500 dias = 100 anos).

### Siblings e Burying

Cards da mesma Note são siblings. Quando um é revisado, os outros podem ser "enterrados" até o próximo dia para evitar viés de memória de curto prazo.

---

## 7. Arquitetura do Sistema de Flashcards

### Modelo de Dados Conceitual:

```
┌─────────┐     ┌─────────────┐     ┌──────────────┐
│  User   │────→│    Deck     │────→│    Note      │
└─────────┘  1:N└─────────────┘  1:N└──────────────┘
                      │                    │
                      │                    │ 1:N (via template)
                      ↓                    ↓
               ┌─────────────┐     ┌──────────────┐
               │ Deck Options│     │    Card      │
               │ (settings)  │     │  (+ estado)  │
               └─────────────┘     └──────┬───────┘
                                          │
                                          │ 1:N
                                          ↓
                                   ┌──────────────┐
                                   │ Review Log   │
                                   └──────────────┘
```

### Fluxo de Estudo:

```
1. Buscar cards "due" (due <= agora)
   ├── Ordenar: Learning > Review > New
   └── Aplicar limites diários (new/review)

2. Mostrar card (frente)

3. Usuário revela resposta

4. Usuário avalia: Again(1) | Hard(2) | Good(3) | Easy(4)

5. Algoritmo calcula:
   ├── Novo estado (S, D, state)
   ├── Próximo intervalo
   └── Nova data "due"

6. Salvar ReviewLog + atualizar Card

7. Próximo card (voltar ao passo 2)
```

---

## 8. Análise do Projeto de Referência — `fsrs-anki-remake` (Python)

Mini projeto em Python que implementa um Anki simplificado com FSRS-6. Serve como referência prática para entender como o algoritmo se traduz em código.

### Estrutura do Projeto

```
fsrs-anki-remake/
├── fsrs.py          # CLI principal — loop de interação com o usuário
├── flashcard.py     # Classe Flashcard — modelo de dados + lógica FSRS
├── values.py        # Parâmetros W do FSRS-6 + constantes DECAY/FACTOR
├── helpers.py       # Funções auxiliares — peso de seleção e amostragem ponderada
├── cardPacks.py     # Pacotes pré-definidos (toki pona, programação, história)
├── superBasico.json # Exemplo de deck salvo em JSON
└── superBasicoComRespostas.json
```

### Modelo de Dados — `Flashcard`

```python
class Flashcard:
    front: str          # Frente do card (pergunta)
    back: str           # Verso do card (resposta)
    isQuestion: bool    # Se é card de múltipla escolha
    opcaoCorreta: int   # Opção correta (para múltipla escolha)
    R: float            # Retrievability
    S: float            # Stability (dias)
    D: float            # Difficulty (1-10)
    G: float            # Grade (último rating)
    lastReview: int     # Dia da última revisão
    hasBeenRated: bool  # Se já foi avaliado pelo menos uma vez
```

**Valores iniciais** (dos parâmetros FSRS-6):
- `R = W[0] = 0.2172`
- `S = W[1] = 1.1771` (estabilidade inicial ~1.2 dias)
- `D = W[2] = 3.2602`
- `G = W[3] = 16.1507`

### Implementação do FSRS-6

#### Parâmetros (21 valores):

```python
W = [0.2172, 1.1771, 3.2602, 16.1507, 7.0114, 0.57, 2.0966, 0.0069,
     1.5261, 0.112, 1.0178, 1.849, 0.1133, 0.3127, 2.2934, 0.2191,
     3.0004, 0.7536, 0.3332, 0.1437, 0.2]

DECAY = -0.5
FACTOR = 19/81
```

#### Fórmulas implementadas:

**Dificuldade inicial** (primeiro rating):
```python
def d0(self, grade):
    return W[4] - (e ** (W[5] * (grade - 1))) + 1
```

**Variação de dificuldade** (delta):
```python
def deltaD(self, grade):
    return -1 * W[6] * (grade - 3)
```

**Nova dificuldade** (com linear damping):
```python
def ratedNewD(self, grade):
    return self.D + (self.deltaD(grade) * (10 - self.D) / 9)
```

**Nova estabilidade** (FSRS-6 — same-day review com convergência):
```python
def newStab(self, grade):
    return self.S * e ** (W[17] * (grade - 3 + W[18])) * self.S ** (-1 * W[19])
```

#### Seleção de cards para estudo:

```python
# Peso baseado em quanto tempo passou desde que deveria ser revisado
def weight_time_stability(day, card):
    return max((day - card.lastReview - card.S + 1) ** 3 + 0.1, 0.1)
```

O peso cresce **cubicamente** quando o card está atrasado (`dia_atual > lastReview + S`), priorizando cards mais atrasados. Cards no prazo ou adiantados têm peso mínimo (0.1).

A seleção usa **amostragem ponderada** — cards atrasados têm probabilidade muito maior de serem escolhidos.

### Funcionalidades Implementadas

| Feature | Descrição |
|---|---|
| Criar card normal | Frente/Verso simples |
| Criar card pergunta | Múltipla escolha com N opções |
| Estudar N cards | Seleção ponderada por urgência |
| Avaliação 4 botões | Again(1), Hard(2), Good(3), Easy(4) |
| Pacotes pré-definidos | Toki Pona, Programação, História |
| Salvar/Carregar | Persistência em JSON |
| Passar o dia | Simulação de avanço temporal |
| Full log | Debug — mostra estado de todos os cards |

### O Que Falta no Projeto de Referência (e que vamos implementar)

| Aspecto | fsrs-anki-remake | Nosso Projeto |
|---|---|---|
| **Retrievability** | Armazena R mas não recalcula | Recalcular R com curva do esquecimento |
| **Curva de esquecimento** | Não implementada | $R(t,S) = (1 + \text{FACTOR} \cdot t/S)^{\text{DECAY}}$ |
| **Post-lapse stability** | Não diferencia again de hard | Fórmula $S'_f$ separada para lapses |
| **Cálculo de intervalo** | Usa S diretamente como intervalo | $I(r,S) = \frac{S}{\text{FACTOR}} \cdot (r^{1/\text{DECAY}} - 1)$ |
| **Estados do card** | Não tem (new/learning/review) | 4 estados: New, Learning, Review, Relearn |
| **Learning steps** | Não implementados | Passos sub-diários (1min, 10min) |
| **Retenção desejada** | Não configurável | Configurável (padrão 90%) |
| **Review logs** | Não registra | Histórico completo de revisões |
| **Decks/Subdecks** | Não tem | Hierarquia de decks |
| **Note/Card separation** | Card = Note (fundidos) | Note gera múltiplos Cards via templates |
| **Mean reversion (D)** | Não implementa W[7] | $D'' = w_7 \cdot D_0(4) + (1-w_7) \cdot D'$ |
| **Fuzz factor** | Não tem | Variação aleatória nos intervalos |
| **Siblings/Burying** | Não tem | Enterrar cards da mesma Note |
| **Limites diários** | Não tem | Máximo de cards novos/revisão por dia |
| **Sync** | Local apenas (JSON) | API + sincronização multi-device |
| **Hard/Easy multipliers** | Não diferencia na estabilidade | $w_{15}^{[G=2]} \cdot w_{16}^{[G=4]}$ |

### Lições Aprendidas do Projeto de Referência

1. **Simplicidade do core**: O motor FSRS é surpreendentemente compacto — ~20 linhas de lógica real
2. **Seleção ponderada funciona**: A abordagem de peso cúbico para priorizar cards atrasados é elegante
3. **Serialização JSON é suficiente para MVP**: O modelo `to_dict`/`from_dict` é direto e funcional
4. **Separar parâmetros em arquivo dedicado**: O `values.py` com constantes facilita experimentação
5. **Cards de pergunta são uma boa extensão**: A variante de múltipla escolha com avaliação automática (acertou=Good, errou=Again) é um diferencial

### Plano de Arquitetura para Nosso Projeto

Baseado na pesquisa e na análise do projeto de referência, a arquitetura sugerida:

```
┌─────────────────────────────────────────────────────────┐
│                        Mobile App                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐   │
│  │  Screens │ │Components│ │  Hooks   │ │  Stores   │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘   │
│       └─────────────┴────────────┴─────────────┘        │
│                         │                               │
│              ┌──────────┴──────────┐                    │
│              │   FSRS Engine (TS)  │ ← core do algoritmo│
│              │  - schedulerCard()  │                    │
│              │  - rateCard()       │                    │
│              │  - getRetrievab()   │                    │
│              └──────────┬──────────┘                    │
│                         │                               │
│              ┌──────────┴──────────┐                    │
│              │   Local Storage     │ ← SQLite/MMKV      │
│              └──────────┬──────────┘                    │
│                         │ sync                          │
└─────────────────────────┼───────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │    Backend API    │
                │  - Auth           │
                │  - Sync           │
                │  - Deck sharing   │
                └─────────┬─────────┘
                          │
                ┌─────────┴─────────┐
                │    Frontend Web   │
                │  (mesma lógica)   │
                └───────────────────┘
```

**Motor FSRS em TypeScript**: Usar a lib [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) ou implementar nosso próprio baseado nas fórmulas documentadas, compartilhando entre Mobile e Web.

---

## 9. Referências

1. Ebbinghaus, H. (1885). *Über das Gedächtnis*
2. Leitner, S. (1972). *So lernt man Lernen*
3. Woźniak, P. (1990). *Application of a computer to improve the results obtained in working with the SuperMemo method* (SM-2)
4. Ye, J., Su, J., Cao, Y. (2022). *A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling* — ACM KDD
5. Ye, J., Su, J., Nie, L., Cao, Y., Chen, Y. (2023). *Optimizing Spaced Repetition Schedule by Capturing the Dynamics of Memory* — IEEE TKDE
6. Pimsleur, P. (1967). *A Memory Schedule*
7. [FSRS Algorithm Wiki](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm)
8. [Anki Manual](https://docs.ankiweb.net/)
9. [ts-fsrs — TypeScript Implementation](https://github.com/open-spaced-repetition/ts-fsrs)
10. [fsrs-anki-remake](../../../fsrs-anki-remake/) — Projeto de referência em Python analisado
