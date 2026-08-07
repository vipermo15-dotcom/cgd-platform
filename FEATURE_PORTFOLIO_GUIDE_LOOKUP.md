# 기능 브랜치: 포트폴리오 가이드 비로그인 조회 + 실명 로스터 DB 이관

> 브랜치: `feature/portfolio-guide-lookup` (main에 아직 merge 안 됨)
> 이 문서는 DEPLOY-MANIFEST.md 형식에 맞춰, main에 merge하고 다음 Manus 배포에 포함시킬 때
> 그대로 복사해 넣을 수 있도록 작성했습니다.

## 배경

포트폴리오 실전반 자료(`cgd-portfolio-upgrade` 저장소, 편집/브랜드/굿즈/콘텐츠마케팅/SNS 5개 분야
실무가이드)를 교육생이 로그인 없이도 자기 분야에 맞는 가이드로 바로 찾아갈 수 있게 하는 기능입니다.
작업 중 `client/src/pages/admin/CareerGuidance.tsx`에 학생 19명의 실명이 소스코드에 그대로
하드코딩되어 있던 것을 발견해(공개 저장소 개인정보 노출), 이번에 함께 DB 기반으로 이관했습니다.

## 변경 사항

1. **개인정보 노출 수정** — `todo.md`의 실제 학생 개인정보(이름·생년월일·주소·전화번호·이메일) 삭제,
   `CareerGuidance.tsx`에 하드코딩되어 있던 19명 실명 로스터 + 문서 경로 매핑 제거.
2. **`career_guidance.careerTrack` enum 재정의** — 기존 7개 값(brand_design, sns_marketing,
   video_editing, character_goods, ai_generation, freelancer, undecided) →
   **5개 취업분야 + 미정**(editorial_design, brand_design, goods_design, content_marketing,
   sns_content, undecided)으로 변경. 포트폴리오 실전반 5개 분야 체계와 맞췄습니다.
3. **`career_guidance.guidanceDocs` 필드 추가** — 학생별 진로지도/포트폴리오가이드 문서 링크를
   이제 소스코드가 아니라 DB에 `{name, url}[]` 형태로 저장합니다. 관리자 페이지의 "진로지도 자료" 탭에서
   직접 추가·삭제할 수 있습니다.
4. **공개 조회 API 신설** — `guidance.lookupPortfolioGuide` (publicProcedure, 로그인 불필요).
   이름 + 전화번호 뒷자리 4자리를 입력하면 해당 학생의 취업분야와 그 분야의
   `cgd-portfolio-upgrade` 가이드 링크를 반환합니다. 동일 이름에 대해 15분당 8회로
   rate limit을 걸어 브루트포스 시도를 방지합니다(`portfolio_guide_lookups` 테이블에 기록).
5. **공개 페이지 신설** — `/portfolio-guide` (`PortfolioGuideLookup.tsx`). 홈 화면에도
   "내 포트폴리오 가이드 찾기" 버튼을 추가했습니다.

## ⚠️ DB 마이그레이션 필요 (이번엔 UI 전용 배포가 아닙니다)

**`pnpm db:push` 실행 전에 반드시 `drizzle/0012_PRE_MIGRATION_remap_career_track.sql`을 먼저
실행하세요.** 기존 `career_guidance` 레코드 중 새 enum에 없는 값(video_editing, ai_generation,
freelancer 등)이 남아있으면 그 다음 `ALTER TABLE ... MODIFY COLUMN`이 실패하거나 데이터가 깨질 수
있습니다. 순서:

```
1) drizzle/0012_PRE_MIGRATION_remap_career_track.sql 실행 (기존 값 재매핑)
2) pnpm db:push  (drizzle-kit generate && drizzle-kit migrate → 0012_sweet_titania.sql 적용)
```

마이그레이션 후, 기존에 video_editing/ai_generation/freelancer였던 학생은 `undecided`로
이동합니다 — `/admin/career-guidance`에서 실제 5개 분야 중 하나로 재배정해주세요(DB에 5명분
데이터가 있다고 하셨으니 많아야 몇 명입니다).

## Manus에 보낼 배포 프롬프트 초안 (main merge 후 사용)

```
GitHub 저장소 vipermo15-dotcom/cgd-platform 의 main 브랜치 최신 코드를 가져와서
빌드·배포해줘. 이번엔 DB 마이그레이션이 있어 — 아래 순서를 반드시 지켜줘.

1. drizzle/0012_PRE_MIGRATION_remap_career_track.sql 을 먼저 DB에 실행 (career_guidance
   기존 값 재매핑, ALTER 전에 반드시 선행)
2. pnpm db:push 로 나머지 마이그레이션(0012_sweet_titania.sql) 적용
   — career_guidance.careerTrack enum을 5개 취업분야로 재정의, guidanceDocs 필드 추가,
   portfolio_guide_lookups 테이블 신규 생성
3. pnpm build → 배포

[이번 배포 내용]
- 개인정보 노출 수정: 학생 실명 로스터를 소스코드에서 제거하고 DB(career_guidance.guidanceDocs)로 이관
- 공개 페이지 /portfolio-guide 신설: 이름+전화번호 뒷자리로 비로그인 학생도 본인 취업분야 포트폴리오
  가이드 링크를 받을 수 있음. 홈 화면에 진입 버튼 추가
- 관리자 페이지(/admin/career-guidance) "진로지도 자료" 탭에서 학생별 문서 링크를 직접 등록/삭제하도록 변경

[검증 완료 상태]
- tsc --noEmit 0 errors
- vitest run 35/36 통과 (1건은 기존부터 있던 무관한 리포트 다운로드 타임아웃 테스트, 이번 변경과 무관)
- vite build 성공

[배포 후 확인 체크리스트]
- 마이그레이션 후 /admin/career-guidance에서 기존 학생들의 취업분야가 잘 재매핑됐는지 확인,
  undecided로 이동한 학생은 5개 분야 중 하나로 재배정
- 홈 화면(/)에서 "내 포트폴리오 가이드 찾기" 버튼 → /portfolio-guide 접속 확인
- 실제 학생 1명의 이름+전화번호 뒷자리로 조회해서 정상적으로 분야가 뜨고 가이드 링크가 열리는지 확인
- 잘못된 전화번호 뒷자리로 5~6회 연속 조회 시 rate limit(TOO_MANY_REQUESTS) 메시지가 뜨는지 확인
- /admin/career-guidance "진로지도 자료" 탭에서 문서 추가/삭제 후 저장이 잘 되는지 확인
```

> ⚠️ cgd-ai-career-platform 저장소는 이 배포와 별개로, 아직 private 전환이 필요한 상태라면
> 먼저 처리해주세요 (실제 학생 진로지도 문서 원본이 들어있는 저장소입니다).
