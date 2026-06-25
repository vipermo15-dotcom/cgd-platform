import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Bot, Zap, Clock } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const TYPE_LABELS: Record<string, string> = {
  portfolio_analysis: "포트폴리오 분석",
  cover_letter: "자기소개서 생성",
  job_recommendation: "채용 추천",
};

export default function AdminAILogs() {
  const { data: logs = [] } = trpc.admin.getAiLogs.useQuery({ limit: 50 });
  const { data: logStatsArr = [] } = trpc.admin.getAiLogStats.useQuery();
  const logStats = {
    totalCalls: logStatsArr.reduce((s: number, d: any) => s + (d.totalCalls ?? 0), 0),
    totalTokens: logStatsArr.reduce((s: number, d: any) => s + (d.totalTokens ?? 0), 0),
    analysisCalls: logs.filter((l: any) => l.type === "portfolio_analysis").length,
    coverLetterCalls: logs.filter((l: any) => l.type === "cover_letter").length,
  };

  return (
    <AppLayout title="AI 로그 & 토큰 모니터링">
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "총 AI 호출", value: logStats?.totalCalls ?? 0, icon: <Bot size={18} />, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "총 토큰 사용", value: (logStats?.totalTokens ?? 0).toLocaleString(), icon: <Zap size={18} />, color: "text-yellow-500", bg: "bg-yellow-50" },
            { label: "포트폴리오 분석", value: logStats?.analysisCalls ?? 0, icon: <Bot size={18} />, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "자기소개서 생성", value: logStats?.coverLetterCalls ?? 0, icon: <Bot size={18} />, color: "text-emerald-500", bg: "bg-emerald-50" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 ${s.color}`}>
                  {s.icon}
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Log table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">최근 AI 호출 로그</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">로그가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log: any) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg text-sm">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${log.success ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                      <Bot size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{TYPE_LABELS[log.type] ?? log.type}</Badge>
                        {log.tokensUsed && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap size={11} /> {log.tokensUsed.toLocaleString()} 토큰
                          </span>
                        )}
                      </div>
                      {log.errorMessage && (
                        <p className="text-xs text-red-500 mt-0.5 truncate">{log.errorMessage}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                      <Clock size={11} /> {format(new Date(log.createdAt), "MM.dd HH:mm", { locale: ko })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
