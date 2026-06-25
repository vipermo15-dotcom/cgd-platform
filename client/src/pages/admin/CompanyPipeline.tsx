import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Building2, Phone, Mail, ChevronRight, Trash2, Edit } from "lucide-react";

type Stage = "discovery" | "contact" | "negotiation" | "mou_signed";

const STAGES: { key: Stage; label: string; color: string; bg: string }[] = [
  { key: "discovery", label: "발굴", color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
  { key: "contact", label: "접촉", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  { key: "negotiation", label: "협의", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  { key: "mou_signed", label: "MOU 체결", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
];

export default function CompanyPipeline() {
  const { data: pipeline = [], refetch } = trpc.guidance.getPipeline.useQuery();
  const addMutation = trpc.guidance.addPipelineCompany.useMutation({
    onSuccess: () => { refetch(); toast.success("업체가 추가되었습니다."); setAddOpen(false); resetForm(); },
    onError: () => toast.error("추가 실패"),
  });
  const stageMutation = trpc.guidance.updatePipelineStage.useMutation({
    onSuccess: () => { refetch(); toast.success("단계가 변경되었습니다."); },
    onError: () => toast.error("변경 실패"),
  });
  const deleteMutation = trpc.guidance.deletePipelineCompany.useMutation({
    onSuccess: () => { refetch(); toast.success("삭제되었습니다."); },
    onError: () => toast.error("삭제 실패"),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    companyName: "", contactName: "", contactPhone: "", contactEmail: "",
    industry: "", stage: "discovery" as Stage, note: "", nextAction: "",
    expectedHeadcount: 0,
  });

  const resetForm = () => setForm({
    companyName: "", contactName: "", contactPhone: "", contactEmail: "",
    industry: "", stage: "discovery", note: "", nextAction: "", expectedHeadcount: 0,
  });

  const grouped = STAGES.reduce((acc, s) => {
    acc[s.key] = pipeline.filter((c) => c.stage === s.key);
    return acc;
  }, {} as Record<Stage, typeof pipeline>);

  const handleStageChange = (id: number, stage: Stage) => {
    stageMutation.mutate({ id, stage });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">업체 파이프라인</h1>
          <p className="text-sm text-muted-foreground mt-1">협력기업 개발 단계를 칸반 보드로 관리합니다.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> 업체 추가
        </Button>
      </div>

      {/* 칸반 보드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAGES.map((stage) => (
          <div key={stage.key} className={`rounded-xl border-2 ${stage.bg} p-4 min-h-[400px]`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-semibold ${stage.color}`}>{stage.label}</h2>
              <Badge variant="outline" className={stage.color}>
                {grouped[stage.key]?.length ?? 0}
              </Badge>
            </div>
            <div className="space-y-3">
              {grouped[stage.key]?.map((company) => (
                <Card key={company.id} className="shadow-sm hover:shadow-md transition-shadow cursor-default">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{company.companyName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-destructive flex-shrink-0"
                        onClick={() => {
                          if (confirm("삭제하시겠습니까?")) deleteMutation.mutate({ id: company.id });
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {company.industry && (
                      <Badge variant="secondary" className="text-xs">{company.industry}</Badge>
                    )}
                    {company.contactName && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {company.contactName} {company.contactPhone}
                      </p>
                    )}
                    {company.contactEmail && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {company.contactEmail}
                      </p>
                    )}
                    {company.note && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{company.note}</p>
                    )}
                    {company.nextAction && (
                      <p className="text-xs font-medium text-primary">→ {company.nextAction}</p>
                    )}
                    {/* 다음 단계 이동 버튼 */}
                    {stage.key !== "mou_signed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs gap-1 mt-2"
                        onClick={() => {
                          const nextIdx = STAGES.findIndex((s) => s.key === stage.key) + 1;
                          if (nextIdx < STAGES.length) {
                            handleStageChange(company.id, STAGES[nextIdx].key);
                          }
                        }}
                      >
                        {STAGES[STAGES.findIndex((s) => s.key === stage.key) + 1]?.label}으로 이동
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {grouped[stage.key]?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  업체 없음
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 업체 추가 모달 */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>업체 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>기업명 *</Label>
                <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="기업명 입력" />
              </div>
              <div className="space-y-1">
                <Label>업종</Label>
                <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="예: 디자인 에이전시" />
              </div>
              <div className="space-y-1">
                <Label>단계</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as Stage })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>담당자명</Label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="담당자명" />
              </div>
              <div className="space-y-1">
                <Label>연락처</Label>
                <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="010-0000-0000" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>이메일</Label>
                <Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="email@company.com" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>메모</Label>
                <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="업체 관련 메모" rows={3} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>다음 액션</Label>
                <Input value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} placeholder="예: 미팅 일정 잡기" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>취소</Button>
            <Button
              onClick={() => addMutation.mutate(form)}
              disabled={!form.companyName || addMutation.isPending}
            >
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
