# Checklist — Novas Implementações

> Checklist funcional para orientar a próxima fase de mudanças em RBAC, flashcards, decks e estatísticas.

---

## 1. Role `monitor`

- [x] Adicionar a role `monitor` no backend.
- [x] Atualizar tipos, enums, validações e regras de autorização que hoje assumem apenas `develop/admin/user`.
- [x] Atualizar o frontend para reconhecer a role `monitor` na autenticação, guards, navegação e redirect inicial.
- [x] Garantir que `monitor` possa criar decks públicos.
- [x] Garantir que `monitor` possa criar flashcards.

### Critério de aceite

- Um usuário `monitor` consegue autenticar normalmente.
- Um usuário `monitor` consegue acessar os fluxos permitidos sem receber bloqueio indevido.
- A role `monitor` não ganha permissões administrativas fora do escopo definido.

---

## 2. Regras de acesso da gestão de flashcards

- [x] Liberar a página de gerenciamento de flashcards para `monitor`, `admin` e `develop`.
- [x] Revisar guardas de rota, menus, botões e ações da tela para refletir essa regra.
- [x] Garantir que usuários `user` não tenham acesso a essa área de gestão.

### Critério de aceite

- `monitor`, `admin` e `develop` acessam a página normalmente.
- `user` não acessa a página nem por navegação direta de URL.

---

## 3. Flashcards públicos por definição

- [x] Garantir no backend que todo flashcard seja público por regra de negócio.
- [x] Remover ou desabilitar qualquer opção de privacidade de flashcard no frontend, se existir.
- [x] Ajustar DTOs, models, services e respostas da API para não depender de privacidade configurável de flashcard.
- [ ] Validar se a listagem e o consumo desses flashcards continuam compatíveis com a lógica FSRS.

### Critério de aceite

- Não existe fluxo para criar flashcard privado.
- Todo flashcard criado fica disponível conforme a regra pública do sistema.

---

## 4. Regra de propriedade para edição e exclusão de flashcards

- [x] Registrar com clareza o autor do flashcard e usar esse vínculo nas permissões de alteração.
- [x] Garantir que um `monitor` só possa editar ou excluir flashcards criados por ele mesmo.
- [x] Garantir que um `monitor` não possa editar ou excluir flashcards criados por outro `monitor`.
- [x] Garantir que um `monitor` não possa editar ou excluir flashcards criados por `admin`.
- [x] Garantir que `admin` possa editar e excluir flashcards de qualquer autor.
- [x] Confirmar explicitamente a regra de `develop`: se herda permissão total de `admin` ou se seguirá regra própria.

### Critério de aceite

- O backend bloqueia alterações indevidas mesmo que a requisição seja feita manualmente.
- O frontend esconde ou desabilita ações que o usuário não pode executar.
- A regra de permissão é consistente entre listagem, detalhe, edição e exclusão.

---

## 5. Página `Meus decks`

- [x] Alterar a primeira página `Meus decks` para exibir todos os decks disponíveis ao aluno.
- [x] Incluir decks privados do próprio aluno.
- [x] Incluir decks públicos disponíveis para esse aluno.
- [x] Revisar filtros, contadores e textos da tela para refletir que a página mistura privados e públicos.

### Critério de aceite

- Um aluno vê em um único lugar seus decks privados e os decks públicos disponíveis.
- A listagem não duplica itens nem omite decks acessíveis.

---

## 6. Página de estatísticas

Status atual: discovery inicial documentado em `_docs/discovery-pagina-estatisticas.md` e MVP pessoal implementado na rota `/statistics`.

- [x] Levantar os parâmetros de negócio antes de iniciar a implementação.
- [x] Definir quais indicadores serão exibidos.
- [x] Definir o recorte por perfil: aluno, monitor, admin e develop.
- [x] Definir período, filtros e origem dos dados.
- [x] Só então detalhar backend, contratos e layout da página.

### Itens do MVP atual

- [x] Estatísticas de estudo: revisões, retenção inicial, tempo médio e atividade diária.
- [ ] Estatísticas de conteúdo: quantidade de decks, flashcards, cards e crescimento no período.
- [ ] Estatísticas administrativas: uso por usuário, uso por role, produção de conteúdo, atividade recente.
- [x] Nível de granularidade: diário no gráfico e janela de 7, 30 e 90 dias.
- [x] Regras visuais: cards-resumo, gráfico principal e bloco lateral de leitura rápida.

---

## 7. Testes de backend

- [x] Atualizar os testes de backend afetados pelas novas regras de roles, decks e flashcards.
- [x] Adicionar testes para a role `monitor`.
- [x] Adicionar testes para garantir que grupos de flashcards sejam sempre públicos.
- [x] Adicionar testes de permissão para edição e exclusão por autoria de flashcards.
- [x] Executar a suíte relevante do backend e corrigir eventuais regressões.

---

## 8. Ordem sugerida de implementação

- [x] Etapa 1: role `monitor` + guards + redirects.
- [x] Etapa 2: acesso à gestão de flashcards.
- [x] Etapa 3: flashcards sempre públicos.
- [x] Etapa 4: regra de propriedade para editar e excluir.
- [x] Etapa 5: ajuste da página `Meus decks`.
- [x] Etapa 6: discovery + MVP da página de estatísticas.
- [x] Etapa 7: atualizar e adicionar testes do backend.

---

## 9. Riscos e pontos de atenção

- [ ] Validar impactos dessas regras na navegação dinâmica e nos menus.
- [ ] Validar impactos em seeds, usuários existentes e dados já criados.
- [ ] Validar que as novas permissões não quebram fluxos atuais de `admin`, `develop` e `user`.
- [ ] Garantir que as mudanças de acesso não afetem a lógica FSRS.
- [ ] Cobrir as novas regras com testes de permissão no backend e testes de interface no frontend.
