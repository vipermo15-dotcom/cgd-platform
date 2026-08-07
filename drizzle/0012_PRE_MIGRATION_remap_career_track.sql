-- ⚠️ 반드시 0012_sweet_titania.sql 마이그레이션(db:push)보다 먼저 실행하세요.
--
-- career_guidance.careerTrack enum을 7개 값 → 5개 값(+미정)으로 재정의합니다.
-- 기존 값 중 새 enum에 없는 값이 남아있으면 이후 ALTER TABLE ... MODIFY COLUMN이
-- 실패하거나(strict mode) 데이터가 빈 문자열로 깨질 수 있습니다(non-strict mode).
-- 그래서 enum을 바꾸기 전에 기존 값을 먼저 새 값으로 옮겨둡니다.
--
-- 매핑 근거:
--   character_goods  → goods_design       (굿즈디자인, 명칭만 정리)
--   sns_marketing    → sns_content        (SNS콘텐츠제작, 명칭만 정리)
--   video_editing    → undecided          (5개 분야에 해당 없음 — 관리자가 재배정 필요)
--   ai_generation    → undecided          (5개 분야에 해당 없음 — 관리자가 재배정 필요)
--   freelancer       → undecided          (5개 분야에 해당 없음 — 관리자가 재배정 필요)
--   brand_design     → 변경 없음 (그대로 유지)
--   undecided        → 변경 없음 (그대로 유지)
--
-- video_editing / ai_generation / freelancer였던 학생은 undecided로 이동하므로,
-- 마이그레이션 이후 관리자 페이지(/admin/career-guidance)에서 실제 5개 분야 중
-- 하나로 다시 배정해주세요.

UPDATE career_guidance SET careerTrack = 'goods_design' WHERE careerTrack = 'character_goods';
UPDATE career_guidance SET careerTrack = 'sns_content'  WHERE careerTrack = 'sns_marketing';
UPDATE career_guidance SET careerTrack = 'undecided'    WHERE careerTrack IN ('video_editing', 'ai_generation', 'freelancer');

-- 실행 후 아래 쿼리로 새 enum에 없는 값이 남아있지 않은지 확인하세요 (결과가 0행이어야 정상):
-- SELECT DISTINCT careerTrack FROM career_guidance
--   WHERE careerTrack NOT IN ('editorial_design','brand_design','goods_design','content_marketing','sns_content','undecided');
