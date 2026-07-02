# CGD 취업지원 플랫폼 — Claude Code 인수인계

> 이 파일을 먼저 읽고 작업을 시작합니다.
> 플랫폼 URL: cgdplatform-pm7dnqip.manus.space

---

## 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 클라이언트 | CGD 서울시기술교육원 |
| 관리자 계정 | 정운우 / vipermo15@gmail.com |
| 테스트 교육생 | 이유진 / youjin3450@gmail.com |
| 스택 | React + TypeScript + tRPC + Drizzle ORM + MySQL |
| 배포 | Manus (cgdplatform-pm7dnqip.manus.space) |

---

## 오늘 완료한 작업 (2026-07-02)

### 1. 관리자 전용 교육생 프로필 수정 기능 추가

**변경 파일:**
- `server/routers/user.ts`
  - `adminGetStudentProfile` (adminProcedure query) 추가
  - `adminUpdateStudentProfile` (adminProcedure mutation) 추가
  - 수정 가능 필드: studentId, major, phone, bio, skills, certificates, employmentStatus, employedCompany

- `client/src/pages/admin/StudentDocumentsDialog.tsx`
  - `ProfileEditor` 컴포넌트 추가 (관리자 전용)
  - 스킬·자격증 태그 입력 UI
  - 취업 상태 드롭다운 (미시작/준비중/지원중/취업확정)
  - Tabs defaultValue "resume" → "profile" 변경 (프로필 탭이 첫 번째로)

### 2. 파일 업로드 제한 개선

**변경 파일:**
- `server/_core/index.ts`
  - multer fileSize: 16MB → **50MB**

- `drizzle/schema.ts`
  - `coverLetters` 테이블에 `pdfUrl: text("pdfUrl")` 컬럼 추가

- `server/routers/resume.ts`
  - `saveCoverLetter` 입력 스키마에 `pdfUrl: z.string().optional()` 추가
  - insert/update 쿼리에 pdfUrl 반영

- `client/src/pages/student/DocumentCenter.tsx`
  - 자소서 편집 폼에 PDF·DOC·DOCX 파일 첨부 UI 추가
  - 업로드 용량 안내 문구 50MB로 수정

### 3. 포트폴리오 랜딩 페이지 연동 테스트

- 이유진 계정에 외부 URL 저장 테스트 완료
- URL: https://heartfelt-sundae-a49d04.netlify.app/ (김은실 포트폴리오 — 테스트용)
- 페이지 로딩, 네비게이션, 탭 모두 정상 동작 확인

---

## 파일 업로드 현황

| 항목 | 형식 | 용량 |
|---|---|---|
| 이력서 | 폼 입력 방식 (파일 업로드 없음) | - |
| 자소서 | 텍스트 + PDF·DOC·DOCX 첨부 (선택) | 최대 50MB |
| 포트폴리오 | 이미지 / 영상 / YouTube URL / 외부 URL | 최대 50MB |

---

## 다음 작업 목록 (마누스에 전달 예정)

- [ ] DB 마이그레이션 실행 (cover_letters 테이블에 pdfUrl 컬럼 반영)
  ```
  npx drizzle-kit generate
  npx drizzle-kit migrate
  ```
- [ ] 자소서 목록 카드에 "PDF 보기" 링크 표시 (cl.pdfUrl 있을 때)
- [ ] 관리자 자소서 뷰어(StudentDocumentsDialog)에 PDF 원본 보기 링크 추가
- [ ] 영상 포트폴리오 — YouTube URL 기본 권장 안내 문구 추가

---

## 기존 TypeScript 에러 (pre-existing, 내 변경과 무관)

| 파일 | 에러 | 비고 |
|---|---|---|
| admin/Dashboard.tsx | totalEmployed 없음 | 기존 에러 |
| admin/FeedbackResults.tsx | any 타입 | 기존 에러 |
| student/AIAgents.tsx | aiRecommendations 없음 | 기존 에러 |
| server/routers/ai-agent.ts | chat 속성 없음 | 기존 에러 |

---

## 마누스 전달용 프롬프트

`/Users/jeongheejun/Desktop/mcp/` 폴더의 이전 대화에서 작성한
마누스 프롬프트 참고: 위 다음 작업 목록 4가지 항목 전달
