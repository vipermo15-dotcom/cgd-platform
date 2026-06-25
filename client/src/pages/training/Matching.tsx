import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Bot, Zap, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TrainingMatching() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [matchResults, setMatchResults] = useState<any[]>([]);

  const { data: companies = [] } = trpc.training.getPartnerCompanies.useQuery({});

  const aiMatch = trpc.training.aiMatching.useMutation({
    onSuccess: (data: any) => {
      setMatchResults(data ?? []);
      toast.success(`AI 매칭 완료: ${Array.isArray(data) ? data.length : 0}건`);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  return (
    <AppLayout title="AI 기업-학생 매칭">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot size={18} className="text-purple-500" /> AI 매칭 실행
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              협력기업의 채용 요건과 학생의 AI 역량 분석 결과를 기반으로 최적 매칭을 추천합니다.
            </p>
            <div className="flex gap-3">
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="협력기업 선택" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="gap-2"
                onClick={() => {
                  if (!selectedCompanyId) return toast.error("기업을 선택하세요.");
                  aiMatch.mutate({ companyId: Number(selectedCompanyId), requiredSkills: [] });
                }}
                disabled={aiMatch.isPending || !selectedCompanyId}
              >
                <Zap size={16} /> AI 매칭 실행
              </Button>
            </div>
          </CardContent>
        </Card>

        {matchResults.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">매칭 결과 ({matchResults.length}명)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {matchResults.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {item.user?.name?.[0] ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{item.profile?.major}</p>
                    </div>
                    {item.matchScore && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        매칭 {item.matchScore}%
                      </Badge>
                    )}
                    <ArrowRight size={16} className="text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
