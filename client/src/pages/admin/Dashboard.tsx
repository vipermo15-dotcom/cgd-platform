import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, Briefcase, FileText, Bot, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: stats } = trpc.admin.getStats.useQuery();

  return (
    <AppLayout title="관리자 대시보드">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "전체 회원", value: stats?.totalStudents ?? 0, icon: <Users size={18} />, color: "text-blue-500", bg: "bg-blue-50", href: "/admin/users" },
            { label: "채용공고", value: stats?.totalPostings ?? 0, icon: <Briefcase size={18} />, color: "text-purple-500", bg: "bg-purple-50", href: "/admin/postings" },
            { label: "포트폴리오", value: stats?.totalPortfolios ?? 0, icon: <FileText size={18} />, color: "text-emerald-500", bg: "bg-emerald-50", href: "/admin/users" },
            { label: "AI 분석", value: stats?.totalApplications ?? 0, icon: <Bot size={18} />, color: "text-orange-500", bg: "bg-orange-50", href: "/admin/ai-logs" },
          ].map((s) => (
            <Link key={s.label} href={s.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 ${s.color}`}>
                    {s.icon}
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "회원 관리", desc: "가입 승인 및 역할 관리", href: "/admin/users" },
            { title: "채용공고 승인", desc: "기업 등록 공고 검토 및 승인", href: "/admin/postings" },
            { title: "AI 로그", desc: "AI 분석 사용량 및 토큰 모니터링", href: "/admin/ai-logs" },
          ].map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <ArrowRight size={18} className="text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
