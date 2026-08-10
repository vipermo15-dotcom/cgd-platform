import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import ProgressGrid, { TOTAL_WEEKS, getStageOfWeek, weekState } from "@/components/ProgressGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ExternalLink,
  TrendingUp,
  BookOpen,
  Target,
  Award,
  Clock,
  ListChecks,
  FolderOpen,
  Link2,
  MessageSquare,
  Star,
  ClipboardCheck,
} from "lucide-react";

const WORKFLOW_URL =
  "https://vipermo15-dotcom.github.io/cgd-ai-career-platform/docs/portfolio-workflow.html";

const WORKFLOW_STEPS = [
  { num: 1, phase: "진로 설정", title: "취업 방향 결정 & 사전 설문", duration: "Week 1~2", color: "#e60023", tasks: ["CGD 플랫폼 사전 설문 작성", "취업 분야 1순위 결정", "희망 기업 리스트 3개 이상 조사", "진로지도 MD 파일 수령"] },
  { num: 2, phase: "서류 준비", title: "이력서 · 자소서 · 포트폴리오 초안", duration: "Week 2~4", color: "#0070d1", tasks: ["이력서 초안 작성", "자기소개서 초안 1개 이상", "포트폴리오 작업물 5개 이상 선정", "AI 역량 분석 1회 이상 실행"] },
  { num: 3, phase: "플랫폼 등록", title: "CGD 플랫폼 서류 업로드 완성", duration: "Week 3~5", color: "#7e238b", tasks: ["프로필 4항목 입력 완료", "포트폴리오 1개 이상 등록", "자기소개서 1개 이상 등록", "취업 준비율 40점 이상 달성"] },
  { num: 4, phase: "개인 브랜딩", title: "포트폴리오 랜딩페이지 제작", duration: "Week 4~6", color: "#d97706", tasks: ["디자인 시스템 선택", "콘텐츠 구성 완료", "GitHub Pages 업로드 및 링크 확인", "선생님 피드백 반영 완료"] },
  { num: 5, phase: "취업처 매칭", title: "AI 취업처 추천 & 채용공고 분석", duration: "Week 5~8", color: "#059669", tasks: ["AI 취업처 추천 1회 이상 실행", "목표 기업 3개 이상 선정", "채용공고 첨삭 1개 이상 완료"] },
  { num: 6, phase: "취업 활동", title: "지원서 제출 & 면접 준비", duration: "Week 7~12", color: "#dc2626", tasks: ["1개 이상 기업 지원 완료", "지원 현황 플랫폼 기록", "AI 면접 준비 1회 이상"] },
  { num: 7, phase: "사후 관리", title: "취업 확정 보고 & 사후 지도", duration: "취업 후", color: "#374151", tasks: ["플랫폼 취업 상태 '취업확정' 업데이트", "취업 기업명·직종 입력", "플랫폼 피드백 작성"] },
];

// 이번 주 월요일(자정)을 ISO 문자열로 반환 — 주간 체크인의 주 식별 키
function getMondayOfThisWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

// 40주 진도 그리드의 4단계와 기존 7단계 워크플로우를 연결 (실제 주차 데이터가 없어 체크리스트 완료율로 근사)
const STAGE_WORKFLOW_STEPS: Record<string, number[]> = {
  basic: [1, 2],
  practice: [3],
  portfolio: [4],
  job: [5, 6, 7],
};
import { useAuth } from "@/_core/hooks/useAuth";

const CAREER_TRACK_LABELS: Record<string, string> = {
  brand_design: "브랜드 디자인",
  sns_marketing: "SNS 마케팅",
  video_editing: "영상 편집",
  character_goods: "캐릭터 굿즈",
  ai_generation: "AI 생성",
  freelancer: "프리랜서",
  undecided: "미정",
};

const FREELANCER_PLATFORMS = [
  {
    name: "크몽",
    url: "https://kmong.com",
    description: "국내 최대 프리랜서 마켓. 디자인·영상·마케팅 분야 강세",
    category: "종합",
    tip: "포트폴리오 썸네일 품질이 수주율에 직결됩니다. 첫 3건은 저가로 리뷰를 쌓으세요.",
  },
  {
    name: "카카오 브레인 AI",
    url: "https://www.kakaowork.com",
    description: "AI 생성 콘텐츠 수요 급증. 카카오 생태계 연계 강점",
    category: "AI",
    tip: "AI 생성 이미지 + 후보정 서비스 패키지로 차별화하세요.",
  },
  {
    name: "숨고",
    url: "https://soomgo.com",
    description: "견적 요청 기반 매칭. 로컬 비즈니스 디자인 수요 다수",
    category: "종합",
    tip: "빠른 응답(30분 이내)이 매칭 성공률을 2배 높입니다.",
  },
  {
    name: "라우드소싱",
    url: "https://www.loud.kr",
    description: "공모전·콘테스트 기반 플랫폼. 브랜드 디자인 특화",
    category: "공모전",
    tip: "수상 이력이 포트폴리오 신뢰도를 높이는 지름길입니다.",
  },
  {
    name: "오투잡",
    url: "https://www.o2jam.com",
    description: "소규모 디자인·영상 의뢰 다수. 단가 낮지만 경험 축적에 유리",
    category: "입문",
    tip: "첫 프리랜서 경험 쌓기에 적합합니다. 이후 크몽으로 이동 권장.",
  },
];

const CAREER_GUIDE_STEPS = [
  { step: 1, title: "포트폴리오 완성", desc: "대표작 3~5개를 고품질로 정리하세요.", icon: "📁" },
  { step: 2, title: "플랫폼 프로필 등록", desc: "크몽·숨고 등 2개 이상 플랫폼에 프로필을 등록하세요.", icon: "👤" },
  { step: 3, title: "첫 수주 (저가 전략)", desc: "리뷰 5개를 목표로 저가 수주를 시작하세요.", icon: "🎯" },
  { step: 4, title: "리뷰 & 단가 상승", desc: "별점 4.8 이상 유지 후 단가를 20~30% 올리세요.", icon: "⭐" },
  { step: 5, title: "전문 분야 특화", desc: "1개 분야에 집중하여 전문가 브랜딩을 구축하세요.", icon: "🏆" },
  { step: 6, title: "정기 클라이언트 확보", desc: "월 3~5명의 정기 클라이언트를 목표로 하세요.", icon: "🤝" },
];

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  category: string;
}

function StudentMatchingRecordCard({ record, studentUserId }: { record: any; studentUserId: number }) {
  const utils = trpc.useUtils();
  const [reply, setReply] = useState("");
  const addComment = trpc.careerMatching.addMatchingComment.useMutation({
    onSuccess: () => {
      utils.careerMatching.getMatchingRecords.invalidate({ studentUserId });
      setReply("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">{new Date(record.createdAt).toLocaleString("ko-KR")}</p>
        <div className="space-y-1 text-sm">
          {record.resume && <p>📄 이력서: <span className="font-medium">{record.resume.name || "등록된 이력서"}</span></p>}
          {record.coverLetter && <p>📝 자기소개서: <span className="font-medium">{record.coverLetter.title}</span></p>}
          {record.portfolio && (
            <p>
              🌐 랜딩페이지:{" "}
              {record.portfolio.externalUrl ? (
                <a href={record.portfolio.externalUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  {record.portfolio.title}
                </a>
              ) : (
                <span className="font-medium">{record.portfolio.title}</span>
              )}
            </p>
          )}
          {record.desiredEmployerLink && (
            <p>
              🎯 희망 취업처:{" "}
              <a href={record.desiredEmployerLink} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {record.desiredEmployerLink}
              </a>
            </p>
          )}
          {record.note && <p className="text-muted-foreground italic">💬 학과장 메모: {record.note}</p>}
        </div>

        <div className="border-t pt-2 space-y-2">
          {record.comments.length > 0 && (
            <div className="space-y-2">
              {record.comments.map((c: any) => (
                <div key={c.id} className="flex items-start gap-2 text-xs">
                  <Badge variant={c.authorRole === "admin" ? "default" : "secondary"} className="shrink-0">
                    {c.authorRole === "admin" ? "학과장" : "나"}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p>{c.content}</p>
                    <p className="text-muted-foreground mt-0.5">{new Date(c.createdAt).toLocaleString("ko-KR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="답글 남기기"
              className="text-sm"
              onKeyDown={(e) => { if (e.key === "Enter" && reply.trim()) addComment.mutate({ recordId: record.id, content: reply }); }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={addComment.isPending || !reply.trim()}
              onClick={() => addComment.mutate({ recordId: record.id, content: reply })}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CareerProgress() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("checklist");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const { data: guidance } = trpc.guidance.getCareerGuidance.useQuery(
    { studentUserId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  const { data: matchingRecords = [], isLoading: matchingLoading } = trpc.careerMatching.getMatchingRecords.useQuery(
    { studentUserId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  const toggleMutation = trpc.guidance.toggleChecklistItem.useMutation({
    onSuccess: () => toast.success("체크리스트가 업데이트되었습니다."),
    onError: () => toast.error("업데이트 실패"),
  });

  const utils = trpc.useUtils();
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [selfReadiness, setSelfReadiness] = useState(3);
  const [completedThisWeek, setCompletedThisWeek] = useState("");
  const [nextWeekGoal, setNextWeekGoal] = useState("");
  const thisWeekMonday = getMondayOfThisWeek();

  const { data: checkins = [] } = trpc.guidance.getWeeklyCheckins.useQuery(
    { studentUserId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );
  const latestCheckin = checkins[0];
  const hasCheckedInThisWeek = latestCheckin
    ? new Date(latestCheckin.weekOf).toDateString() === new Date(thisWeekMonday).toDateString()
    : false;

  const submitCheckin = trpc.guidance.submitWeeklyCheckin.useMutation({
    onSuccess: () => {
      utils.guidance.getWeeklyCheckins.invalidate();
      setCheckinOpen(false);
      setCompletedThisWeek("");
      setNextWeekGoal("");
      setSelfReadiness(3);
      toast.success("이번 주 체크인이 등록되었습니다.");
    },
    onError: () => toast.error("체크인 등록 실패"),
  });

  const checklist: ChecklistItem[] = (guidance?.checklist as ChecklistItem[]) ?? [];
  const completedCount = checklist.filter((c) => c.done).length;
  const totalCount = checklist.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const careerTrack = guidance?.careerTrack ?? "undecided";
  const doneCount = Math.round((progressPct / 100) * TOTAL_WEEKS);
  const currentStage = getStageOfWeek(Math.min(doneCount + 1, TOTAL_WEEKS));

  const handleToggle = (itemId: string) => {
    if (!guidance?.id) return;
    toggleMutation.mutate({ guidanceId: guidance.id, itemId });
  };

  const CATEGORY_ORDER = ["서류", "검토", "매칭", "지원", "면접", "결과"];

  const selectedStage = selectedWeek ? getStageOfWeek(selectedWeek) : null;
  const selectedState = selectedWeek ? weekState(selectedWeek, doneCount) : null;
  const selectedSteps = selectedStage
    ? WORKFLOW_STEPS.filter((s) => STAGE_WORKFLOW_STEPS[selectedStage.key]?.includes(s.num))
    : [];

  return (
    <AppLayout title="내 진도">
      <div className="max-w-[1180px] mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* 헤더 카드 */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {user?.name ?? "학생"}님의 취업 준비 현황
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  진로 트랙 · <Badge variant="outline" className="ml-1">{CAREER_TRACK_LABELS[careerTrack] ?? "미정"}</Badge>
                </p>
                {guidance?.guidanceNote && (
                  <p className="text-sm text-muted-foreground mt-2">
                    학과장 코멘트 · {guidance.guidanceNote}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0 space-y-2">
                <div>
                  <p className="text-3xl font-bold text-foreground tabular-nums">{progressPct}%</p>
                  <p className="text-xs text-muted-foreground">{currentStage.label} · {completedCount}/{totalCount} 항목 완료</p>
                </div>
                <Link href="/student/documents">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5" />
                    서류 등록하러 가기
                  </Button>
                </Link>
              </div>
            </div>
            <ProgressGrid doneCount={doneCount} onCellClick={setSelectedWeek} />
            <p className="text-xs text-muted-foreground">
              칸을 눌러 해당 구간의 준비 항목을 확인하세요 · 실제 주차별 과제·출석 데이터가 아직 연동되지 않아 체크리스트 완료율로 근사 표시돼요.
            </p>
          </CardContent>
        </Card>

        <Sheet open={selectedWeek !== null} onOpenChange={(open) => !open && setSelectedWeek(null)}>
          <SheetContent side="right" className="w-full sm:max-w-[420px] p-0">
            {selectedWeek && selectedStage && (
              <div className="flex flex-col h-full">
                <SheetHeader className="px-5 py-4 border-b border-border">
                  <SheetTitle className="text-base">{selectedWeek}주차 · {selectedStage.label}</SheetTitle>
                  <Badge
                    variant="outline"
                    className={
                      selectedState === "done" ? "w-fit bg-foreground text-background border-transparent" :
                      selectedState === "current" ? "w-fit bg-primary text-primary-foreground border-transparent" :
                      "w-fit"
                    }
                  >
                    {selectedState === "done" ? "완료" : selectedState === "current" ? "이번 주" : "예정"}
                  </Badge>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {selectedSteps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">이 구간에 연결된 준비 항목이 없어요.</p>
                  ) : (
                    selectedSteps.map((step) => (
                      <div key={step.num} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{step.title}</p>
                          <Badge variant="outline" className="text-xs shrink-0">{step.duration}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {step.tasks.map((task) => (
                            <span key={task} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  <Separator />
                  <a href={WORKFLOW_URL} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1.5 w-full">
                      전체 가이드 열기
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* 주간 체크인 — 자가진단, 자동 점수와는 별개로 상담 참고용 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck size={18} strokeWidth={1.75} className="text-primary" />
                이번 주 체크인
              </CardTitle>
              <Button size="sm" variant={hasCheckedInThisWeek ? "outline" : "default"} onClick={() => setCheckinOpen(true)}>
                {hasCheckedInThisWeek ? "이번 주 체크인 수정" : "이번 주 체크인 하기"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              점수에는 반영되지 않고, 학과장·교수님 상담 참고 자료로만 쓰여요.
            </p>
          </CardHeader>
          {latestCheckin && (
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={14} className={n <= latestCheckin.selfReadiness ? "fill-primary text-primary" : "text-muted-foreground"} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(latestCheckin.weekOf).toLocaleDateString("ko-KR")} 주 기준
                </span>
              </div>
              <p className="text-sm text-foreground/90">{latestCheckin.completedThisWeek}</p>
              {latestCheckin.nextWeekGoal && (
                <Badge variant="secondary" className="text-xs font-normal">다음 주 목표 · {latestCheckin.nextWeekGoal}</Badge>
              )}
            </CardContent>
          )}
        </Card>

        <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>이번 주 체크인</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>이번 주 준비도는 어느 정도인가요?</Label>
                <div className="flex items-center gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setSelfReadiness(n)}>
                      <Star size={24} className={n <= selfReadiness ? "fill-primary text-primary" : "text-muted-foreground"} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>이번 주에 한 일 *</Label>
                <Textarea
                  value={completedThisWeek}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompletedThisWeek(e.target.value)}
                  rows={4}
                  placeholder="예: 포트폴리오 2개 프로젝트 업로드, 채용공고 3건 지원"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>다음 주 목표 (선택)</Label>
                <Input value={nextWeekGoal} onChange={(e) => setNextWeekGoal(e.target.value)} placeholder="예: 자기소개서 초안 완성" className="mt-1" />
              </div>
              <Button
                className="w-full"
                onClick={() => submitCheckin.mutate({
                  weekOf: thisWeekMonday,
                  selfReadiness,
                  completedThisWeek,
                  nextWeekGoal: nextWeekGoal || undefined,
                })}
                disabled={!completedThisWeek || submitCheckin.isPending}
              >
                체크인 저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="checklist">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              취업 체크리스트
            </TabsTrigger>
            <TabsTrigger value="workflow">
              <ListChecks className="w-4 h-4 mr-1.5" />
              포트폴리오 워크플로우
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <Sparkles className="w-4 h-4 mr-1.5" />
              AI 추천 취업처
            </TabsTrigger>
            <TabsTrigger value="freelancer">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              프리랜서 가이드
            </TabsTrigger>
            <TabsTrigger value="matching">
              <Link2 className="w-4 h-4 mr-1.5" />
              학과장 매칭자료
            </TabsTrigger>
          </TabsList>

          {/* 체크리스트 탭 */}
          <TabsContent value="checklist" className="mt-4">
            {checklist.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground font-medium">아직 체크리스트가 없습니다.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    학과장이 진로지도 카드를 작성하면 여기에 표시됩니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 space-y-4">
                  {CATEGORY_ORDER.map((category) => {
                    const items = checklist.filter((c) => c.category === category);
                    if (items.length === 0) return null;
                    return (
                      <div key={category}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {category}
                        </p>
                        <div className="space-y-1">
                          {items.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleToggle(item.id)}
                              disabled={toggleMutation.isPending}
                              className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                            >
                              {item.done ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className={`text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {item.label}
                              </span>
                              {item.done && (
                                <Badge className="ml-auto text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                                  완료
                                </Badge>
                              )}
                            </button>
                          ))}
                        </div>
                        <Separator className="mt-3" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 포트폴리오 워크플로우 탭 */}
          <TabsContent value="workflow" className="mt-4 space-y-4">
            {/* 전체 가이드 링크 배너 */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">포트폴리오 제작 단계별 가이드</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    진로 설정부터 취업 확정까지 7단계 워크플로우 — 체크리스트 포함
                  </p>
                </div>
                <a href={WORKFLOW_URL} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="gap-1.5 flex-shrink-0">
                    전체 가이드 열기
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* 7단계 인라인 뷰 */}
            <div className="space-y-3">
              {WORKFLOW_STEPS.map((step, idx) => (
                <Card key={step.num} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* 번호 컬럼 */}
                      <div
                        className="flex items-center justify-center w-12 flex-shrink-0 text-white font-bold text-base"
                        style={{ backgroundColor: step.color }}
                      >
                        {step.num}
                      </div>
                      {/* 내용 */}
                      <div className="flex-1 px-4 py-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <span
                              className="text-xs font-bold uppercase tracking-wide"
                              style={{ color: step.color }}
                            >
                              {step.phase}
                            </span>
                            <p className="font-semibold text-sm text-foreground mt-0.5">{step.title}</p>
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {step.duration}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {step.tasks.map((task) => (
                            <span
                              key={task}
                              className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                            >
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* 스텝 연결선 */}
                    {idx < WORKFLOW_STEPS.length - 1 && (
                      <div className="flex justify-start pl-6">
                        <div className="w-0.5 h-2 bg-border" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI 추천 취업처 탭 */}
          <TabsContent value="recommendations" className="mt-4">
            {!guidance?.recommendedCompanies || (guidance.recommendedCompanies as any[]).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground font-medium">AI 추천 취업처가 없습니다.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    학과장이 진로지도 카드에서 AI 추천을 실행하면 여기에 표시됩니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {(guidance.recommendedCompanies as { companyName: string; jobTitle: string; reason: string; matchScore: number }[]).map(
                  (rec, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{rec.companyName}</p>
                              <Badge
                                className={`text-xs ${
                                  rec.matchScore >= 80
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                적합도 {rec.matchScore}%
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{rec.jobTitle}</p>
                            <p className="text-sm text-muted-foreground mt-2">{rec.reason}</p>
                          </div>
                          <div className="text-2xl font-bold text-primary flex-shrink-0">
                            #{idx + 1}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            )}
          </TabsContent>

          {/* 프리랜서 가이드 탭 */}
          <TabsContent value="freelancer" className="mt-4 space-y-4">
            {/* 단계별 로드맵 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  프리랜서 성공 로드맵
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {CAREER_GUIDE_STEPS.map((step, idx) => (
                    <div key={step.step} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                          {step.step}
                        </div>
                        {idx < CAREER_GUIDE_STEPS.length - 1 && (
                          <div className="w-0.5 h-6 bg-border mt-1" />
                        )}
                      </div>
                      <div className="pb-3">
                        <p className="font-medium text-sm">
                          {step.icon} {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 플랫폼 안내 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  추천 프리랜서 플랫폼
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {FREELANCER_PLATFORMS.map((platform) => (
                    <div
                      key={platform.name}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{platform.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {platform.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{platform.description}</p>
                          <p className="text-xs text-primary mt-1.5 font-medium">
                            💡 {platform.tip}
                          </p>
                        </div>
                        <a
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                        >
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            방문
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 수입 목표 가이드 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  단계별 수입 목표
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { stage: "입문 (1~3개월)", target: "월 30~50만원", color: "bg-blue-50 border-blue-200 text-blue-700" },
                    { stage: "성장 (4~6개월)", target: "월 100~150만원", color: "bg-amber-50 border-amber-200 text-amber-700" },
                    { stage: "전문 (7개월~)", target: "월 200만원+", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                  ].map((item) => (
                    <div key={item.stage} className={`p-3 rounded-lg border text-center ${item.color}`}>
                      <p className="text-xs font-medium">{item.stage}</p>
                      <p className="text-base font-bold mt-1">{item.target}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 학과장 매칭자료 탭 */}
          <TabsContent value="matching" className="mt-4 space-y-3">
            {matchingLoading ? (
              <div className="flex justify-center py-8 text-muted-foreground">불러오는 중…</div>
            ) : matchingRecords.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>아직 학과장이 등록한 매칭자료가 없습니다.</p>
              </div>
            ) : (
              matchingRecords.map((record: any) => (
                <StudentMatchingRecordCard key={record.id} record={record} studentUserId={user?.id ?? 0} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
