import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  FolderCheck,
  Bot,
  Briefcase,
  Building2,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  FolderOpen,
  TrendingUp,
  Award,
  Building,
  CheckSquare,
  Activity,
  Map,
  PieChart,
  Trophy,
  Target,
  PencilLine,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import NotificationDropdown from "./NotificationDropdown";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
};

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "student":
      return [
        { label: "홈", href: "/student", icon: <Home size={18} /> },
        { label: "포트폴리오 관리", href: "/student/portfolio", icon: <FolderOpen size={18} /> },
        { label: "AI 역량 분석", href: "/student/ai-analysis", icon: <Bot size={18} /> },
        { label: "AI 자기소개서", href: "/student/cover-letter", icon: <FileText size={18} /> },
        { label: "채용공고", href: "/student/jobs", icon: <Briefcase size={18} /> },
        { label: "희망기업 매칭", href: "/student/job-matching", icon: <Target size={18} /> },
        { label: "채용공고 첨삭", href: "/student/job-coaching", icon: <PencilLine size={18} /> },
        { label: "지원 현황", href: "/student/applications", icon: <ClipboardList size={18} /> },
        { label: "서류 등록 센터", href: "/student/documents", icon: <FolderCheck size={18} /> },
        { label: "진로 진행 현황", href: "/student/career-progress", icon: <TrendingUp size={18} /> },
        { label: "내 프로필", href: "/student/profile", icon: <Settings size={18} /> },
        { label: "사용 매뉴얼", href: "/manual", icon: <BookOpen size={18} /> },
      ];
    case "professor":
      return [
        { label: "대시보드", href: "/professor", icon: <LayoutDashboard size={18} /> },
        { label: "학생 관리", href: "/professor/students", icon: <Users size={18} /> },
        { label: "서류 검토", href: "/professor/documents", icon: <FolderCheck size={18} /> },
        { label: "채용공고 첨삭", href: "/admin/job-coaching", icon: <PencilLine size={18} /> },
        { label: "진로지도 카드", href: "/admin/career-guidance", icon: <Map size={18} /> },
        { label: "업체 파이프라인", href: "/admin/pipeline", icon: <Building size={18} /> },
        { label: "취업률 현황", href: "/admin/employment-stats", icon: <PieChart size={18} /> },
        { label: "취업 축하 배너", href: "/admin/banners", icon: <Trophy size={18} /> },
        { label: "통계 & 보고서", href: "/professor/stats", icon: <BarChart3 size={18} /> },
        { label: "사용 매뉴얼", href: "/manual", icon: <BookOpen size={18} /> },
      ];
    case "company":
      return [
        { label: "인재 탐색", href: "/company/talent", icon: <Users size={18} /> },
        { label: "채용공고 관리", href: "/company/postings", icon: <Briefcase size={18} /> },
      ];
    case "training_center":
      return [
        { label: "대시보드", href: "/training", icon: <LayoutDashboard size={18} /> },
        { label: "협력기업 관리", href: "/training/companies", icon: <Building2 size={18} /> },
        { label: "AI 매칭", href: "/training/matching", icon: <Bot size={18} /> },
        { label: "채용공고 첨삭", href: "/admin/job-coaching", icon: <PencilLine size={18} /> },
        { label: "사용 매뉴얼", href: "/manual", icon: <BookOpen size={18} /> },
      ];
    case "admin":
      return [
        { label: "대시보드", href: "/admin", icon: <LayoutDashboard size={18} /> },
        { label: "회원 관리", href: "/admin/users", icon: <Users size={18} /> },
        { label: "공고 승인", href: "/admin/postings", icon: <CheckSquare size={18} /> },
        { label: "채용공고 첨삭", href: "/admin/job-coaching", icon: <PencilLine size={18} /> },
        { label: "AI 로그", href: "/admin/ai-logs", icon: <Activity size={18} /> },
        { label: "진로지도 카드", href: "/admin/career-guidance", icon: <Map size={18} /> },
        { label: "업체 파이프라인", href: "/admin/pipeline", icon: <Building size={18} /> },
        { label: "취업률 현황", href: "/admin/employment-stats", icon: <PieChart size={18} /> },
        { label: "취업 축하 배너", href: "/admin/banners", icon: <Trophy size={18} /> },
        { label: "사용 매뉴얼", href: "/manual", icon: <BookOpen size={18} /> },
      ];
    default:
      return [];
  }
}

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    student: "재학생",
    professor: "학과장",
    company: "협력기업",
    training_center: "공동훈련센터",
    admin: "관리자",
  };
  return map[role] ?? role;
}

function getRoleColor(role: string) {
  const map: Record<string, string> = {
    student: "bg-blue-500",
    professor: "bg-purple-500",
    company: "bg-orange-500",
    training_center: "bg-green-500",
    admin: "bg-red-500",
  };
  return map[role] ?? "bg-gray-500";
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const navItems = getNavItems(user?.role ?? "");

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight text-sidebar-foreground">CGD 취업지원</p>
            <p className="text-xs text-sidebar-foreground/60">서울시기술교육원</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold", getRoleColor(user?.role ?? ""))}>
            {user?.name?.[0] ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name ?? "사용자"}</p>
            <p className="text-xs text-sidebar-foreground/60">{getRoleLabel(user?.role ?? "")}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <Badge className="ml-auto text-xs bg-red-500 text-white">{item.badge}</Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={logout}
        >
          <LogOut size={18} />
          로그아웃
        </Button>
      </div>
    </div>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col border-r border-border">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 flex-shrink-0">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-60">
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {title && <h1 className="text-base font-semibold text-foreground">{title}</h1>}
          <div className="ml-auto flex items-center gap-2">
            <NotificationDropdown />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar (student only) */}
      {user?.role === "student" && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50">
          {[
            { href: "/student", icon: <Home size={20} />, label: "홈" },
            { href: "/student/portfolio", icon: <FolderOpen size={20} />, label: "포트폴리오" },
            { href: "/student/jobs", icon: <Briefcase size={20} />, label: "채용공고" },
            { href: "/student/ai-analysis", icon: <Bot size={20} />, label: "AI분석" },
            { href: "/student/profile", icon: <Settings size={20} />, label: "내정보" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center py-2 gap-1 text-muted-foreground hover:text-primary transition-colors"
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
