import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <GraduationCap size={32} className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">CGD 취업지원 플랫폼</h1>
        <p className="text-muted-foreground mb-8">서울시기술교육원 컴퓨터그래픽디자인과</p>
        <a href={getLoginUrl()}>
          <Button size="lg">Manus 계정으로 로그인</Button>
        </a>
      </div>
    </div>
  );
}
