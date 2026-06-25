import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  ChevronRight,
} from "lucide-react";
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

export default function CareerProgress() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("checklist");

  const { data: guidance } = trpc.guidance.getCareerGuidance.useQuery(
    { studentUserId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  const toggleMutation = trpc.guidance.toggleChecklistItem.useMutation({
    onSuccess: () => toast.success("체크리스트가 업데이트되었습니다."),
    onError: () => toast.error("업데이트 실패"),
  });

  const checklist: ChecklistItem[] = (guidance?.checklist as ChecklistItem[]) ?? [];
  const completedCount = checklist.filter((c) => c.done).length;
  const totalCount = checklist.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const careerTrack = guidance?.careerTrack ?? "undecided";
  const isFreelancer = careerTrack === "freelancer";

  const handleToggle = (itemId: string) => {
    if (!guidance?.id) return;
    toggleMutation.mutate({ guidanceId: guidance.id, itemId });
  };

  const CATEGORY_ORDER = ["서류", "검토", "매칭", "지원", "면접", "결과"];

  return (
    <AppLayout title="진로 진행 현황">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* 헤더 카드 */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {user?.name ?? "학생"}님의 취업 준비 현황
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  진로 트랙:{" "}
                  <Badge variant="outline" className="ml-1">
                    {CAREER_TRACK_LABELS[careerTrack] ?? "미정"}
                  </Badge>
                </p>
                {guidance?.guidanceNote && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    💬 학과장 메모: {guidance.guidanceNote}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-3xl font-bold text-primary">{progressPct}%</p>
                <p className="text-xs text-muted-foreground">{completedCount}/{totalCount} 완료</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={progressPct} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checklist">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              취업 체크리스트
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <Sparkles className="w-4 h-4 mr-1.5" />
              AI 추천 취업처
            </TabsTrigger>
            <TabsTrigger value="freelancer">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              프리랜서 가이드
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
        </Tabs>
      </div>
    </AppLayout>
  );
}
