import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, HeartHandshake, Building2, CheckCircle2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// D+30/60/90 경과일 계산
function daysSince(dateStr: any): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return null;
  return Math.floor((Date.now() - d) / 86400000);
}

function FollowUpCard({ item }: { item: any }) {
  const utils = trpc.useUtils();
  const t = item.tracking;
  const [d30, setD30] = useState(false);
  const [d60, setD60] = useState(false);
  const [d90, setD90] = useState(false);
  const [d30Note, setD30Note] = useState("");
  const [d60Note, setD60Note] = useState("");
  const [d90Note, setD90Note] = useState("");

  useEffect(() => {
    setD30(!!t?.checkD30); setD60(!!t?.checkD60); setD90(!!t?.checkD90);
    setD30Note(t?.checkD30Note ?? ""); setD60Note(t?.checkD60Note ?? ""); setD90Note(t?.checkD90Note ?? "");
  }, [t]);

  const save = trpc.guidance.upsertEmploymentTracking.useMutation({
    onSuccess: () => { utils.guidance.listFollowUp.invalidate(); toast.success(`${item.name} 사후지도 저장`); },
    onError: (e) => toast.error(e.message),
  });

  const elapsed = daysSince(item.employedAt);

  const rows = [
    { key: "d30", label: "D+30", due: 30, val: d30, set: setD30, note: d30Note, setNote: setD30Note },
    { key: "d60", label: "D+60", due: 60, val: d60, set: setD60, note: d60Note, setNote: setD60Note },
    { key: "d90", label: "D+90", due: 90, val: d90, set: setD90, note: d90Note, setNote: setD90Note },
  ];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 size={12} /> {item.companyName || "회사 미입력"}
              {elapsed !== null && <span className="ml-1">· 취업 {elapsed}일 경과</span>}
            </p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700">취업확정</Badge>
        </div>

        <div className="space-y-2">
          {rows.map((r) => {
            const dueReached = elapsed !== null && elapsed >= r.due;
            return (
              <div key={r.key} className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 w-20 shrink-0">
                  <Checkbox checked={r.val} onCheckedChange={(v) => r.set(!!v)} />
                  <span className={`text-sm font-medium ${r.val ? "text-emerald-600" : dueReached ? "text-amber-600" : "text-muted-foreground"}`}>
                    {r.label}
                  </span>
                </label>
                {r.val ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  : dueReached ? <Clock size={13} className="text-amber-500 shrink-0" /> : <span className="w-[13px] shrink-0" />}
                <Input
                  value={r.note}
                  onChange={(e) => r.setNote(e.target.value)}
                  placeholder={`${r.label} 점검 메모 (근속·만족도 등)`}
                  className="h-8 flex-1 min-w-40 text-sm"
                />
              </div>
            );
          })}
        </div>

        <Button
          size="sm" className="gap-1.5"
          disabled={save.isPending}
          onClick={() => save.mutate({
            studentUserId: item.studentUserId,
            checkD30: d30, checkD60: d60, checkD90: d90,
            checkD30Note: d30Note, checkD60Note: d60Note, checkD90Note: d90Note,
          })}
        >
          {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 저장
        </Button>
      </CardContent>
    </Card>
  );
}

export default function FollowUp() {
  const { data: list = [], isLoading } = trpc.guidance.listFollowUp.useQuery();

  return (
    <AppLayout title="사후지도">
      <div className="p-6 space-y-4 pb-20 lg:pb-6 max-w-3xl">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><HeartHandshake className="text-primary" size={20} /></div>
          <div>
            <h2 className="font-semibold text-lg">수료 후 사후지도</h2>
            <p className="text-sm text-muted-foreground">취업 확정 교육생의 D+30 · D+60 · D+90 근속·적응 점검을 기록합니다.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={20} /> 불러오는 중…
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <HeartHandshake size={40} className="mx-auto opacity-30 mb-3" />
            <p>아직 취업 확정된 교육생이 없습니다.</p>
            <p className="text-sm mt-1">학생이 취업확정으로 등록되면 여기서 사후지도를 관리할 수 있습니다.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {list.map((item: any) => <FollowUpCard key={item.studentUserId} item={item} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
