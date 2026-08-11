import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { ArrowLeft, Star, Bot, Briefcase, Bookmark } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const SCORE_LABELS: Record<string, string> = {
  branding: "브랜딩", sns: "SNS 콘텐츠", video: "영상편집",
  character: "캐릭터/일러스트", aiGeneration: "AI 생성", editing: "편집디자인",
};

const APP_STATUS_COLORS: Record<string, string> = {
  "지원완료": "bg-blue-100 text-blue-700",
  "서류합격": "bg-green-100 text-green-700",
  "면접": "bg-yellow-100 text-yellow-700",
  "최종합격": "bg-emerald-100 text-emerald-700",
  "탈락": "bg-red-100 text-red-700",
};

export default function ProfessorStudentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: detail } = trpc.professor.getStudentDetail.useQuery({ userId: Number(id) });
  const { data: counselingSessions = [] } = trpc.guidance.getCounselingSessions.useQuery(
    { studentUserId: Number(id) },
    { enabled: !!id }
  );
  const { data: checkins = [] } = trpc.guidance.getWeeklyCheckins.useQuery(
    { studentUserId: Number(id) },
    { enabled: !!id }
  );
  const { data: jobActivity } = trpc.jobs.getStudentJobActivity.useQuery(
    { studentUserId: Number(id) },
    { enabled: !!id }
  );
  const applications = jobActivity?.applications ?? [];
  const jobBookmarks = jobActivity?.bookmarks ?? [];

  const radarData: { subject: string; score: number }[] = [];

  return (
    <AppLayout title="학생 상세">
      <div className="max-w-[1180px] mx-auto px-4 md:px-8 py-6 space-y-6">
        <Link href="/professor/students">
          <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft size={16} /> 목록으로</Button>
        </Link>

        {detail ? (
          <>
            {/* Profile */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                    {detail.user?.name?.[0] ?? "?"}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{detail.user?.name}</h2>
                    <p className="text-sm text-muted-foreground">{detail.profile?.studentId} · {detail.profile?.major}</p>
                    <div className="flex gap-2 mt-1">
                      {detail.profile?.employmentStatus && (
                        <Badge variant="secondary">{detail.profile.employmentStatus}</Badge>
                      )}
                      {detail.profile?.employedCompany && (
                        <Badge className="bg-emerald-100 text-emerald-700">{detail.profile.employedCompany}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {detail.profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted rounded-lg">{detail.profile.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* 지원 희망(북마크) · 진행 현황(지원 내역) — 멘토링 참고용 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase size={18} className="text-primary" />
                  지원 희망·진행 현황
                </CardTitle>
                <p className="text-xs text-muted-foreground">학생이 관심 등록·지원한 채용공고예요. 상담 전에 참고하세요.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">지원 현황 ({applications.length}건)</p>
                  {applications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">아직 지원한 공고가 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {applications.map((a) => (
                        <div key={a.application.id} className="flex items-center justify-between gap-2 p-2.5 bg-muted rounded-lg">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{a.posting.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {a.company?.companyName ?? "기업명 없음"} · {format(new Date(a.application.createdAt), "yyyy.MM.dd", { locale: ko })}
                            </p>
                          </div>
                          <Badge className={`text-xs shrink-0 ${APP_STATUS_COLORS[a.application.status] ?? ""}`}>{a.application.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <Bookmark size={12} /> 관심 등록 ({jobBookmarks.length}건)
                  </p>
                  {jobBookmarks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">관심 등록한 공고가 없습니다.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {jobBookmarks.map((b) => (
                        <span key={b.bookmark.id} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                          {b.posting.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Counseling sessions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">상담 이력</CardTitle>
              </CardHeader>
              <CardContent>
                {counselingSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">아직 상담 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {counselingSessions.map((s) => (
                      <div key={s.id} className="p-3 bg-muted rounded-lg space-y-1">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <p className="text-sm font-medium">{s.topic}</p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(s.sessionDate), "yyyy.MM.dd", { locale: ko })} · {s.counselorName}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90">{s.note}</p>
                        {s.followUpAction && (
                          <Badge variant="secondary" className="text-xs font-normal">다음 목표 · {s.followUpAction}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly check-ins */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">주간 체크인</CardTitle>
                <p className="text-xs text-muted-foreground">학생이 스스로 남긴 자가진단 — 점수에는 반영되지 않는 상담 참고 자료예요.</p>
              </CardHeader>
              <CardContent>
                {checkins.length === 0 ? (
                  <p className="text-sm text-muted-foreground">아직 체크인 기록이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {checkins.map((c) => (
                      <div key={c.id} className="p-3 bg-muted rounded-lg space-y-1">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} size={12} className={n <= c.selfReadiness ? "fill-primary text-primary" : "text-muted-foreground"} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(c.weekOf), "yyyy.MM.dd", { locale: ko })} 주
                          </span>
                        </div>
                        <p className="text-sm">{c.completedThisWeek}</p>
                        {c.nextWeekGoal && (
                          <Badge variant="secondary" className="text-xs font-normal">다음 주 목표 · {c.nextWeekGoal}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedbacks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">피드백 이력</CardTitle>
              </CardHeader>
              <CardContent>
                {detail.feedbacks?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">아직 피드백이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {detail.feedbacks?.map((fb: any) => (
                      <div key={fb.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} size={14} className={n <= fb.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(fb.createdAt), "yyyy.MM.dd", { locale: ko })}
                          </span>
                        </div>
                        <p className="text-sm">{fb.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
