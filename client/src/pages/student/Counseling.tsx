import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function StudentCounseling() {
  const { user } = useAuth();
  const { data: sessions = [], isLoading } = trpc.guidance.getCounselingSessions.useQuery(
    { studentUserId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  return (
    <AppLayout title="상담">
      <div className="max-w-[1180px] mx-auto px-4 md:px-8 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">상담 이력</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sessions.length > 0
                ? `지금까지 ${sessions.length}번 상담했어요.`
                : "아직 등록된 상담 기록이 없어요."}
            </p>
          </div>
          <Link href="/student/ai-agents">
            <Button variant="outline" size="sm" className="gap-1.5">
              AI 진로상담 시작하기
              <ArrowRight size={14} strokeWidth={1.75} />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground py-12 text-center">불러오는 중...</div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
              <MessageSquare size={32} strokeWidth={1.75} className="text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">
                학과장·교수님과 상담을 진행하면 이 곳에 기록이 쌓여요.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-6">
              {sessions.map((s) => (
                <div key={s.id} className="relative">
                  <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" />
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-sm font-semibold text-foreground">{s.topic}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(s.sessionDate).toLocaleDateString("ko-KR")} · {s.counselorName}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90">{s.note}</p>
                      {s.followUpAction && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          다음 목표 · {s.followUpAction}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
