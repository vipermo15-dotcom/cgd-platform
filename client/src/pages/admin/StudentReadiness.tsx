import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, BookOpen, Briefcase, Map, TrendingUp, Users, AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  취업확정: "bg-emerald-100 text-emerald-700 border-emerald-200",
  지원중:   "bg-blue-100 text-blue-700 border-blue-200",
  준비중:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  미시작:   "bg-gray-100 text-gray-500 border-gray-200",
};

const SCORE_ITEMS = [
  { key: "profile",     label: "이력서/프로필", icon: FileText,  color: "bg-violet-500",  max: 20 },
  { key: "coverLetter", label: "자기소개서",    icon: BookOpen,  color: "bg-blue-500",    max: 20 },
  { key: "portfolio",   label: "포트폴리오",    icon: Briefcase, color: "bg-amber-500",   max: 20 },
  { key: "guidance",    label: "진로지도",      icon: Map,       color: "bg-green-500",   max: 20 },
  { key: "activity",    label: "취업활동",      icon: TrendingUp,color: "bg-rose-500",    max: 20 },
] as const;

function ReadinessBar({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold w-8 text-right text-muted-foreground">{score}/{max}</span>
    </div>
  );
}

function TotalRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-600" :
    score >= 60 ? "text-blue-600" :
    score >= 40 ? "text-amber-500" : "text-rose-400";
  return (
    <div className={`text-2xl font-black ${color} leading-none`}>
      {score}
      <span className="text-xs font-normal text-muted-foreground ml-0.5">점</span>
    </div>
  );
}

export default function StudentReadiness() {
  const { data = [], isLoading } = trpc.professor.getStudentsReadiness.useQuery();

  const avg = data.length
    ? Math.round(data.reduce((s, d) => s + d.scores.total, 0) / data.length)
    : 0;

  const buckets = {
    완료: data.filter((d) => d.scores.total >= 80).length,
    진행: data.filter((d) => d.scores.total >= 40 && d.scores.total < 80).length,
    시작전: data.filter((d) => d.scores.total < 40).length,
  };

  // 주의가 필요한 교육생 — 반 평균보다 20점 이상 뒤처진 학생 (최대 5명)
  const atRisk = [...data]
    .filter((d) => avg - d.scores.total >= 20)
    .sort((a, b) => a.scores.total - b.scores.total)
    .slice(0, 5);

  return (
    <AppLayout title="진도 현황">
      <div className="max-w-[1180px] mx-auto px-4 md:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">취업 준비율</h1>
          <p className="text-sm text-muted-foreground mt-1">
            이력서·자기소개서·포트폴리오·진로지도·취업활동 5개 항목 기준 · 각 20점, 총 100점
          </p>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-black text-primary">{avg}점</div>
              <div className="text-xs text-muted-foreground mt-1">전체 평균 준비율</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-black text-emerald-600">{buckets.완료}명</div>
              <div className="text-xs text-muted-foreground mt-1">80점 이상 (우수)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-black text-amber-500">{buckets.진행}명</div>
              <div className="text-xs text-muted-foreground mt-1">40~79점 (진행중)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-black text-rose-400">{buckets.시작전}명</div>
              <div className="text-xs text-muted-foreground mt-1">39점 이하 (시작전)</div>
            </CardContent>
          </Card>
        </div>

        {/* 주의가 필요한 교육생 */}
        {atRisk.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle size={18} strokeWidth={1.75} className="text-destructive" />
                주의가 필요한 교육생
                <Badge variant="secondary" className="ml-1 font-normal">{atRisk.length}명</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">반 평균({avg}점)보다 20점 이상 뒤처진 순으로 보여드려요.</p>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {atRisk.map((student) => (
                <Link key={student.userId} href={`/professor/students/${student.userId}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                      {student.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.name}</p>
                    </div>
                    <span className="text-sm font-semibold text-destructive tabular-nums">{student.scores.total}점</span>
                    <ArrowRight size={14} strokeWidth={1.75} className="text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 학생별 카드 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.map((student) => (
              <Card key={student.userId} className="overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {student.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{student.name}</p>
                        <Badge className={`text-xs mt-0.5 ${STATUS_COLORS[student.employmentStatus] ?? ""}`}>
                          {student.employmentStatus}
                        </Badge>
                      </div>
                    </div>
                    <TotalRing score={student.scores.total} />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {SCORE_ITEMS.map(({ key, label, icon: Icon, color, max }) => (
                    <div key={key}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon size={11} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                      <ReadinessBar
                        score={student.scores[key as keyof typeof student.scores] as number}
                        max={max}
                        color={color}
                      />
                    </div>
                  ))}
                  {/* 보조 정보 */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      포트폴리오 {student.details.portfolioCount}개
                    </span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      자소서 {student.details.coverLetterCount}개
                    </span>
                    {student.details.careerTrack !== "undecided" && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {student.details.careerTrack}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {data.length === 0 && (
              <div className="col-span-3 text-center py-16 text-muted-foreground">
                <Users className="mx-auto mb-3 opacity-30" size={40} />
                <p>등록된 교육생이 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
