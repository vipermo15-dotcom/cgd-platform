import AppLayout from "@/components/AppLayout";
import ProgressGrid, { getStageOfWeek, TOTAL_WEEKS } from "@/components/ProgressGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { FolderOpen, Bot, FileText, Briefcase, ClipboardList, ArrowRight, Star, BookOpen, CheckCircle2, Circle, MessageSquare } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

const SCORE_LABELS: Record<string, string> = {
  branding: "브랜딩",
  sns: "SNS 콘텐츠",
  video: "영상편집",
  character: "캐릭터/일러스트",
  aiGeneration: "AI 생성",
  editing: "편집디자인",
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: profile } = trpc.user.getStudentProfile.useQuery();
  const { data: portfolios = [] } = trpc.portfolio.list.useQuery();
  const { data: analysis } = trpc.ai.getLatest.useQuery();
  const { data: applications = [] } = trpc.jobs.myApplications.useQuery();
  const { data: guidance } = trpc.guidance.getCareerGuidance.useQuery(
    { studentUserId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  const radarData = analysis?.scores
    ? Object.entries(analysis.scores as Record<string, number>).map(([key, val]) => ({
        subject: SCORE_LABELS[key] ?? key,
        score: val,
      }))
    : [];

  const statusColors: Record<string, string> = {
    "지원완료": "bg-blue-100 text-blue-700",
    "서류합격": "bg-green-100 text-green-700",
    "면접": "bg-yellow-100 text-yellow-700",
    "최종합격": "bg-emerald-100 text-emerald-700",
    "탈락": "bg-red-100 text-red-700",
  };

  const checklist = (guidance?.checklist as { done: boolean }[] | undefined) ?? [];
  const completedCount = checklist.filter((c) => c.done).length;
  const totalCount = checklist.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const doneCount = Math.round((progressPct / 100) * TOTAL_WEEKS);
  const currentStage = getStageOfWeek(Math.min(doneCount + 1, TOTAL_WEEKS));

  // 이번 주 할 일 — 미완료 준비 단계 자동 계산
  const steps = [
    { done: !!(profile?.major && (profile?.skills as any)?.length), label: "프로필·스킬 입력", desc: "전공·기술 스택을 채우면 AI 추천 정확도가 올라가요", href: "/student/profile" },
    { done: portfolios.length > 0, label: "포트폴리오 등록", desc: "작품을 올려 역량을 보여주세요", href: "/student/portfolio" },
    { done: !!analysis, label: "AI 역량 분석 실행", desc: "내 강점·약점·추천 스킬을 확인해요", href: "/student/ai-analysis" },
    { done: applications.length > 0, label: "채용공고 지원", desc: "희망기업 매칭에서 맞춤 공고를 찾아보세요", href: "/student/job-matching" },
  ];
  const todo = steps.filter((s) => !s.done);

  const statusLine =
    profile?.employmentStatus === "취업확정"
      ? "취업을 확정하셨어요"
      : todo.length === 0
        ? "이번 주 할 일을 모두 마쳤어요"
        : `이번 주 할 일 ${todo.length}개가 남아 있어요`;

  return (
    <AppLayout title="홈">
      <div className="max-w-[1180px] mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* 인사 + 이번 주 상태 */}
        <div>
          <h2 className="text-xl font-bold text-foreground">{user?.name}님, 안녕하세요</h2>
          <p className="text-sm text-muted-foreground mt-1">{statusLine}</p>
          {profile?.employmentStatus && (
            <Badge className={`mt-2 ${statusColors[profile.employmentStatus] ?? "bg-secondary text-secondary-foreground"}`}>
              {profile.employmentStatus}
            </Badge>
          )}
        </div>

        {/* 전체 진도 카드 */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-bold text-foreground tabular-nums">{progressPct}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentStage.label} · {completedCount}/{totalCount} 항목 완료
                </p>
              </div>
              <Link href="/student/career-progress">
                <Button variant="outline" size="sm" className="gap-1.5">
                  내 진도 자세히 보기
                  <ArrowRight size={14} strokeWidth={1.75} />
                </Button>
              </Link>
            </div>
            <ProgressGrid doneCount={doneCount} compact />
          </CardContent>
        </Card>

        {/* 이번 주 할 일 · 학과장 코멘트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList size={18} strokeWidth={1.75} className="text-primary" />
                이번 주 할 일
                <Badge variant="secondary" className="ml-1 font-normal">{steps.length - todo.length}/{steps.length} 완료</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todo.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-foreground py-2">
                  <CheckCircle2 size={18} strokeWidth={1.75} /> 준비 단계를 모두 마쳤어요. 지원 현황을 관리해보세요.
                </div>
              ) : (
                todo.map((s) => (
                  <Link key={s.href} href={s.href}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer">
                      <Circle size={18} strokeWidth={1.75} className="text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{s.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.desc}</p>
                      </div>
                      <ArrowRight size={16} strokeWidth={1.75} className="text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare size={18} strokeWidth={1.75} className="text-primary" />
                상담
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guidance?.guidanceNote ? (
                <div className="space-y-3">
                  <p className="text-sm text-foreground">{guidance.guidanceNote}</p>
                  <p className="text-xs text-muted-foreground">학과장 코멘트</p>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center gap-3 text-muted-foreground text-center">
                  <p className="text-sm">아직 등록된 상담 코멘트가 없어요</p>
                </div>
              )}
              <Link href="/student/ai-agents">
                <Button variant="outline" size="sm" className="gap-1.5 mt-3 w-full">
                  AI 진로상담 시작하기
                  <ArrowRight size={14} strokeWidth={1.75} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "포트폴리오", value: `${portfolios.length}건`, icon: <FolderOpen size={18} strokeWidth={1.75} />, href: "/student/portfolio" },
            { label: "AI 종합점수", value: analysis ? `${analysis.overallScore}점` : "미분석", icon: <Bot size={18} strokeWidth={1.75} />, href: "/student/ai-analysis" },
            { label: "지원 현황", value: `${applications.length}건`, icon: <ClipboardList size={18} strokeWidth={1.75} />, href: "/student/applications" },
            { label: "최종합격", value: `${applications.filter((a: any) => a.application.status === "최종합격").length}건`, icon: <Star size={18} strokeWidth={1.75} />, href: "/student/applications" },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="text-muted-foreground mb-2">{stat.icon}</div>
                  <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Radar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot size={18} strokeWidth={1.75} className="text-primary" />
                AI 역량 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <Radar name="역량" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Bot size={32} strokeWidth={1.75} className="opacity-30" />
                  <p className="text-sm">아직 AI 분석을 진행하지 않았어요</p>
                  <Link href="/student/ai-analysis">
                    <Button size="sm" variant="outline">분석 시작</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent applications */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase size={18} strokeWidth={1.75} className="text-primary" />
                  최근 지원 현황
                </CardTitle>
                <Link href="/student/applications">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    전체 보기 <ArrowRight size={14} strokeWidth={1.75} />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Briefcase size={32} strokeWidth={1.75} className="opacity-30" />
                  <p className="text-sm">아직 지원한 공고가 없어요</p>
                  <Link href="/student/jobs">
                    <Button size="sm" variant="outline">채용공고 보기</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 4).map((a: any) => (
                    <div key={a.application.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.posting.title}</p>
                        <p className="text-xs text-muted-foreground">{a.company?.companyName ?? "회사명 없음"}</p>
                      </div>
                      <Badge className={`ml-2 text-xs ${statusColors[a.application.status] ?? ""}`}>
                        {a.application.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">빠른 메뉴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { href: "/student/portfolio", icon: <FolderOpen size={20} strokeWidth={1.75} />, label: "포트폴리오 추가" },
                { href: "/student/ai-analysis", icon: <Bot size={20} strokeWidth={1.75} />, label: "AI 역량 분석" },
                { href: "/student/cover-letter", icon: <FileText size={20} strokeWidth={1.75} />, label: "자기소개서 작성" },
                { href: "/student/jobs", icon: <Briefcase size={20} strokeWidth={1.75} />, label: "채용공고 탐색" },
                { href: "/student/documents", icon: <BookOpen size={20} strokeWidth={1.75} />, label: "서류 등록 센터" },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <button className="w-full p-4 rounded-xl bg-muted text-foreground flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
                    {action.icon}
                    <span className="text-xs font-medium">{action.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
