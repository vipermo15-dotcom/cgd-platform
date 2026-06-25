import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Search, CheckCircle, XCircle, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const APPROVAL_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};
const APPROVAL_LABELS: Record<string, string> = {
  pending: "승인 대기", approved: "게시 중", rejected: "반려됨",
};

export default function AdminPostings() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  const { data: postingsRaw = [] } = trpc.jobs.adminPendingPostings.useQuery();
  const allPostings = [...postingsRaw];
  const postings = statusFilter === "전체" ? allPostings : allPostings.filter((p: any) => (p.posting ?? p).approvalStatus === statusFilter || (p.posting ?? p).status === statusFilter);

  const approvePosting = trpc.jobs.adminApprovePosting.useMutation({
    onSuccess: () => { utils.jobs.adminPendingPostings.invalidate(); toast.success("공고가 승인되었습니다."); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const rejectPosting = trpc.jobs.adminApprovePosting.useMutation({
    onSuccess: () => { utils.jobs.adminPendingPostings.invalidate(); toast.success("공고가 반려되었습니다."); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  return (
    <AppLayout title="채용공고 관리">
      <div className="p-6 space-y-6">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="공고 제목 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["전체", "pending", "approved", "rejected"].map(s => (
                <SelectItem key={s} value={s}>{s === "전체" ? "전체 상태" : APPROVAL_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground">{postings.length}건</p>

        <div className="space-y-3">
          {postings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">공고가 없습니다.</div>
          ) : (
            postings.map((item: any) => {
              const posting = item.posting ?? item;
              return (
                <Card key={posting.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{posting.title}</h3>
                          <Badge className={`text-xs ${APPROVAL_COLORS[posting.approvalStatus] ?? ""}`}>
                            {APPROVAL_LABELS[posting.approvalStatus] ?? posting.approvalStatus}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {posting.location && <span className="flex items-center gap-1"><MapPin size={11} /> {posting.location}</span>}
                          {posting.deadline && <span className="flex items-center gap-1"><Clock size={11} /> {format(new Date(posting.deadline), "yyyy.MM.dd", { locale: ko })} 마감</span>}
                          {posting.employmentType && <span>{posting.employmentType}</span>}
                        </div>
                      </div>
                      {posting.approvalStatus === "pending" && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => approvePosting.mutate({ id: posting.id, action: "approved" })}>
                            <CheckCircle size={14} /> 승인
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200" onClick={() => rejectPosting.mutate({ id: posting.id, action: "rejected" })}>
                            <XCircle size={14} /> 반려
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
