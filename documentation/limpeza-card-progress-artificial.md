# Limpeza de Card Progress Artificial

## Objetivo

- Auditar e limpar linhas antigas de `tb_card_progress` que tenham sido criadas artificialmente pela versao anterior da importacao Brainscape.
- O alvo desta limpeza sao progressos de cards importados que nunca foram estudados de verdade.
- O procedimento foi desenhado para priorizar seguranca operacional: primeiro auditar, depois simular a remocao, e so por ultimo efetivar o `DELETE`.

## Quando usar

- Quando a base ja recebeu uma execucao antiga de `npm run migration` que ainda chamava a versao anterior da `brainscapeImport.migration.ts`.
- Quando voce quer remover apenas progresso artificial, preservando reviews reais e progresso efetivamente usado.

## Quando nao usar

- Quando a importacao Brainscape ja foi executada apenas com a migration corrigida.
- Quando voce nao consegue confirmar qual `BRAINSCAPE_IMPORT_TAG` foi usado na carga antiga.
- Quando existe suspeita de que usuarios chegaram a estudar cards importados antes da correcao e voce ainda nao auditou a amostra alvo.

## Pre-requisitos

- Ter acesso ao banco com permissao para `SELECT`, `CREATE TEMPORARY TABLE`, `DELETE`, `START TRANSACTION`, `ROLLBACK` e `COMMIT`.
- Saber qual tag de importacao Brainscape foi usada na carga que gerou os registros artificiais.
- Executar o procedimento preferencialmente em homologacao antes de repetir em producao.
- Garantir uma janela curta de manutencao logica, evitando concorrencia de jobs de estudo enquanto a limpeza e auditada.

## Como identificar a tag correta

- Verifique o valor antigo de `BRAINSCAPE_IMPORT_TAG` usado na importacao.
- Se necessario, consulte `tb_packages.description` e `tb_decks.description`, onde a importacao grava o marcador no formato `Marcador: <tag>.`.
- Se houver mais de uma importacao historica, execute o procedimento separadamente para cada tag.

## Criterios usados pelo script

- O progresso pertence a catalogo importado do Brainscape identificado por `BRAINSCAPE_IMPORT_TAG`.
- Nao existe nenhum registro correspondente em `tb_review_logs`.
- O estado FSRS ainda esta nos valores padrao de um card nunca estudado.
- O progresso nao esta suspenso, enterrado ou marcado como deletado.

## Heuristica de seguranca adotada

- O script exige ausencia total de review log para o progresso alvo.
- O script exige que os campos de agenda FSRS ainda estejam no estado inicial.
- O script evita remover linhas que ja passaram por `suspend`, `bury` ou `delete` logico.
- Isso reduz o risco de apagar progresso real, mas nao substitui a revisao manual da amostra retornada.

## Arquivo SQL

- Script: [sql-auditoria-limpeza-card-progress-artificial.sql](sql-auditoria-limpeza-card-progress-artificial.sql)

## Fluxo recomendado

1. Identifique a tag correta da importacao.
2. Ajuste `@brainscape_tag` no topo do script.
3. Rode apenas as consultas de auditoria e revise a contagem total.
4. Revise a amostra detalhada retornada pelo script.
5. Execute o bloco transacional mantendo `ROLLBACK` no final.
6. Confirme se a quantidade apagada na transacao bate com a auditoria inicial.
7. Rode novamente as consultas de auditoria para verificar se o conjunto alvo ficou vazio.
8. So depois substitua `ROLLBACK` por `COMMIT` e repita a execucao final.

## Passo a passo operacional

1. Ajuste a variavel `@brainscape_tag` no topo do script para o marcador realmente usado na importacao.
2. Execute primeiro o bloco que cria a tabela temporaria `tmp_artificial_card_progress`.
3. Rode a consulta `SELECT COUNT(*) AS total_candidatos ...` e registre o volume esperado.
4. Rode a consulta de amostra detalhada e valide manualmente alguns `progress_id`, `deck_id`, `package_id` e `card_uuid`.
5. Verifique se os registros realmente pertencem ao import Brainscape certo e se nao houve estudo real sobre eles.
6. Inicie a transacao e execute o `DELETE` mantendo o `ROLLBACK` atual do script.
7. Confira o `ROW_COUNT()` retornado pela transacao simulada.
8. Se o volume removido estiver coerente, encerre a sessao de teste e reexecute o script trocando `ROLLBACK` por `COMMIT`.
9. Depois do `COMMIT`, rode novamente a auditoria para confirmar que o conjunto alvo foi eliminado.

## Checklist de validacao antes do COMMIT

- A tag em `@brainscape_tag` confere exatamente com a carga antiga.
- A contagem de candidatos parece plausivel para o periodo da importacao afetada.
- A amostra auditada mostra apenas cards Brainscape ainda intocados.
- Nao ha `tb_review_logs` associados aos progressos alvo.
- O `ROW_COUNT()` da simulacao bate com a contagem inicial.

## O que revisar na amostra

- `package_name` e `deck_name` pertencem ao pacote importado esperado.
- `progress_id` e `deck_card_id` apontam para cards plausivelmente nunca estudados.
- `state`, `reps`, `lapses` e `last_review` continuam no estado inicial.
- `created_at` faz sentido com a janela da migration antiga.

## Estrategia de rollback

- O script ja termina com `ROLLBACK` por padrao para a primeira execucao.
- Se voce ainda estiver inseguro, repita a simulacao quantas vezes for necessario antes de efetivar.
- Se decidir efetivar, prefira capturar um backup logico dos `progress_id` alvo antes do `COMMIT`.

## Pos-validacao

- Reexecute as consultas de auditoria para confirmar `total_candidatos = 0` para a tag tratada.
- Rode uma consulta simples em `tb_review_logs` para garantir que nenhum review ficou orfao.
- Se houver observabilidade disponivel, acompanhe erros de leitura de estudo nas horas seguintes.

## Observacoes

- O script foi pensado para limpeza conservadora, nao agressiva.
- Se houver revisao real (`tb_review_logs`), a linha nao entra no alvo.
- Se a importacao usou outro marcador, o filtro por tag precisa ser ajustado.
- Se voce quiser, antes do `DELETE` e possivel copiar os ids alvo para uma tabela de backup manual.
- O script foi escrito para MySQL e usa tabela temporaria para congelar o conjunto alvo da execucao.