import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Users, TrendingUp, Award, Briefcase, ArrowRight,
  CheckCircle2, Clock, XCircle, Star, ChevronDown, ChevronUp, HelpCircle,
} from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_CONFIG: Record<string, { label: string; color: string; activeColor: string; rowBg: string; icon: React.ReactNode }> = {
  "지원완료": { label: "지원완료", color: "bg-blue-100 text-blue-700",     activeColor: "bg-blue-500 text-white",     rowBg: "",                          icon: <Clock size={12} /> },
  "서류합격": { label: "서류합격", color: "bg-yellow-100 text-yellow-700", activeColor: "bg-yellow-500 text-white",   rowBg: "",                          icon: <CheckCircle2 size={12} /> },
  "면접":     { label: "면접",     color: "bg-purple-100 text-purple-700", activeColor: "bg-purple-500 text-white",   rowBg: "",                          icon: <Star size={12} /> },
  "최종합격": { label: "최종합격", color: "bg-emerald-100 text-emerald-700", activeColor: "bg-emerald-500 text-white", rowBg: "bg-emerald-50",             icon: <CheckCircle2 size={12} /> },
  "탈락":     { label: "탈락",     color: "bg-red-100 text-red-700",       activeColor: "bg-red-500 text-white",      rowBg: "bg-red-50",                 icon: <XCircle size={12} /> },
};

const PAGE_SIZE = 10;

// AI 추천 기준 툴팁
function AiTooltip() {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="ml-1 text-blue-400 hover:text-blue-600 transition-colors focus:outline-none"
        aria-label="AI 추천 기준 안내"
      >
        <HelpCircle size={14} />
      </button>
      {visible && (
        <span className="absolute left-6 top-0 z-50 w-64 rounded-lg border border-blue-200 bg-white p-3 shadow-lg text-xs text-gray-700 leading-relaxed">
          <span className="block font-semibold text-blue-700 mb-1">AI 추천 기준</span>
          <span className="block mb-0.5">• <b>포트폴리오 역량 점수</b>: AI가 분석한 재학생의 디자인·기술 역량 점수</span>
          <span className="block mb-0.5">• <b>공고 요건 적합도</b>: 공고에 명시된 직무·기술 스택과 학생 역량의 일치율</span>
          <span className="block mb-0.5">• <b>지원 이력</b>: 이전 지원 공고의 분야·규모 패턴 반영</span>
          <span className="block text-blue-500 mt-1">두 점수를 종합해 적합도 높은 공고 순으로 정렬합니다.</span>
        </span>
      )}
    </span>
  );
}

// URL 쿼리 파라미터 헬퍼
function getSearchParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export default function ProfessorDashboard() {
  const [, setLocation] = useLocation();

  const { data: stats } = trpc.professor.getDashboardStats.useQuery();
  const { data: monthlyData = [] } = trpc.professor.getMonthlyStats.useQuery();
  const { data: matchingData = [], isLoading: matchingLoading } = trpc.professor.getJobMatchingStatus.useQuery();

  // ① URL 파라미터에서 초기 필터 값 읽기
  const [activeFilter, setActiveFilter] = useState<string | null>(() => getSearchParam("status"));
  // ② 더 보기: 표시할 페이지 수
  const [page, setPage] = useState(1);
  // 안내 배너 접기/펼치기
  const [guideOpen, setGuideOpen] = useState(true);

  // 필터 변경 시 URL 파라미터 동기화 + 페이지 초기화
  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
    setPage(1);
    const params = new URLSearchParams(window.location.search);
    if (filter) {
      params.set("status", filter);
    } else {
      params.delete("status");
    }
    const newSearch = params.toString();
    setLocation(`/professor/dashboard${newSearch ? "?" + newSearch : ""}`, { replace: true });
  };

  // 브라우저 뒤로가기/앞으로가기 시 URL 파라미터 반영
  useEffect(() => {
    const onPop = () => setActiveFilter(getSearchParam("status"));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // 상태별 집계
  const statusCount = (matchingData as any[]).reduce((acc: Record<string, number>, item: any) => {
    const s = item.application?.status ?? "지원완료";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  // 필터 적용
  const filtered = activeFilter
    ? (matchingData as any[]).filter((item: any) => (item.application?.status ?? "지원완료") === activeFilter)
    : (matchingData as any[]);

  // ② 페이지네이션
  const displayList = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = displayList.length < filtered.length;

  return (
    <AppLayout title="학과장 대시보드">
      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "전체 재학생", value: stats?.totalStudents ?? 0, icon: <Users size={18} />, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "취업 확정", value: stats?.employedStudents ?? 0, icon: <Award size={18} />, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "취업률", value: `${stats?.employmentRate ?? 0}%`, icon: <TrendingUp size={18} />, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "총 지원건수", value: stats?.totalApplications ?? 0, icon: <Briefcase size={18} />, color: "text-orange-500", bg: "bg-orange-50" },
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">월별 취업률 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v) => [`${v}%`, "취업률"]} />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Employment status breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">취업 현황 분포</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "취업확정", value: stats?.employedStudents ?? 0, color: "bg-emerald-500" },
                { label: "포트폴리오", value: stats?.totalPortfolios ?? 0, color: "bg-blue-500" },
                { label: "공고수", value: stats?.totalPostings ?? 0, color: "bg-yellow-500" },
                { label: "총지원", value: stats?.totalApplications ?? 0, color: "bg-gray-400" },
              ].map((item) => {
                const total = stats?.totalStudents || 1;
                const pct = Math.round((item.value / total) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium">{item.value}명 ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* ─── 채용공고 매칭 현황 ─────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">채용공고 매칭 현황</CardTitle>
              {/* ① 상태 배지 필터 (URL 파라미터 연동) */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleFilterChange(null)}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium border transition-colors ${
                    activeFilter === null
                      ? "bg-gray-700 text-white border-gray-700"
                      : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  전체 ({(matchingData as any[]).length})
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const isActive = activeFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleFilterChange(isActive ? null : key)}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium border transition-colors ${
                        isActive
                          ? cfg.activeColor + " border-transparent"
                          : cfg.color + " border-transparent hover:opacity-80"
                      }`}
                    >
                      {cfg.icon} {cfg.label} ({statusCount[key] ?? 0})
                    </button>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* 안내 배너 */}
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 overflow-hidden">
              <button
                type="button"
                onClick={() => setGuideOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-100 transition-colors"
              >
                <span>채용공고 매칭이란?</span>
                {guideOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {guideOpen && (
                <div className="px-4 pb-3">
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>교육생이 <span className="font-medium">채용공고 목록</span>에서 관심 공고에 지원하면 자동으로 이 목록에 등록됩니다.</li>
                    <li>협력기업이 지원자를 검토한 후 <span className="font-medium">서류합격 → 면접 → 최종합격</span> 순으로 지원 상태를 변경합니다.</li>
                    <li>학과장은 이 화면에서 <span className="font-medium">전체 재학생의 지원 현황과 진행 단계</span>를 실시간으로 모니터링할 수 있습니다.</li>
                  </ol>
                  <p className="text-xs text-blue-500 mt-2 flex items-center gap-0.5">
                    ⚡ AI 추천 기능을 활용하면 재학생의 포트폴리오 역량 점수와 공고 요건을 분석해 적합도 높은 공고를 자동으로 추천합니다.
                    <AiTooltip />
                  </p>
                </div>
              )}
            </div>

            {/* 테이블 */}
            {matchingLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">불러오는 중...</div>
            ) : displayList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {activeFilter
                  ? `'${STATUS_CONFIG[activeFilter]?.label}' 상태의 지원 내역이 없습니다.`
                  : "아직 지원 내역이 없습니다."
                }<br />
                {!activeFilter && "재학생이 채용공고에 지원하면 여기에 표시됩니다."}
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                    {displayList.map((item: any, idx: number) => {
                      const status = item.application?.status ?? "지원완료";
                      const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["지원완료"];
                      return (
                        // ③ 최종합격/탈락 행 배경색 강조
                        <tr
                          key={idx}
                          className={`border-b last:border-0 transition-colors ${
                            cfg.rowBg
                              ? `${cfg.rowBg} hover:opacity-90`
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <td className="py-2.5 pr-4 font-medium">{item.student?.name ?? "-"}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{item.profile?.studentId ?? "-"}</td>
                          <td className="py-2.5 pr-4 max-w-[160px] truncate">{item.posting?.title ?? "-"}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{item.company?.companyName ?? "-"}</td>
                          <td className="py-2.5 pr-4">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                              {cfg.icon} {cfg.label}
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

                {/* ② 더 보기 버튼 */}
                {hasMore && (
                  <div className="text-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      className="gap-1"
                    >
                      <ChevronDown size={14} />
                      더 보기 ({displayList.length}/{filtered.length}건 표시 중)
                    </Button>
                  </div>
                )}
                {!hasMore && filtered.length > PAGE_SIZE && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    전체 {filtered.length}건 모두 표시됨
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/professor/students">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-blue-500" />
                  <div>
                    <p className="font-medium">학생 관리</p>
                    <p className="text-xs text-muted-foreground">피드백 작성 및 취업 현황 관리</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/professor/stats">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp size={20} className="text-purple-500" />
                  <div>
                    <p className="font-medium">통계 & 보고서</p>
                    <p className="text-xs text-muted-foreground">HRD-Net 보고서 Excel/PDF 다운로드</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
