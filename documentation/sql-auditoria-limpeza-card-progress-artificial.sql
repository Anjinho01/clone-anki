-- Auditoria e limpeza conservadora de tb_card_progress artificial criado por importacao Brainscape antiga.
-- Ajuste a tag abaixo para o marcador realmente usado na importacao.

SET @brainscape_tag = 'brainscape:2026-04-25';

DROP TEMPORARY TABLE IF EXISTS tmp_artificial_card_progress;

CREATE TEMPORARY TABLE tmp_artificial_card_progress AS
SELECT cp.id
FROM tb_card_progress cp
JOIN tb_deck_cards dc
  ON dc.id = cp.deck_card_id
JOIN tb_decks d
  ON d.id = dc.deck_id
LEFT JOIN tb_packages p
  ON p.id = d.package_id
LEFT JOIN tb_review_logs rl
  ON rl.card_progress_id = cp.id
WHERE (
    p.description LIKE CONCAT('%Marcador: ', @brainscape_tag, '.%')
    OR d.description LIKE CONCAT('%Marcador: ', @brainscape_tag, '.%')
  )
  AND rl.id IS NULL
  AND cp.state = 0
  AND cp.difficulty = 0
  AND cp.stability = 0
  AND cp.retrievability = 0
  AND cp.elapsed_days = 0
  AND cp.scheduled_days = 0
  AND cp.reps = 0
  AND cp.lapses = 0
  AND cp.last_review IS NULL
  AND cp.is_suspended = FALSE
  AND cp.is_buried = FALSE
  AND cp.is_deleted = FALSE;

-- Auditoria 1: volume total candidato
SELECT COUNT(*) AS total_candidatos
FROM tmp_artificial_card_progress;

-- Auditoria 2: amostra detalhada para revisao manual
SELECT
  cp.id AS progress_id,
  cp.user_id,
  dc.id AS deck_card_id,
  d.id AS deck_id,
  d.uuid AS deck_uuid,
  d.name AS deck_name,
  p.id AS package_id,
  p.uuid AS package_uuid,
  p.name AS package_name,
  c.id AS card_id,
  c.uuid AS card_uuid,
  cp.created_at,
  cp.due,
  cp.state,
  cp.reps,
  cp.lapses
FROM tb_card_progress cp
JOIN tmp_artificial_card_progress tmp
  ON tmp.id = cp.id
JOIN tb_deck_cards dc
  ON dc.id = cp.deck_card_id
JOIN tb_decks d
  ON d.id = dc.deck_id
LEFT JOIN tb_packages p
  ON p.id = d.package_id
JOIN tb_cards c
  ON c.id = dc.card_id
ORDER BY cp.user_id, d.id, c.id
LIMIT 100;

-- Execucao segura: por padrao este script NAO persiste a remocao.
START TRANSACTION;

DELETE cp
FROM tb_card_progress cp
JOIN tmp_artificial_card_progress tmp
  ON tmp.id = cp.id;

SELECT ROW_COUNT() AS linhas_removidas_na_transacao;

-- Troque por COMMIT somente depois de validar as auditorias acima.
ROLLBACK;

DROP TEMPORARY TABLE IF EXISTS tmp_artificial_card_progress;