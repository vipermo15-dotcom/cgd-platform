import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Search, UserCheck, UserX, Trash2, Briefcase, Building2,
  CheckCircle2, Clock, XCircle, Star, History, Users, Pencil, Check, X,
} from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  student: "재학생", professor: "학과장", company: "협력기업",
  training_center: "공동훈련센터", admin: "관리자", user: "일반",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};
const APP_STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  "지원완료": { color: "bg-blue-100 text-blue-700",     icon: <Clock size={11} /> },
  "서류합격": { color: "bg-yellow-100 text-yellow-700", icon: <CheckCircle2 size={11} /> },
  "면접":     { color: "bg-purple-100 text-purple-700", icon: <Star size={11} /> },
  "최종합격": { color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 size={11} /> },
  "탈락":     { color: "bg-red-100 text-red-700",       icon: <XCircle size={11} /> },
};

export default function AdminUsers() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");

  // 이름 인라인 수정
  const [editNameId, setEditNameId] = useState<number | null>(null);
  const [editNameValue, setEditNameValue] = useState("");

  // 삭제 확인 모달
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  // 단건 매칭 모달
  const [matchTarget, setMatchTarget] = useState<{ id: number; name: string } | null>(null);
  const [jobSearch, setJobSearch] = useState("");
  const [matchedJobId, setMatchedJobId] = useState<number | null>(null);

  // ⑤ 일괄 매칭 모달
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkJobSearch, setBulkJobSearch] = useState("");
  const [bulkJobId, setBulkJobId] = useState<number | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());

  const { data: usersRaw = [] } = trpc.user.adminGetUsers.useQuery({
    role: roleFilter === "전체" ? undefined : roleFilter as any,
    status: statusFilter === "전체" ? undefined : statusFilter as any,
  });
  const users = usersRaw.filter((u: any) => !search || u.name?.includes(search) || u.email?.includes(search));
  const studentUsers = (usersRaw as any[]).filter((u: any) => u.role === "student");

  // 승인된 채용공고 목록
  const { data: approvedPostings = [] } = trpc.user.adminGetApprovedPostings.useQuery(
    undefined,
    { enabled: !!matchTarget || bulkModalOpen }
  );

  // ④ 매칭 이력
  const { data: matchHistory = [] } = trpc.user.adminGetMatchHistory.useQuery();

  const filteredPostings = (approvedPostings as any[]).filter((p: any) =>
    !jobSearch ||
    p.posting?.title?.includes(jobSearch) ||
    p.company?.companyName?.includes(jobSearch)
  );
  const filteredBulkPostings = (approvedPostings as any[]).filter((p: any) =>
    !bulkJobSearch ||
    p.posting?.title?.includes(bulkJobSearch) ||
    p.company?.companyName?.includes(bulkJobSearch)
  );

  const approveUser = trpc.user.adminUpdateStatus.useMutation({
    onSuccess: () => { utils.user.adminGetUsers.invalidate(); toast.success("승인되었습니다."); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const rejectUser = trpc.user.adminUpdateStatus.useMutation({
    onSuccess: () => { utils.user.adminGetUsers.invalidate(); toast.success("반려되었습니다."); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const deleteUserMutation = trpc.user.adminDeleteUser.useMutation({
    onSuccess: () => { utils.user.adminGetUsers.invalidate(); toast.success("회원이 삭제되었습니다."); setDeleteTarget(null); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const matchJobMutation = trpc.user.adminMatchJobToStudent.useMutation({
    onSuccess: () => {
      toast.success("채용공고가 매칭되었습니다.");
      setMatchTarget(null); setMatchedJobId(null); setJobSearch("");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  // ⑤ 일괄 매칭
  const bulkMatchMutation = trpc.user.adminBulkMatchJob.useMutation({
    onSuccess: (data) => {
      const ok = data.results.filter((r) => r.success).length;
      const skip = data.results.filter((r) => !r.success).length;
      toast.success(`${ok}명 매칭 완료${skip > 0 ? ` (${skip}명 이미 지원됨)` : ""}`);
      setBulkModalOpen(false); setBulkJobId(null); setBulkJobSearch(""); setSelectedStudentIds(new Set());
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  // ⑥ 역할 변경
  const updateRoleMutation = trpc.user.adminUpdateRole.useMutation({
    onSuccess: () => { utils.user.adminGetUsers.invalidate(); toast.success("역할이 변경되었습니다."); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  // 이름 수정
  const updateNameMutation = trpc.user.adminUpdateUserName.useMutation({
    onSuccess: () => { utils.user.adminGetUsers.invalidate(); setEditNameId(null); toast.success("이름이 변경되었습니다."); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const startEditName = (id: number, current: string) => { setEditNameId(id); setEditNameValue(current); };
  const saveEditName = () => {
    if (editNameId == null) return;
    if (!editNameValue.trim()) { toast.error("이름을 입력하세요."); return; }
    updateNameMutation.mutate({ userId: editNameId, name: editNameValue.trim() });
  };

  const toggleStudentSelect = (id: number) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAllStudents = () => {
    if (selectedStudentIds.size === studentUsers.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(studentUsers.map((u: any) => u.id)));
    }
  };

  return (
    <AppLayout title="회원 관리">
      <div className="p-6 space-y-6">
        {/* ─── 탭: 회원 목록 / 매칭 이력 ─── */}
        <Tabs defaultValue="users">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <TabsList>
              <TabsTrigger value="users" className="gap-1.5"><Users size={14} /> 회원 목록</TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5"><History size={14} /> 매칭 이력 ({(matchHistory as any[]).length})</TabsTrigger>
            </TabsList>
            {/* ⑤ 일괄 매칭 버튼 */}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => { setBulkModalOpen(true); setBulkJobId(null); setBulkJobSearch(""); }}
            >
              <Briefcase size={14} /> 일괄 매칭
            </Button>
          </div>

          {/* ─── 회원 목록 탭 ─── */}
          <TabsContent value="users" className="space-y-4">
            {/* 필터 */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="이름, 이메일 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["전체", "student", "professor", "company", "training_center", "admin"].map(r => (
                    <SelectItem key={r} value={r}>{r === "전체" ? "전체 역할" : ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["전체", "pending", "active", "rejected"].map(s => (
                    <SelectItem key={s} value={s}>
                      {s === "전체" ? "전체 상태" : s === "pending" ? "대기" : s === "active" ? "활성" : "반려"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">{users.length}명</p>

            <div className="space-y-2">
              {users.map((u: any) => (
                <Card key={u.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                        {u.name?.[0] ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {editNameId === u.id ? (
                            <span className="flex items-center gap-1">
                              <Input
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveEditName(); if (e.key === "Escape") setEditNameId(null); }}
                                className="h-7 w-40 text-sm"
                                autoFocus
                              />
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={saveEditName} disabled={updateNameMutation.isPending} aria-label="저장">
                                <Check size={15} />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setEditNameId(null)} aria-label="취소">
                                <X size={15} />
                              </Button>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 group">
                              <p className="font-medium">{u.name ?? "이름 없음"}</p>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground opacity-60 hover:opacity-100" onClick={() => startEditName(u.id, u.name ?? "")} aria-label="이름 수정">
                                <Pencil size={13} />
                              </Button>
                            </span>
                          )}
                          <Badge variant="secondary" className="text-xs">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                          <Badge className={`text-xs ${STATUS_COLORS[u.status] ?? ""}`}>
                            {u.status === "pending" ? "대기" : u.status === "active" ? "활성" : "반려"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>

                      <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end items-center">
                        {/* ⑥ 역할 변경 드롭다운 */}
                        <Select
                          value={u.role}
                          onValueChange={(newRole) => {
                            if (newRole !== u.role) {
                              updateRoleMutation.mutate({ userId: u.id, role: newRole as any });
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs w-28 border-dashed">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["student", "professor", "company", "training_center", "admin", "user"].map(r => (
                              <SelectItem key={r} value={r} className="text-xs">{ROLE_LABELS[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* 재학생 전용: 채용공고 매칭 */}
                        {u.role === "student" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => { setMatchTarget({ id: u.id, name: u.name ?? "이름 없음" }); setMatchedJobId(null); setJobSearch(""); }}
                          >
                            <Briefcase size={14} /> 채용 매칭
                          </Button>
                        )}

                        {/* 승인 대기 */}
                        {u.status === "pending" && (
                          <>
                            <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => approveUser.mutate({ userId: u.id, status: "approved" })}>
                              <UserCheck size={14} /> 승인
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200" onClick={() => rejectUser.mutate({ userId: u.id, status: "rejected" })}>
                              <UserX size={14} /> 반려
                            </Button>
                          </>
                        )}

                        {/* 삭제 */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => setDeleteTarget({ id: u.id, name: u.name ?? "이름 없음" })}
                        >
                          <Trash2 size={14} /> 삭제
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {users.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">회원이 없습니다.</div>
              )}
            </div>
          </TabsContent>

          {/* ─── ④ 매칭 이력 탭 ─── */}
          <TabsContent value="history">
            <div className="overflow-x-auto">
              {(matchHistory as any[]).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">매칭 이력이 없습니다.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">학생명</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">학번</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">지원 공고</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">기업명</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">지원 상태</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">지원일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(matchHistory as any[]).map((item: any, idx: number) => {
                      const status = item.application?.status ?? "지원완료";
                      const cfg = APP_STATUS_CONFIG[status] ?? APP_STATUS_CONFIG["지원완료"];
                      return (
                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 pr-4 font-medium">{item.student?.name ?? "-"}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{item.profile?.studentId ?? "-"}</td>
                          <td className="py-2.5 pr-4 max-w-[160px] truncate">{item.posting?.title ?? "-"}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{item.company?.companyName ?? "-"}</td>
                          <td className="py-2.5 pr-4">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                              {cfg.icon} {status}
                            </span>
                          </td>
                          <td className="py-2.5 text-muted-foreground text-xs">
                            {item.application?.createdAt
                              ? new Date(item.application.createdAt).toLocaleDateString("ko-KR")
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── 삭제 확인 모달 ─── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">회원 삭제</DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span> 회원을 삭제하시겠습니까?<br />
              <span className="text-red-500 text-xs">포트폴리오, 지원 이력, 자기소개서 등 모든 데이터가 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="destructive" disabled={deleteUserMutation.isPending}
              onClick={() => deleteTarget && deleteUserMutation.mutate({ userId: deleteTarget.id })}>
              {deleteUserMutation.isPending ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── 단건 채용공고 매칭 모달 ─── */}
      <Dialog open={!!matchTarget} onOpenChange={(o) => { if (!o) { setMatchTarget(null); setMatchedJobId(null); setJobSearch(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase size={18} className="text-blue-500" /> 채용공고 매칭
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">{matchTarget?.name}</span> 재학생에게 매칭할 채용공고를 선택하세요.<br />
              <span className="text-xs text-muted-foreground">선택 후 매칭하면 재학생 지원 현황에 자동 등록되고 알림이 전송됩니다.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="공고명, 기업명 검색..." value={jobSearch} onChange={e => setJobSearch(e.target.value)} className="pl-9 text-sm" />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {filteredPostings.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">승인된 채용공고가 없습니다.</p>
            ) : filteredPostings.map((p: any) => {
              const isSelected = matchedJobId === p.posting?.id;
              return (
                <button key={p.posting?.id} type="button" onClick={() => setMatchedJobId(p.posting?.id ?? null)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors flex items-start gap-3 ${isSelected ? "border-blue-400 bg-blue-50" : "border-border hover:bg-muted/40"}`}>
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-blue-500 bg-blue-500" : "border-muted-foreground"}`}>
                    {isSelected && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.posting?.title ?? "-"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 size={11} /> {p.company?.companyName ?? "기업명 없음"}
                      {p.posting?.jobType && <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-xs">{p.posting.jobType}</span>}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setMatchTarget(null); setMatchedJobId(null); setJobSearch(""); }}>취소</Button>
            <Button disabled={!matchedJobId || matchJobMutation.isPending}
              onClick={() => matchTarget && matchedJobId && matchJobMutation.mutate({ studentUserId: matchTarget.id, jobPostingId: matchedJobId })}>
              {matchJobMutation.isPending ? "매칭 중..." : "매칭하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── ⑤ 일괄 매칭 모달 ─── */}
      <Dialog open={bulkModalOpen} onOpenChange={(o) => { if (!o) { setBulkModalOpen(false); setBulkJobId(null); setBulkJobSearch(""); setSelectedStudentIds(new Set()); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={18} className="text-blue-500" /> 일괄 채용 매칭
            </DialogTitle>
            <DialogDescription>
              재학생을 선택하고 매칭할 채용공고를 고르세요. 선택된 모든 재학생에게 동시에 매칭됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* 재학생 선택 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">재학생 선택</p>
                <button type="button" onClick={toggleAllStudents} className="text-xs text-blue-600 hover:underline">
                  {selectedStudentIds.size === studentUsers.length ? "전체 해제" : "전체 선택"}
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 border rounded-lg p-2">
                {studentUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">재학생이 없습니다.</p>
                ) : studentUsers.map((u: any) => {
                  const checked = selectedStudentIds.has(u.id);
                  return (
                    <button key={u.id} type="button" onClick={() => toggleStudentSelect(u.id)}
                      className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${checked ? "bg-blue-50 text-blue-800" : "hover:bg-muted/40"}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${checked ? "border-blue-500 bg-blue-500" : "border-muted-foreground"}`}>
                        {checked && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <span className="truncate">{u.name ?? "이름 없음"}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{selectedStudentIds.size}명 선택됨</p>
            </div>

            {/* 공고 선택 */}
            <div>
              <p className="text-sm font-medium mb-2">채용공고 선택</p>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="공고명, 기업명..." value={bulkJobSearch} onChange={e => setBulkJobSearch(e.target.value)} className="pl-8 text-xs h-8" />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                {filteredBulkPostings.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">승인된 공고가 없습니다.</p>
                ) : filteredBulkPostings.map((p: any) => {
                  const isSelected = bulkJobId === p.posting?.id;
                  return (
                    <button key={p.posting?.id} type="button" onClick={() => setBulkJobId(p.posting?.id ?? null)}
                      className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded text-sm transition-colors ${isSelected ? "bg-blue-50 text-blue-800" : "hover:bg-muted/40"}`}>
                      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-blue-500 bg-blue-500" : "border-muted-foreground"}`}>
                        {isSelected && <CheckCircle2 size={9} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{p.posting?.title ?? "-"}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.company?.companyName ?? "-"}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setBulkModalOpen(false); setBulkJobId(null); setBulkJobSearch(""); setSelectedStudentIds(new Set()); }}>취소</Button>
            <Button
              disabled={selectedStudentIds.size === 0 || !bulkJobId || bulkMatchMutation.isPending}
              onClick={() => bulkJobId && bulkMatchMutation.mutate({ studentUserIds: Array.from(selectedStudentIds), jobPostingId: bulkJobId })}
            >
              {bulkMatchMutation.isPending ? "매칭 중..." : `${selectedStudentIds.size}명 일괄 매칭`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
