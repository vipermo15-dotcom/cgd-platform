import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

// ─── 역할별 매뉴얼 콘텐츠 ─────────────────────────────────────────────────────

const MANUALS: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  admin: {
    title: "관리자(학과장) 매뉴얼",
    sections: [
      {
        heading: "1. 시스템 개요",
        body: "CGD 취업지원 플랫폼은 서울시기술교육원 컴퓨터그래픽디자인과 재학생의 취업 준비를 돕는 통합 시스템입니다. 학과장은 학생 관리, 피드백 작성, 통계 확인, HRD-Net 보고서 출력 등의 기능을 사용할 수 있습니다.",
      },
      {
        heading: "2. 로그인 및 역할 설정",
        body: "플랫폼에 처음 접속하면 Manus 계정으로 로그인 후 역할 선택 화면이 나타납니다. '학과장(교수)'을 선택하고 소속 정보를 입력하면 학과장 대시보드로 이동합니다.",
      },
      {
        heading: "3. 대시보드 사용법",
        body: "대시보드에서는 취업률, 재학생 수, 포트폴리오 등록 수, 이번 달 취업 확정 수를 한눈에 확인할 수 있습니다. 월별 취업률 차트와 직군별 분포 차트도 제공됩니다.",
      },
      {
        heading: "4. 학생 관리",
        body: "학생 관리 메뉴에서 재학생 목록을 검색·필터링할 수 있습니다. 학생 이름 클릭 시 상세 페이지로 이동하며, 포트폴리오 열람 및 별점·텍스트 피드백을 작성할 수 있습니다. 피드백 작성 시 해당 학생에게 자동 알림이 발송됩니다.",
      },
      {
        heading: "5. HRD-Net 보고서 출력",
        body: "통계 메뉴 → '보고서 다운로드' 버튼을 클릭하면 Excel(.xlsx) 또는 PDF 형식으로 HRD-Net 제출용 보고서를 다운로드할 수 있습니다. Excel 파일은 취업현황, 월별통계, 요약 3개 시트로 구성됩니다.",
      },
      {
        heading: "6. 주요 알림 이벤트",
        body: "학생이 취업을 확정하거나 기업이 면접을 요청하면 상단 벨 아이콘에 알림이 표시됩니다. 알림 클릭 시 해당 학생 상세 페이지로 이동합니다.",
      },
      {
        heading: "7. 문의 및 지원",
        body: "시스템 오류나 문의사항은 관리자 패널의 '관리자에게 문의' 기능을 이용하거나 시스템 담당자에게 연락하시기 바랍니다.",
      },
    ],
  },
  student: {
    title: "교육생(재학생) 매뉴얼",
    sections: [
      {
        heading: "1. 시스템 개요",
        body: "CGD 취업지원 플랫폼은 여러분의 취업 준비를 AI로 지원하는 통합 시스템입니다. 포트폴리오 관리, AI 역량 분석, 자기소개서 생성, 채용공고 탐색 및 지원까지 하나의 플랫폼에서 처리할 수 있습니다.",
      },
      {
        heading: "2. 로그인 및 프로필 설정",
        body: "Manus 계정으로 로그인 후 '교육생' 역할을 선택합니다. 내 프로필 메뉴에서 학번, 전공 분야, 기술 스택, 희망 직무를 입력하면 AI 추천 정확도가 높아집니다.",
      },
      {
        heading: "3. 포트폴리오 관리",
        body: "포트폴리오 메뉴에서 작품을 등록할 수 있습니다. 이미지 파일, 영상 파일, YouTube URL을 지원합니다. 카테고리(브랜딩/UI-UX/영상/일러스트 등)와 태그를 설정하고, 공개/비공개를 선택할 수 있습니다. 공개 설정 시 /portfolio/{나의슬러그} URL로 외부 공유가 가능합니다.",
      },
      {
        heading: "4. AI 역량 분석",
        body: "AI 역량 분석 메뉴에서 '분석 시작' 버튼을 클릭하면 등록된 포트폴리오를 기반으로 AI가 분야별 역량 점수(0~100점), 강점, 약점, 추천 스킬을 분석합니다. 결과는 레이더 차트로 시각화됩니다.",
      },
      {
        heading: "5. AI 자기소개서 생성",
        body: "자기소개서 메뉴에서 지원할 공고를 선택하거나 직접 직무 정보를 입력하면 AI가 자기소개서 초안을 생성합니다. 직무별 예시 템플릿을 참고하여 내용을 수정·저장할 수 있으며, 실시간 글자수가 표시됩니다.",
      },
      {
        heading: "6. 채용공고 탐색 및 지원",
        body: "채용공고 메뉴에서 분야·고용형태로 필터링하거나 검색할 수 있습니다. 북마크 기능으로 관심 공고를 저장하고, '지원하기' 버튼으로 포트폴리오를 첨부하여 지원할 수 있습니다.",
      },
      {
        heading: "7. 지원 현황 확인",
        body: "지원 현황 메뉴에서 지원완료 → 서류합격 → 면접 → 최종합격/탈락 단계를 실시간으로 확인할 수 있습니다. 상태 변경 시 알림이 발송됩니다.",
      },
      {
        heading: "8. 공개 포트폴리오 공유",
        body: "공개 포트폴리오 URL을 링크 복사 버튼으로 클립보드에 복사하거나 카카오톡, 트위터, LinkedIn 등 SNS로 직접 공유할 수 있습니다. 취업 랜딩페이지(/resume/{나의슬러그})를 통해 이력서와 자기소개서를 함께 공개할 수도 있습니다.",
      },
    ],
  },
  training: {
    title: "공동훈련센터 매뉴얼",
    sections: [
      {
        heading: "1. 시스템 개요",
        body: "CGD 취업지원 플랫폼의 공동훈련센터 포털은 산학협력 기업 관리, AI 기업-학생 매칭, 취업 연계 통계 확인 기능을 제공합니다.",
      },
      {
        heading: "2. 로그인 및 역할 설정",
        body: "Manus 계정으로 로그인 후 '공동훈련센터' 역할을 선택합니다. 소속 센터명과 담당자 정보를 입력하면 공동훈련센터 대시보드로 이동합니다.",
      },
      {
        heading: "3. 대시보드 사용법",
        body: "대시보드에서 취업 확정 학생 수, 전체 학생 수, 취업률, 총 포트폴리오 수를 확인할 수 있습니다. 협력기업 목록과 최근 매칭 현황도 한눈에 볼 수 있습니다.",
      },
      {
        heading: "4. 협력기업 관리",
        body: "협력기업 메뉴에서 산학협력 기업을 등록·관리할 수 있습니다. 기업명, 업종, 담당자 연락처, 비고를 입력하여 등록하고, 기업별 채용 현황을 추적합니다.",
      },
      {
        heading: "5. AI 기업-학생 매칭",
        body: "AI 매칭 메뉴에서 협력기업의 요구 스킬과 학생의 AI 역량 분석 결과를 비교하여 최적의 매칭 후보를 자동으로 추천합니다. 매칭 결과를 검토하고 면접 연결을 진행할 수 있습니다.",
      },
      {
        heading: "6. 취업 연계 통계",
        body: "통계 메뉴에서 월별 취업 연계 현황, 기업별 채용 인원, 직군별 분포를 확인할 수 있습니다. 보고서는 Excel 또는 PDF로 다운로드 가능합니다.",
      },
      {
        heading: "7. 알림 및 커뮤니케이션",
        body: "학생이 취업을 확정하거나 기업이 면접을 요청하면 상단 벨 아이콘에 알림이 표시됩니다. 알림을 클릭하면 해당 매칭 상세 페이지로 이동합니다.",
      },
    ],
  },
};

// ─── HTML → PDF 생성 헬퍼 ─────────────────────────────────────────────────────

function buildManualHtml(role: string): string {
  const manual = MANUALS[role];
  if (!manual) throw new Error("Unknown role");

  const sectionsHtml = manual.sections
    .map(
      (s) => `
      <div class="section">
        <h2>${s.heading}</h2>
        <p>${s.body}</p>
      </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
    font-size: 13px;
    line-height: 1.8;
    color: #1a1a2e;
    background: #fff;
    padding: 40px 48px;
  }
  .cover {
    text-align: center;
    padding: 60px 0 48px;
    border-bottom: 3px solid #2563eb;
    margin-bottom: 40px;
  }
  .cover .badge {
    display: inline-block;
    background: #eff6ff;
    color: #2563eb;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
    margin-bottom: 16px;
    letter-spacing: 0.5px;
  }
  .cover h1 {
    font-size: 26px;
    font-weight: 700;
    color: #1e3a8a;
    margin-bottom: 8px;
  }
  .cover .subtitle {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 4px;
  }
  .cover .date {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 16px;
  }
  .toc {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 36px;
  }
  .toc h3 { font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 10px; }
  .toc ul { list-style: none; padding: 0; }
  .toc li { font-size: 12px; color: #64748b; padding: 3px 0; }
  .toc li::before { content: "▸ "; color: #2563eb; }
  .section {
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f1f5f9;
  }
  .section:last-child { border-bottom: none; }
  .section h2 {
    font-size: 15px;
    font-weight: 700;
    color: #1e3a8a;
    margin-bottom: 10px;
    padding-left: 10px;
    border-left: 3px solid #2563eb;
  }
  .section p {
    font-size: 13px;
    color: #374151;
    line-height: 1.9;
    padding-left: 13px;
  }
  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 11px;
    color: #94a3b8;
  }
</style>
</head>
<body>
  <div class="cover">
    <div class="badge">CGD 취업지원 플랫폼</div>
    <h1>${manual.title}</h1>
    <div class="subtitle">서울시기술교육원 컴퓨터그래픽디자인과</div>
    <div class="date">발행일: ${new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</div>
  </div>
  <div class="toc">
    <h3>목차</h3>
    <ul>
      ${manual.sections.map((s) => `<li>${s.heading}</li>`).join("\n      ")}
    </ul>
  </div>
  ${sectionsHtml}
  <div class="footer">
    CGD 취업지원 플랫폼 &copy; ${new Date().getFullYear()} 서울시기술교육원 컴퓨터그래픽디자인과 · 무단 배포 금지
  </div>
</body>
</html>`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const manualRouter = router({
  /** 역할별 매뉴얼 HTML 반환 (클라이언트에서 인쇄/PDF 저장) */
  getManualHtml: publicProcedure
    .input(z.object({ role: z.enum(["admin", "student", "training"]) }))
    .query(({ input }) => {
      return { html: buildManualHtml(input.role) };
    }),

  /** 매뉴얼 메타 정보 (제목 목록) */
  listManuals: publicProcedure.query(() => {
    return [
      { role: "admin", title: "관리자(학과장) 매뉴얼", description: "학생 관리, 피드백, HRD-Net 보고서 출력 안내" },
      { role: "student", title: "교육생(재학생) 매뉴얼", description: "포트폴리오, AI 분석, 자기소개서, 채용 지원 안내" },
      { role: "training", title: "공동훈련센터 매뉴얼", description: "협력기업 관리, AI 매칭, 통계 보고서 안내" },
    ];
  }),
});
