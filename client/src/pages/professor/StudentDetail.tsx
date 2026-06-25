import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { ArrowLeft, Star, Bot } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const SCORE_LABELS: Record<string, string> = {
  branding: "브랜딩", sns: "SNS 콘텐츠", video: "영상편집",
  character: "캐릭터/일러스트", aiGeneration: "AI 생성", editing: "편집디자인",
};

export default function ProfessorStudentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: detail } = trpc.professor.getStudentDetail.useQuery({ userId: Number(id) });

  const radarData: { subject: string; score: number }[] = [];

  return (
    <AppLayout title="학생 상세">
      <div className="p-6 space-y-6 max-w-4xl">
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
