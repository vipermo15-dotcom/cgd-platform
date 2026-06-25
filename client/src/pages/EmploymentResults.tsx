import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Trophy, TrendingUp, Building2, Star, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function anonymizeName(name: string, useInitial: boolean): string {
  if (!useInitial || name.length < 2) return name;
  return name[0] + "○" + (name.length > 2 ? name.slice(2).replace(/./g, "○") : "");
}

export default function EmploymentResults() {
  const { data: banners = [] } = trpc.guidance.getActiveBanners.useQuery();
  const { data: stats } = trpc.guidance.getPublicStats.useQuery();

  const typedBanners = banners as {
    id: number;
    studentName: string;
    useInitial: boolean;
    companyName: string;
    jobTitle: string;
    message?: string;
    createdAt: string | Date;
  }[];

  const typedStats = stats as {
    totalEmployed: number;
    employmentRate: number;
    avgDaysToEmployment: number;
    topCompanies: { companyName: string; count: number }[];
    topJobTitles: { jobTitle: string; count: number }[];
  } | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="font-bold text-foreground">CGD 취업지원 플랫폼</span>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">홈으로</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
            <Trophy className="w-4 h-4" />
            취업 성공 현황
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            서울시기술교육원 CGD과 취업 결과
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            컴퓨터그래픽디자인과 교육생들의 취업 성공 사례를 소개합니다.
            여러분의 도전을 응원합니다.
          </p>
        </div>

        {/* 통계 카드 */}
        {typedStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "총 취업자", value: `${typedStats.totalEmployed}명`, icon: <Trophy className="w-5 h-5 text-amber-500" />, color: "border-amber-200 bg-amber-50" },
              { label: "취업률", value: `${typedStats.employmentRate}%`, icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, color: "border-emerald-200 bg-emerald-50" },
              { label: "평균 취업 기간", value: `${typedStats.avgDaysToEmployment}일`, icon: <Star className="w-5 h-5 text-blue-500" />, color: "border-blue-200 bg-blue-50" },
              { label: "협력 기업 수", value: `${typedStats.topCompanies.length}개+`, icon: <Building2 className="w-5 h-5 text-purple-500" />, color: "border-purple-200 bg-purple-50" },
            ].map((stat) => (
              <Card key={stat.label} className={`border ${stat.color}`}>
                <CardContent className="p-4 text-center">
                  <div className="flex justify-center mb-2">{stat.icon}</div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 취업 축하 배너 */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-foreground">취업 축하 🎉</h2>
          </div>

          {typedBanners.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>아직 등록된 취업 성공 사례가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {typedBanners.map((banner) => (
                <Card
                  key={banner.id}
                  className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        🎊
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">
                            {anonymizeName(banner.studentName, banner.useInitial)}
                          </span>
                          <span className="text-muted-foreground text-sm">님이</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                            {banner.companyName}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{banner.jobTitle}으로</span>
                        </div>
                        <p className="text-sm font-semibold text-amber-700 mt-1">취업에 성공했습니다! 🎉</p>
                        {banner.message && (
                          <p className="text-xs text-muted-foreground mt-2 italic">"{banner.message}"</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(banner.createdAt).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 상위 취업 기업 & 직무 */}
        {typedStats && (typedStats.topCompanies.length > 0 || typedStats.topJobTitles.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {typedStats.topCompanies.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-primary" />
                    주요 취업 기업
                  </h3>
                  <div className="space-y-2">
                    {typedStats.topCompanies.slice(0, 5).map((c, idx) => (
                      <div key={c.companyName} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
                          <span className="text-sm">{c.companyName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{c.count}명</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {typedStats.topJobTitles.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-primary" />
                    주요 취업 직무
                  </h3>
                  <div className="space-y-2">
                    {typedStats.topJobTitles.slice(0, 5).map((j, idx) => (
                      <div key={j.jobTitle} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
                          <span className="text-sm">{j.jobTitle}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{j.count}명</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Separator />

        {/* CTA */}
        <div className="text-center space-y-3 pb-6">
          <p className="text-muted-foreground text-sm">
            CGD 취업지원 플랫폼으로 여러분의 취업을 지원합니다.
          </p>
          <Link href="/">
            <Button className="gap-2">
              <GraduationCap className="w-4 h-4" />
              플랫폼 시작하기
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
