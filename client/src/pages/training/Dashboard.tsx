import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Building2, Users, TrendingUp, Plus, Bot } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TrainingDashboard() {
  const utils = trpc.useUtils();
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyField, setCompanyField] = useState("");
  const [companyContact, setCompanyContact] = useState("");
  const [companyNotes, setCompanyNotes] = useState("");
  const [matchOpen, setMatchOpen] = useState(false);

  const { data: stats } = trpc.training.getDashboardStats.useQuery();
  const { data: companies = [] } = trpc.training.getPartnerCompanies.useQuery({});

  const addCompany = trpc.training.createPartnerCompany.useMutation({
    onSuccess: () => {
      utils.training.getPartnerCompanies.invalidate();
      setAddCompanyOpen(false);
      setCompanyName(""); setCompanyField(""); setCompanyContact(""); setCompanyNotes("");
      toast.success("협력기업이 등록되었습니다.");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const [matchResult, setMatchResult] = useState<any[]>([]);
  const aiMatch = trpc.training.aiMatching.useMutation({
    onSuccess: (data: any) => {
      setMatchResult(data?.matches ?? []);
      setMatchOpen(true);
      toast.success(`AI 매칭 완료: ${data?.matches?.length ?? 0}개 매칭 결과`);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });


  return (
    <AppLayout title="공동훈련센터 대시보드">
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "취업 확정", value: stats?.employedStudents ?? 0, icon: <Building2 size={18} />, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "전체 학생", value: stats?.totalStudents ?? 0, icon: <Users size={18} />, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "취업률", value: `${stats?.employmentRate ?? 0}%`, icon: <TrendingUp size={18} />, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "총 포트폴리오", value: stats?.totalPortfolios ?? 0, icon: <Bot size={18} />, color: "text-orange-500", bg: "bg-orange-50" },
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

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Dialog open={addCompanyOpen} onOpenChange={setAddCompanyOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={16} /> 협력기업 등록</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>협력기업 등록</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>기업명 *</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="mt-1" placeholder="(주)디자인스튜디오" />
                </div>
                <div>
                  <Label>분야</Label>
                  <Input value={companyField} onChange={e => setCompanyField(e.target.value)} className="mt-1" placeholder="브랜딩, 영상편집 등" />
                </div>
                <div>
                  <Label>담당자 연락처</Label>
                  <Input value={companyContact} onChange={e => setCompanyContact(e.target.value)} className="mt-1" placeholder="010-0000-0000" />
                </div>
                <div>
                  <Label>비고</Label>
                  <Textarea value={companyNotes} onChange={e => setCompanyNotes(e.target.value)} className="mt-1" rows={3} />
                </div>
                <Button className="w-full" onClick={() => addCompany.mutate({ companyName, industry: companyField, contactPhone: companyContact })} disabled={!companyName || addCompany.isPending}>
                  등록
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="gap-2" onClick={() => aiMatch.mutate({ companyId: 0, requiredSkills: [] })} disabled={aiMatch.isPending}>
            <Bot size={16} /> {aiMatch.isPending ? "AI 매칭 중..." : "AI 기업-학생 매칭"}
          </Button>
        </div>

        {/* Partner companies */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">산학협력 기업 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {companies.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">등록된 협력기업이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {companies.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {(c.companyName ?? c.name)?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{c.companyName ?? c.name}</p>
                      {(c.industry ?? c.field) && <p className="text-xs text-muted-foreground">{c.industry ?? c.field}</p>}
                    </div>
                    {c.status && <Badge variant="secondary" className="text-xs">{c.status}</Badge>}
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
