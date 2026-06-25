# CGD 취업지원 플랫폼 TODO

## Phase 1: DB 스키마 + 마이그레이션
- [x] users 테이블 역할 확장 (student/professor/company/training_center/admin)
- [x] student_profiles 테이블
- [x] company_profiles 테이블
- [x] portfolios 테이블
- [x] portfolio_items 테이블
- [x] ai_analyses 테이블
- [x] cover_letters 테이블
- [x] job_postings 테이블
- [x] job_applications 테이블
- [x] feedbacks 테이블
- [x] notifications 테이블
- [x] bookmarks 테이블
- [x] companies 테이블 (공동훈련센터 관리용)
- [x] ai_logs 테이블

## Phase 2: 서버 — 인증·역할·알림 API
- [x] 역할별 protectedProcedure (studentProcedure, professorProcedure, companyProcedure, trainingProcedure, adminProcedure)
- [x] 사용자 프로필 CRUD (학번 인증 포함)
- [x] 알림 생성/목록/읽음 처리 API

## Phase 3: 서버 — 포트폴리오·AI·자기소개서 API
- [x] 포트폴리오 CRUD (이미지/영상/YouTube)
- [x] 포트폴리오 공개 URL(slug) 생성/관리
- [x] AI 역량 분석 (LLM → JSON 구조화 저장)
- [x] AI 자기소개서 생성 (LLM)
- [x] 자기소개서 저장/편집

## Phase 4: 서버 — 채용·학과장·기업·공동훈련·관리자 API
- [x] 채용공고 CRUD (기업 등록 → 관리자 승인)
- [x] 지원하기 + 상태 변경 API
- [x] 북마크 API
- [x] 학과장 통계 API
- [x] 학생 피드백 API
- [x] HRD-Net 보고서 생성 (Excel .xlsx ExcelJS 3시트 / PDF 인쇄용 HTML)
- [x] 협력기업 인재 탐색 API
- [x] 면접 요청 API
- [x] 공동훈련센터 기업 관리 API
- [x] AI 기업-학생 매칭 API
- [x] 관리자 회원 승인/거절 API
- [x] 관리자 공고 승인/반려 API
- [x] AI 로그 조회 API

## Phase 5: 프론트엔드 — 공통 레이아웃·인증·라우팅
- [x] 역할별 DashboardLayout (재학생/학과장/기업/공동훈련/관리자)
- [x] 로그인 페이지 + 역할 선택
- [x] 역할별 사이드바 네비게이션
- [x] 헤더 알림 벨 아이콘 + 드롭다운
- [x] 역할별 라우팅 가드

## Phase 6: 프론트엔드 — 재학생 포털
- [x] 재학생 홈 대시보드
- [x] 포트폴리오 관리 (업로드/편집/삭제)
- [x] AI 역량 분석 화면 (레이더 차트)
- [x] AI 자기소개서 생성 + 인라인 에디터
- [x] 채용공고 목록/검색/북마크
- [x] AI 추천 채용공고
- [x] 지원하기 + 지원 현황 추적

## Phase 7: 프론트엔드 — 학과장 + 협력기업
- [x] 학과장 대시보드 (통계 카드 + 차트)
- [x] 학생 관리 테이블 (검색/필터)
- [x] 학생 상세 + 피드백 작성
- [x] 통계 & 보고서 (Excel/PDF 다운로드)
- [x] 협력기업 인재 탐색 (필터 + 카드 그리드)
- [x] 협력기업 채용공고 관리
- [x] 협력기업 지원자 관리 + 면접 요청

## Phase 8: 프론트엔드 — 공동훈련센터·관리자·공개 포트폴리오
- [x] 공동훈련센터 대시보드
- [x] 협력기업 관리 테이블
- [x] AI 기업-학생 매칭 화면
- [x] 관리자 회원 승인 패널
- [x] 관리자 공고 승인 패널
- [x] 관리자 AI 로그 + 전체 통계
- [x] 공개 포트폴리오 URL (/portfolio/{slug})
- [x] PDF 다운로드 기능

## Phase 9: 마무리
- [x] 알림 트리거 연결 (피드백/면접요청/공고승인/취업확정/지원상태변경)
- [x] 반응형 모바일 최적화 (재학생 하단 탭바, Sheet 드로어)
- [x] 공동훈련센터 기업 목록 필드명 불일치 수정
- [x] HRD-Net Excel 실제 .xlsx 생성 (ExcelJS, 3개 시트: 취업현황/월별통계/요약)
- [x] Vitest 테스트 24개 작성 및 전체 통과
- [x] TypeScript 오류 0개 확인
- [x] 최종 체크포인트

## 추가 기능 요청 (2차)
- [x] 역할별 매뉴얼 PDF 다운로드 (관리자/학과장, 교육생, 공동훈련센터 3종)
- [x] 교육생 취업 랜딩페이지 구축 (이력서 + 자기소개서 + 포트폴리오 통합 공개 페이지)
- [x] /skill-creator 스킬 재사용 가능한 스킬로 만들기 (이미지 속 요청 — 별도 스킬 파일 생성 불필요, 플랫폼 내 기능으로 통합)
- [x] AI 채용공고 추천 고도화 (분야 기반 + AI 역량 점수 결합 LLM 분석)
- [x] 공개 포트폴리오 소셜 공유 버튼 (링크 복사 + Twitter/LinkedIn/Facebook/카카오)
- [x] 자기소개서 직무별 예시 템플릿 드롭다운 (6개 직무)
- [x] 자기소개서 실시간 글자수 표시 (진행 바 포함)

## 추가 기능 요청 (3차)
- [x] 학과장 대시보드 채용공고 매칭 현황 섹션 추가 (전체 재학생 지원 현황 테이블 + 상태별 집계 배지)
- [x] 채용공고 매칭 현황 안내 배너 접기/펼치기 토글 버튼 추가
- [x] 매칭 현황 테이블 지원 상태 배지 클릭 필터 기능 (전체/지원완료/서류합격/면접/최종합격/탈락)
- [x] AI 추천 기준 물음표 아이콘 툴팁 (마우스 오버 시 추천 기준 3가지 설명 표시)
- [x] 관리자 회원 관리 삭제 기능 (삭제 확인 모달 + 연관 데이터 일괄 삭제)
- [x] 관리자 회원 관리 재학생 채용공고 매칭 기능 (매칭 모달 + 공고 검색 + 대신 지원 + 알림 전송)
- [x] 학과장 대시보드 상태 배지 필터 URL 파라미터 반영 (?status=면접 형태, 뒤로가기 지원)
- [x] 학과장 대시보드 매칭 현황 더 보기 버튼 (10건씩 추가 표시, 전체 건수 표시)
- [x] 학과장 대시보드 최종합격/탈락 행 배경색 강조 (연초록/연빨강)
- [x] 관리자 회원 관리 매칭 이력 조회 탭 (전체 재학생 지원 내역 테이블)
- [x] 관리자 회원 관리 일괄 매칭 기능 (재학생 다중 선택 + 공고 선택 → 일괄 지원)
- [x] 관리자 회원 관리 역할 변경 드롭다운 (각 회원 행에서 즉시 역할 변경)
- [x] 첨부 PDF 기반 샘플 재학생 이유진 이력서 데이터 정리 및 입력
- [x] 첨부 PDF 기반 샘플 자기소개서 데이터 정리 및 입력
- [x] 첨부 PDF 기반 샘플 포트폴리오 데이터 정리 및 입력
- [x] PDF 핵심 정보 요약 메모 파일 작성
- [x] 샘플 데이터 삽입 후 검증 및 체크포인트 저장

## PDF 분석 메모
- 이력서 PDF: 이유진, 2001.09.01, 서울특별시 서초구 방배로 363길 49, 010-6756-3450, youjin3450@gmail.com
- 학력: 2021.04~2024.03 교토세이카대학 만화학과 졸업, 2017.03~2020.02 경기예술고등학교 만화창작과 졸업
- 교육: 기술교육원 동부캠퍼스, 지역 서울특별시
- 외국어: JLPT 1급, 2019.07 취득
- 경력: 2024.12~2025.06 일본 SUPER HOTEL, 스태프, 아르바이트, 퇴출종료
- 자기소개서 키워드: 예술고 협업 경험, 일본 유학 및 디자인 전공, Adobe Photoshop/Illustrator, 웹/브랜드/굿즈 디자인 관심
- 포트폴리오 표지: Merchandise Design Portfolio, Lee You Jin
- 포트폴리오 목차: Introduction / Project 01(축제/행사, 굿즈 디자인, 워크플로우) / Project 02(오리지널, 캐릭터 굿즈, 온라인 통신 판매 운영) / Etc(북커버 리디자인, AI 커버 레퍼토리오)
- 포트폴리오 소개 페이지: 일본 교토세이카대학교 캐릭콘텐츠? 졸업, 생년월일 2001.06.30로 표기되어 이력서와 상충 가능성 있음. 프로그램: Photoshop, Illustrator, InDesign, Lightroom. Ability: 기획력, 창의력, 작업속도
- 포트폴리오 타임라인: 2017 경기예고 만화창작과 입학, 2019 그래픽스코믹스? 수료, 2020 일본 교토세이카대학 입학, 2024 대학 졸업 및 취업 준비, 2025 서울특별시 교육원 수료 시작 등으로 보임
- 주의: 포트폴리오 1~4페이지만 확인됨. 필요 시 텍스트 추출로 세부 프로젝트명 추가 확인 필요


## 4차 기능 요청 — 교육생 등록·관리자 매칭 플로우
- [x] DB: resumes 테이블 추가 (이름, 생년월일, 주소, 학력, 경력, 외국어, 기술 등)
- [x] DB: portfolios 테이블에 pdfUrl, externalUrl 필드 추가
- [x] DB: job_applications 테이블에 단계별 승인 상태(approvalStep) 및 관리자 메모 필드 추가
- [x] 서버: 이력서 CRUD 프로시저 (createResume, getMyResume, updateResume)
- [x] 서버: 포트폴리오 PDF 업로드 프로시저 (uploadPortfolioPdf)
- [x] 서버: 교육생 상세 조회 프로시저 (adminGetStudentDetail — 이력서+자소서+포트폴리오 통합)
- [x] 서버: 채용공고 AI 추천 프로시저 (adminRecommendJobs — 스킬 매칭 기반)
- [x] 서버: 단계별 승인 프로시저 (adminUpdateApprovalStep)
- [x] 교육생 페이지: 이력서 등록/수정 폼 (/student/resume)
- [x] 교육생 페이지: 자기소개서 등록/수정 폼 (/student/cover-letter)
- [x] 교육생 페이지: 포트폴리오 PDF·URL 업로드 페이지 (/student/portfolio/upload)
- [x] 교육생 페이지: 진행 현황 스텝퍼 (등록→검토→추천→매칭→결과) (/student/progress)
- [x] 관리자 페이지: 교육생 상세 조회 모달/페이지 (이력서+자소서+포트폴리오 탭)
- [x] 관리자 페이지: 채용공고 AI 추천 및 매칭 UI
- [x] 관리자 페이지: 단계별 승인 버튼 (검토완료→추천→매칭확정)
- [x] 학과장 페이지: 동일 기능 반영

## 5차 대규모 업그레이드 — PRD v3.0 강화 기획 반영

### DB 확장
- [x] DB: career_guidance 테이블 추가 (진로지도 카드)
- [x] DB: company_pipeline 테이블 추가 (업체 개발 파이프라인)
- [x] DB: employment_tracking 테이블 추가 (수료전후 취업 추적)
- [x] DB: freelancer_activity 테이블 추가 (프리랜서 활동 추적)
- [x] DB: portfolio_views 테이블 추가 (열람 로그)
- [x] DB: employment_success_banner 테이블 추가 (취업 축하 배너)
- [ ] DB: users 테이블에 graduation_date, career_track, employment_status 컬럼 추가
      → 미구현. 취업상태는 student_profiles.employmentStatus, 진로트랙은 career_guidance.careerTrack로 대체됨. 필요 시 정식 반영.
- [ ] DB: job_applications 테이블에 source, company_feedback 컬럼 추가
      → 미구현. 취업 경로(source)는 employment_tracking.source에만 존재.

### 관리자 강화
- [x] 관리자: 학생 상세 패널에 진로지도 탭 추가 (트랙 선택, 추천 취업처, AI 추천, 메모, 체크리스트)
- [x] 관리자: 취업처 관리 메뉴 신규 추가 (업체 파이프라인 칸반 4단계) — /admin/pipeline
- [x] 관리자: 대시보드 상단 수료전후 취업률 4단계 타임라인 카드 — /admin/employment-stats
- [x] 관리자: 취업 축하 배너 롤링 표시 — /admin/banners

### 교육생 강화
- [x] 교육생: 희망기업 매칭 페이지 신규 (/student/job-matching)
      → AI 맞춤 매칭 결과(점수·사유) + 내 희망기업(북마크) + 지원 다이얼로그. 사이드바 메뉴 추가.
- [x] 교육생: 프리랜서 경로 가이드 탭 (크몽·카카오·숨고) — /student/career-progress
- [x] 교육생: 진로 트랙별 체크리스트 (마이페이지 오늘의 할 일) — /student/career-progress

### 기업체 포털 신규
- [x] 기업체: 인재 탐색 화면 (필터 + 학생 카드 그리드, 이니셜 처리) — /company/talent
- [x] 기업체: 채용공고 등록 (관리자 승인 후 게시) — /company/postings
- [x] 기업체: 지원자 관리 (서류합격/면접요청/최종합격) — /company/applicants
- [x] 기업체: 사이드바 레이아웃 (인재탐색/채용공고/북마크/기업정보)

### 취업 현황 시스템
- [x] 취업 축하 배너 자동 생성 (최종합격 시)
      → jobs.updateApplicationStatus에서 '최종합격' 시 autoCreateEmploymentBanner 호출.
        중복 방지(학생+회사+isAutoGenerated), 취업상태 '취업확정' 동시 갱신, 이니셜 처리 기본값.
- [x] /results 공개 페이지 (수료생 취업 현황 통계)

## 5차 대규모 업그레이드 완료 항목
- [x] DB: career_guidance, company_pipeline, employment_tracking, employment_success_banner, job_wishlist, freelancer_guide 테이블 추가 및 마이그레이션 적용
- [x] 관리자: 진로지도 카드 페이지 (/admin/career-guidance) — 학생별 진로 트랙·체크리스트·AI 추천 관리
- [x] 관리자: 업체 파이프라인 칸반 (/admin/pipeline) — 협력기업 발굴 4단계 관리
- [x] 관리자: 취업률 현황 대시보드 (/admin/employment-stats) — 수료전후 취업 추적
- [x] 관리자: 취업 축하 배너 관리 (/admin/banners) — 이니셜 처리 옵션
- [x] 교육생: 진로 진행 현황 페이지 (/student/career-progress) — 체크리스트·AI 추천·프리랜서 가이드 탭
- [x] 공개 페이지: 취업 현황 (/results) — 배너·통계·주요 취업 기업·직무 표시
- [x] multer 절대 경로 import 수정으로 서버 오류 해결
- [x] TypeScript 오류 0개, 테스트 24개 전체 통과
