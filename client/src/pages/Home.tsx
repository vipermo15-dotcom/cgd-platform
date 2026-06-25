import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { GraduationCap, Bot, Briefcase, BarChart3, ArrowRight, Users, Building2, Award } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // 역할에 따라 대시보드로 리디렉션
      if (!user.role || user.role === "user") {
        navigate("/role-setup");
        return;
      }
      const roleRoutes: Record<string, string> = {
        student: "/student",
        professor: "/professor",
        company: "/company/talent",
        training_center: "/training",
        admin: "/admin",
      };
      navigate(roleRoutes[user.role] ?? "/role-setup");
    }
  }, [user, isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap size={20} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">CGD 취업지원 플랫폼</p>
              <p className="text-xs text-muted-foreground">서울시기술교육원 컴퓨터그래픽디자인과</p>
            </div>
          </div>
          <a href={getLoginUrl()}>
            <Button size="sm">로그인</Button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Award size={14} />
            컴퓨터그래픽디자인과 공식 취업지원 시스템
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            AI가 함께하는<br />
            <span className="text-primary">스마트 취업 준비</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            포트폴리오 관리부터 AI 역량 분석, 자기소개서 생성, 채용 연계까지
            취업의 모든 과정을 하나의 플랫폼에서 관리하세요.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="gap-2">
              시작하기 <ArrowRight size={18} />
            </Button>
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-10">주요 기능</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <GraduationCap size={24} className="text-blue-500" />,
                title: "포트폴리오 관리",
                desc: "이미지, 영상, YouTube URL을 활용한 포트폴리오 구성 및 공개 URL 생성",
                bg: "bg-blue-50",
              },
              {
                icon: <Bot size={24} className="text-purple-500" />,
                title: "AI 역량 분석",
                desc: "포트폴리오 기반 분야별 역량 점수 분석 및 레이더 차트 시각화",
                bg: "bg-purple-50",
              },
              {
                icon: <Briefcase size={24} className="text-orange-500" />,
                title: "채용 연계",
                desc: "협력기업 채용공고 탐색, AI 맞춤 추천, 지원 상태 실시간 추적",
                bg: "bg-orange-50",
              },
              {
                icon: <BarChart3 size={24} className="text-green-500" />,
                title: "통계 & 보고서",
                desc: "취업률 통계, HRD-Net 보고서 Excel/PDF 다운로드 지원",
                bg: "bg-green-50",
              },
            ].map((f) => (
              <Card key={f.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-10">역할별 서비스</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { role: "재학생", icon: <GraduationCap size={20} />, color: "text-blue-600 bg-blue-100", desc: "포트폴리오·AI분석·채용지원" },
              { role: "학과장", icon: <Users size={20} />, color: "text-purple-600 bg-purple-100", desc: "학생관리·통계·보고서" },
              { role: "협력기업", icon: <Building2 size={20} />, color: "text-orange-600 bg-orange-100", desc: "인재탐색·채용공고·지원자관리" },
              { role: "공동훈련센터", icon: <Building2 size={20} />, color: "text-green-600 bg-green-100", desc: "기업관리·AI매칭·통계" },
              { role: "관리자", icon: <Award size={20} />, color: "text-red-600 bg-red-100", desc: "회원승인·공고관리·AI로그" },
            ].map((r) => (
              <div key={r.role} className="text-center p-5 bg-card rounded-xl border border-border">
                <div className={`w-10 h-10 rounded-full ${r.color} flex items-center justify-center mx-auto mb-3`}>
                  {r.icon}
                </div>
                <p className="font-semibold text-sm mb-1">{r.role}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 서울시기술교육원 컴퓨터그래픽디자인과 취업지원 플랫폼</p>
        </div>
      </footer>
    </div>
  );
}
