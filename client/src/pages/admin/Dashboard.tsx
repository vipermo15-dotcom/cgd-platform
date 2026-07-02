import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Users, Briefcase, FileText, Bot, ArrowRight, Sparkles, Trophy, Award, X, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

// ─── 버전 & 업데이트 정보 ────────────────────────────────────────────────────

const APP_VERSION = "2.7";
const ONBOARDING_KEY = `cgd-seen-v${APP_VERSION}`;

const UPDATE_LOG = [
  {
    version: "2.7",
    date: "2026-06-29",
    label: "AI 에이전트 대폭 확장",
    items: [
      "AI 포트폴리오 코치 — 강점·개선점·총점 피드백",
      "AI 포트폴리오 점수 — 100점 항목별 채점 + A~D 등급",
      "AI 자기소개서 — 채용공고 기반 4개 항목 초안 생성",
      "AI 면접 준비 — 예상 질문 5~7개 + 모범 답변",
      "AI 학습 로드맵 — 목표 직무까지 단계별 타임라인",
      "AI 취업 준비도(0~100점) — 단계별 현황 + 이번 주 할 일",
      "AI 주간 리포트 — 잘한점·보완점·다음주목표",
      "관리자 진로지도 카드 — 사전 설문 결과 탭 + 첨삭 적용 버튼",
    ],
  },
  {
    version: "2.6",
    date: "2026-06-22",
    label: "진로지도 사전 설문 + 채팅 에이전트",
    items: [
      "교육생 사전 설문 5단계 위저드 → AI 진로 분석 자동 연동",
      "진로 채팅 AI — 취업·진로 질문 대화형 상담",
      "내 진로카드 탭 — 학과장 작성 진로지도 카드 학생 열람",
    ],
  },
];

// ─── 온보딩 팝업 ─────────────────────────────────────────────────────────────

function OnboardingDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) setOpen(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setOpen(false);
  };

  const latest = UPDATE_LOG[0];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <DialogTitle className="text-base">v{latest.version} 업데이트 안내</DialogTitle>
              <p className="text-xs text-muted-foreground">{latest.date} · {latest.label}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {latest.items.map((item, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <Button onClick={handleClose} className="w-full mt-4">확인했습니다</Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── 메인 대시보드 ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: stats } = trpc.admin.getStats.useQuery();
  const [bannerDismissed, setBannerDismissed] = useState(() => !!localStorage.getItem(`cgd-banner-v${APP_VERSION}`));

  const dismissBanner = () => {
    localStorage.setItem(`cgd-banner-v${APP_VERSION}`, "1");
    setBannerDismissed(true);
  };

  return (
    <AppLayout title="관리자 대시보드">
      <OnboardingDialog />

      <div className="p-3 lg:p-6 space-y-4 lg:space-y-5">

        {/* 버전 + 업데이트 배너 */}
        {!bannerDismissed && (
          <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-primary">v{APP_VERSION} 업데이트</span>
                <Badge variant="outline" className="text-xs">{UPDATE_LOG[0].date}</Badge>
                <span className="text-sm text-muted-foreground">{UPDATE_LOG[0].label}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                AI 에이전트 13개 탭, 관리자 사전 설문 결과 탭 등 신규 기능이 추가됐습니다.
              </p>
            </div>
            <button onClick={dismissBanner} className="text-muted-foreground hover:text-foreground shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        {/* 헤더: 제목 + 버전 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">빠른 현황</h2>
            <Badge className="text-xs bg-primary/10 text-primary border-primary/20 border">v{APP_VERSION}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{UPDATE_LOG[0].date} 기준</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "전체 회원", value: stats?.totalUsers ?? 0, icon: <Users size={18} />, color: "text-blue-500", bg: "bg-blue-50", href: "/admin/users" },
            { label: "채용공고", value: stats?.totalPostings ?? 0, icon: <Briefcase size={18} />, color: "text-purple-500", bg: "bg-purple-50", href: "/admin/postings" },
            { label: "포트폴리오", value: stats?.totalPortfolios ?? 0, icon: <FileText size={18} />, color: "text-emerald-500", bg: "bg-emerald-50", href: "/admin/users" },
            { label: "AI 분석", value: stats?.totalAiAnalyses ?? 0, icon: <Bot size={18} />, color: "text-orange-500", bg: "bg-orange-50", href: "/admin/ai-logs" },
            { label: "취업 확정", value: stats?.employedStudents ?? 0, icon: <Award size={18} />, color: "text-green-500", bg: "bg-green-50", href: "/admin/employment-stats" },
            { label: "취업률", value: `${stats?.employmentRate ?? 0}%`, icon: <Trophy size={18} />, color: "text-amber-500", bg: "bg-amber-50", href: "/admin/employment-stats" },
          ].map((s) => (
            <Link key={s.label} href={s.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 ${s.color}`}>
                    {s.icon}
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 빠른 메뉴 */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">빠른 메뉴</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: "회원 관리", desc: "가입 승인 및 역할 관리", href: "/admin/users" },
              { title: "공고 승인", desc: "기업 등록 공고 검토 및 승인", href: "/admin/postings" },
              { title: "AI 자동 매칭", desc: "학생-공고 AI 자동 매칭 실행", href: "/admin/ai-matching" },
              { title: "채용공고 첨삭", desc: "교육생 첨삭 요청 검토", href: "/admin/job-coaching" },
              { title: "진로지도 카드", desc: "학생별 진로 트랙 및 체크리스트", href: "/admin/career-guidance" },
              { title: "업체 파이프라인", desc: "협력기업 개발 단계 관리", href: "/admin/pipeline" },
              { title: "취업률 현황", desc: "수료전후 취업 추적 통계", href: "/admin/employment-stats" },
              { title: "취업 축하 배너", desc: "취업 확정 학생 배너 관리", href: "/admin/banners" },
              { title: "AI 로그", desc: "AI 분석 사용량 및 토큰 모니터링", href: "/admin/ai-logs" },
            ].map((item) => (
              <Link key={item.title} href={item.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* 업데이트 히스토리 */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">업데이트 히스토리</h2>
          <div className="space-y-3">
            {UPDATE_LOG.map((log) => (
              <Card key={log.version}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="text-xs">v{log.version}</Badge>
                    <span className="text-xs text-muted-foreground">{log.date}</span>
                    <span className="text-sm font-medium">{log.label}</span>
                  </div>
                  <ul className="space-y-1">
                    {log.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="text-primary shrink-0">·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
