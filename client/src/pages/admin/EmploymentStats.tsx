import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  TrendingUp, Users, CheckCircle2, Clock, Search,
  Award, Building2, Calendar, Plus, Bell
} from "lucide-react";

export default function EmploymentStats() {
  const { data: stats, refetch } = trpc.guidance.getEmploymentStats.useQuery();
  const { data: banners = [], refetch: refetchBanners } = trpc.guidance.getActiveBanners.useQuery();
  const createBannerMutation = trpc.guidance.createBanner.useMutation({
    onSuccess: () => { refetchBanners(); toast.success("배너가 생성되었습니다."); setBannerOpen(false); },
    onError: () => toast.error("배너 생성 실패"),
  });
  const deactivateBannerMutation = trpc.guidance.deactivateBanner.useMutation({
    onSuccess: () => { refetchBanners(); toast.success("배너가 비활성화되었습니다."); },
  });

  const [bannerOpen, setBannerOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    studentUserId: 0, studentName: "", companyName: "", jobTitle: "",
    message: "", useInitial: true,
  });

  const employmentRate = stats?.employmentRate ?? 0;

  // 4단계 타임라인 데이터
  const stages = [
    { label: "수료 전", value: stats?.stages.preGraduation ?? 0, color: "bg-blue-500", desc: "재학 중 취업 확정" },
    { label: "D+30", value: stats?.stages.d30 ?? 0, color: "bg-emerald-500", desc: "수료 후 1개월 내" },
    { label: "D+60", value: stats?.stages.d60 ?? 0, color: "bg-amber-500", desc: "수료 후 2개월 내" },
    { label: "D+90", value: stats?.stages.d90 ?? 0, color: "bg-purple-500", desc: "수료 후 3개월 내" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">취업률 현황</h1>
          <p className="text-sm text-muted-foreground mt-1">수료전후 취업 추적 및 배너 관리</p>
        </div>
        <Button onClick={() => setBannerOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> 축하 배너 추가
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">전체 교육생</p>
                <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">취업 확정</p>
                <p className="text-2xl font-bold text-emerald-600">{stats?.employed ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">지원 중</p>
                <p className="text-2xl font-bold text-amber-600">{stats?.applying ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">취업률</p>
                <p className="text-2xl font-bold text-purple-600">{employmentRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 수료전후 4단계 타임라인 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" /> 수료전후 취업 타임라인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stages.map((stage, idx) => (
              <div key={idx} className="text-center space-y-2">
                <div className={`w-16 h-16 rounded-full ${stage.color} flex items-center justify-center mx-auto text-white text-xl font-bold`}>
                  {stage.value}
                </div>
                <p className="font-semibold text-sm">{stage.label}</p>
                <p className="text-xs text-muted-foreground">{stage.desc}</p>
                {idx < stages.length - 1 && (
                  <div className="hidden md:block absolute top-8 right-0 w-full h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
          {/* 진행 바 */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>전체 취업률</span>
              <span>{employmentRate}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${employmentRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 최근 취업 확정 학생 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> 최근 취업 확정
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentEmployed && stats.recentEmployed.length > 0 ? (
            <div className="space-y-3">
              {stats.recentEmployed.map((student, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
                      {student.name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {student.employedCompany ?? "미등록"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                    취업 확정
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">취업 확정 학생이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      {/* 취업 축하 배너 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> 취업 축하 배너 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          {banners.length > 0 ? (
            <div className="space-y-3">
              {banners.map((banner) => (
                <div key={banner.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200">
                  <div>
                    <p className="text-sm font-medium">
                      🎉 {banner.useInitial
                        ? banner.studentName.charAt(0) + "○" + (banner.studentName.length > 2 ? banner.studentName.charAt(banner.studentName.length - 1) : "")
                        : banner.studentName}님 → {banner.companyName} {banner.jobTitle} 취업!
                    </p>
                    {banner.message && <p className="text-xs text-muted-foreground mt-0.5">{banner.message}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deactivateBannerMutation.mutate({ id: banner.id })}
                  >
                    숨기기
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6 text-sm">활성 배너가 없습니다.</p>
          )}
        </CardContent>
      </Card>

      {/* 배너 추가 모달 */}
      <Dialog open={bannerOpen} onOpenChange={setBannerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>취업 축하 배너 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>학생 이름</Label>
              <Input value={bannerForm.studentName} onChange={(e) => setBannerForm({ ...bannerForm, studentName: e.target.value })} placeholder="이름 입력" />
            </div>
            <div className="space-y-1">
              <Label>기업명</Label>
              <Input value={bannerForm.companyName} onChange={(e) => setBannerForm({ ...bannerForm, companyName: e.target.value })} placeholder="취업 기업명" />
            </div>
            <div className="space-y-1">
              <Label>직무</Label>
              <Input value={bannerForm.jobTitle} onChange={(e) => setBannerForm({ ...bannerForm, jobTitle: e.target.value })} placeholder="예: 브랜드 디자이너" />
            </div>
            <div className="space-y-1">
              <Label>메시지 (선택)</Label>
              <Input value={bannerForm.message} onChange={(e) => setBannerForm({ ...bannerForm, message: e.target.value })} placeholder="축하 메시지" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useInitial"
                checked={bannerForm.useInitial}
                onChange={(e) => setBannerForm({ ...bannerForm, useInitial: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="useInitial" className="cursor-pointer">이름 이니셜 처리 (개인정보 보호)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBannerOpen(false)}>취소</Button>
            <Button
              onClick={() => createBannerMutation.mutate({ ...bannerForm, studentUserId: bannerForm.studentUserId || 0 })}
              disabled={!bannerForm.studentName || !bannerForm.companyName || !bannerForm.jobTitle || createBannerMutation.isPending}
            >
              배너 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
