import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Bot, Sparkles, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

const SCORE_LABELS: Record<string, string> = {
  branding: "브랜딩",
  sns: "SNS 콘텐츠",
  video: "영상편집",
  character: "캐릭터/일러스트",
  aiGeneration: "AI 생성",
  editing: "편집디자인",
};

const SCORE_COLORS = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-cyan-500"];

export default function StudentAIAnalysis() {
  const utils = trpc.useUtils();
  const { data: analysis, isLoading } = trpc.ai.getLatest.useQuery();
  const { data: portfolios = [] } = trpc.portfolio.list.useQuery();

  const analyze = trpc.ai.analyze.useMutation({
    onSuccess: () => {
      utils.ai.getLatest.invalidate();
      toast.success("AI 역량 분석이 완료되었습니다!");
    },
    onError: (e) => toast.error(e.message),
  });

  const radarData = analysis?.scores
    ? Object.entries(analysis.scores as Record<string, number>).map(([key, val]) => ({
        subject: SCORE_LABELS[key] ?? key,
        score: val,
      }))
    : [];

  const scoreEntries = analysis?.scores
    ? Object.entries(analysis.scores as Record<string, number>)
    : [];

  return (
    <AppLayout title="AI 역량 분석">
      <div className="p-6 space-y-6 pb-20 lg:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">포트폴리오를 기반으로 AI가 역량을 분석합니다.</p>
          </div>
          <Button
            onClick={() => analyze.mutate({})}
            disabled={analyze.isPending || portfolios.length === 0}
            className="gap-2"
          >
            {analyze.isPending ? (
              <><RefreshCw size={16} className="animate-spin" /> 분석 중...</>
            ) : (
              <><Sparkles size={16} /> AI 분석 실행</>
            )}
          </Button>
        </div>

        {portfolios.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-800">포트폴리오를 먼저 등록해야 AI 분석을 진행할 수 있습니다.</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : analysis ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">역량 레이더 차트</CardTitle>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{analysis.overallScore}점</p>
                    <p className="text-xs text-muted-foreground">종합 점수</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <Radar
                      name="역량"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.25}
                    />
                    <Tooltip formatter={(value) => [`${value}점`, "역량"]} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Score bars */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">분야별 점수</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scoreEntries.map(([key, score], idx) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{SCORE_LABELS[key] ?? key}</span>
                      <span className="font-semibold">{score}점</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot size={18} className="text-purple-500" />
                  AI 분석 요약
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
              </CardContent>
            </Card>

            {/* Strengths & Weaknesses */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">강점 & 개선 포인트</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-green-500" /> 강점
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.strengths as string[] | null)?.map((s, i) => (
                      <Badge key={i} className="bg-green-100 text-green-700 hover:bg-green-100">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-orange-500" /> 개선 포인트
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.weaknesses as string[] | null)?.map((w, i) => (
                      <Badge key={i} className="bg-orange-100 text-orange-700 hover:bg-orange-100">{w}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-blue-500" /> 추천 스킬
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.recommendedSkills as string[] | null)?.map((s, i) => (
                      <Badge key={i} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-16">
            <Bot size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold mb-2">아직 분석 결과가 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-6">포트폴리오를 등록하고 AI 분석을 실행해보세요.</p>
            <Button onClick={() => analyze.mutate({})} disabled={analyze.isPending || portfolios.length === 0} className="gap-2">
              <Sparkles size={16} /> AI 분석 시작
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
