import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  MessageSquare,
  MessageSquarePlus,
  Settings,
  Users,
  FolderOpen,
  TrendingUp,
  Trophy,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import NotificationDropdown from "./NotificationDropdown";

// ─── 업데이트 알림 패널 ───────────────────────────────────────────────────────

const APP_VERSION = "2.7";
const SEEN_KEY = `cgd-seen-v${APP_VERSION}`;

const UPDATE_LOG = [
  {
    version: "2.7",
    date: "2026-06-29",
    label: "AI 에이전트 대폭 확장",
    items: [
      "AI 포트폴리오 코치 · 점수 · 자기소개서",
      "AI 면접 준비 · 학습 로드맵",
      "AI 취업 준비도(0~100점) · 주간 리포트",
      "관리자 사전 설문 결과 탭 + 첨삭 적용 버튼",
    ],
  },
  {
    version: "2.6",
    date: "2026-06-22",
    label: "진로지도 사전 설문 + 채팅",
    items: [
      "교육생 사전 설문 5단계 위저드",
      "진로 채팅 AI 상담",
      "내 진로카드 탭",
    ],
  },
];

function UpdatePanel() {
  const [open, setOpen] = useState(false);
  const isNew = !localStorage.getItem(SEEN_KEY);

  const handleOpen = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
        title="업데이트 소식"
      >
        <Bell size={18} strokeWidth={1.75} className="text-muted-foreground" />
        {isNew && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-80 p-0">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles size={16} strokeWidth={1.75} className="text-primary" />
              <h2 className="font-semibold text-sm">업데이트 소식</h2>
              <Badge className="text-xs bg-primary text-white">v{APP_VERSION}</Badge>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-65px)]">
            <div className="p-5 space-y-5">
              {UPDATE_LOG.map((log) => (
                <div key={log.version}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">v{log.version}</Badge>
                    <span className="text-xs text-muted-foreground">{log.date}</span>
                  </div>
                  <p className="text-sm font-medium mb-2">{log.label}</p>
                  <ul className="space-y-1.5">
                    {log.items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="text-primary shrink-0 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Separator className="mt-4" />
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pb-2">이전 버전 내용은 관리자 대시보드에서 확인하세요.</p>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── 좌측 아이콘 레일 — B시안(진도 그리드형) 내비게이션 ───────────────────────
// 역할별 최상위 메뉴는 3~4개로 제한하고, 기존에 있던 세부 페이지는
// 각 그룹의 서브탭(칩)으로 이동시켜 라우트를 하나도 잃지 않는다.

type SubItem = { label: string; href: string };

type RailGroup = {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  primaryLabel?: string;
  subItems?: SubItem[];
};

type ProfileItem = { label: string; href: string; icon: React.ReactNode };

const ICON = 21;
const STROKE = 1.75;

function getRailGroups(role: string): RailGroup[] {
  switch (role) {
    case "student":
      return [
        { key: "home", label: "홈", href: "/student", icon: <Home size={ICON} strokeWidth={STROKE} /> },
        {
          key: "progress", label: "내 진도", href: "/student/career-progress",
          primaryLabel: "진로 진행 현황",
          icon: <TrendingUp size={ICON} strokeWidth={STROKE} />,
          subItems: [
            { label: "지원 현황", href: "/student/applications" },
            { label: "채용공고", href: "/student/jobs" },
            { label: "희망기업 매칭", href: "/student/job-matching" },
            { label: "채용공고 첨삭", href: "/student/job-coaching" },
          ],
        },
        {
          key: "portfolio", label: "포트폴리오", href: "/student/portfolio",
          icon: <FolderOpen size={ICON} strokeWidth={STROKE} />,
          subItems: [{ label: "서류 등록 센터", href: "/student/documents" }],
        },
        {
          key: "counseling", label: "상담", href: "/student/ai-agents",
          primaryLabel: "AI 취업진로 에이전트",
          icon: <MessageSquare size={ICON} strokeWidth={STROKE} />,
          subItems: [
            { label: "AI 자기소개서", href: "/student/cover-letter" },
            { label: "AI 역량 분석", href: "/student/ai-analysis" },
          ],
        },
      ];
    case "admin":
      return [
        {
          key: "home", label: "홈", href: "/admin",
          primaryLabel: "대시보드",
          icon: <Home size={ICON} strokeWidth={STROKE} />,
          subItems: [{ label: "AI 로그", href: "/admin/ai-logs" }],
        },
        {
          key: "students", label: "교육생", href: "/admin/users",
          primaryLabel: "회원 관리",
          icon: <Users size={ICON} strokeWidth={STROKE} />,
          subItems: [
            { label: "진로지도 카드", href: "/admin/career-guidance" },
            { label: "AI 자동 매칭", href: "/admin/ai-matching" },
            { label: "채용공고 첨삭", href: "/admin/job-coaching" },
          ],
        },
        {
          key: "progress-status", label: "진도 현황", href: "/admin/student-readiness",
          primaryLabel: "취업 준비율",
          icon: <TrendingUp size={ICON} strokeWidth={STROKE} />,
          subItems: [
            { label: "취업률 현황", href: "/admin/employment-stats" },
            { label: "사후지도", href: "/admin/follow-up" },
          ],
        },
        {
          key: "jobs-companies", label: "취업·업체", href: "/admin/pipeline",
          primaryLabel: "업체 파이프라인",
          icon: <Briefcase size={ICON} strokeWidth={STROKE} />,
          subItems: [{ label: "공고 승인", href: "/admin/postings" }],
        },
      ];
    case "professor":
      // 교수 전용 라우트(/professor/*) 기준 — /admin, /admin/users, /admin/ai-logs, /admin/postings는
      // RoleGuard가 admin 전용으로 막고 있어 교수 계정에서는 열리지 않는다.
      return [
        {
          key: "home", label: "홈", href: "/professor",
          primaryLabel: "대시보드",
          icon: <Home size={ICON} strokeWidth={STROKE} />,
        },
        {
          key: "students", label: "교육생", href: "/professor/students",
          primaryLabel: "학생 관리",
          icon: <Users size={ICON} strokeWidth={STROKE} />,
          subItems: [
            { label: "서류 검토", href: "/professor/documents" },
            { label: "진로지도 카드", href: "/admin/career-guidance" },
            { label: "AI 자동 매칭", href: "/admin/ai-matching" },
          ],
        },
        {
          key: "progress-status", label: "진도 현황", href: "/admin/student-readiness",
          primaryLabel: "취업 준비율",
          icon: <TrendingUp size={ICON} strokeWidth={STROKE} />,
          subItems: [
            { label: "취업률 현황", href: "/admin/employment-stats" },
            { label: "통계 & 보고서", href: "/professor/stats" },
            { label: "사후지도", href: "/admin/follow-up" },
          ],
        },
        {
          key: "jobs-companies", label: "취업·업체", href: "/admin/pipeline",
          primaryLabel: "업체 파이프라인",
          icon: <Briefcase size={ICON} strokeWidth={STROKE} />,
          subItems: [{ label: "채용공고 첨삭", href: "/admin/job-coaching" }],
        },
      ];
    case "training_center":
      return [
        {
          key: "home", label: "홈", href: "/training",
          primaryLabel: "대시보드",
          icon: <Home size={ICON} strokeWidth={STROKE} />,
          subItems: [
            { label: "AI 자동 매칭", href: "/admin/ai-matching" },
            { label: "채용공고 첨삭", href: "/admin/job-coaching" },
          ],
        },
        {
          key: "org-status", label: "기관 현황", href: "/admin/student-readiness",
          primaryLabel: "취업 준비율",
          icon: <Building2 size={ICON} strokeWidth={STROKE} />,
          subItems: [
            { label: "교육생 관리 (열람)", href: "/professor/students" },
            { label: "진로지도 카드", href: "/admin/career-guidance" },
            { label: "협력기업 관리", href: "/training/companies" },
            { label: "AI 기업-학생 매칭", href: "/training/matching" },
            { label: "업체 파이프라인", href: "/admin/pipeline" },
          ],
        },
        {
          key: "report", label: "리포트", href: "/admin/employment-stats",
          primaryLabel: "취업률 현황",
          icon: <FileText size={ICON} strokeWidth={STROKE} />,
          subItems: [{ label: "사후지도", href: "/admin/follow-up" }],
        },
      ];
    case "company":
      return [
        { key: "postings", label: "채용공고", href: "/company/postings", icon: <Briefcase size={ICON} strokeWidth={STROKE} /> },
        { key: "talent", label: "실습생", href: "/company/talent", primaryLabel: "인재 탐색", icon: <Users size={ICON} strokeWidth={STROKE} /> },
      ];
    default:
      return [];
  }
}

function getProfileItems(role: string): ProfileItem[] {
  const common: ProfileItem[] = [
    { label: "학습 자료 허브", href: "/learning-hub", icon: <GraduationCap size={16} strokeWidth={STROKE} /> },
    { label: "사용 매뉴얼", href: "/manual", icon: <BookOpen size={16} strokeWidth={STROKE} /> },
    { label: "플랫폼 피드백", href: "/feedback", icon: <MessageSquarePlus size={16} strokeWidth={STROKE} /> },
  ];
  switch (role) {
    case "student":
      return [
        { label: "내 프로필", href: "/student/profile", icon: <Settings size={16} strokeWidth={STROKE} /> },
        ...common,
      ];
    case "professor":
    case "admin":
      return [
        ...common,
        { label: "취업 축하 배너", href: "/admin/banners", icon: <Trophy size={16} strokeWidth={STROKE} /> },
        { label: "피드백 결과 보기", href: "/admin/feedback-results", icon: <BarChart3 size={16} strokeWidth={STROKE} /> },
      ];
    case "training_center":
      return [...common, { label: "피드백 결과 보기", href: "/admin/feedback-results", icon: <BarChart3 size={16} strokeWidth={STROKE} /> }];
    default:
      return [];
  }
}

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    student: "재학생",
    professor: "교수 (관리자)",
    company: "협력기업",
    training_center: "공동훈련센터",
    admin: "학과장 (관리자)",
  };
  return map[role] ?? role;
}

function getActiveGroupKey(groups: RailGroup[], location: string): string | undefined {
  let best: { key: string; len: number } | undefined;
  for (const g of groups) {
    const hrefs = [g.href, ...(g.subItems?.map((s) => s.href) ?? [])];
    for (const href of hrefs) {
      if (location === href || location.startsWith(href + "/")) {
        if (!best || href.length > best.len) best = { key: g.key, len: href.length };
      }
    }
  }
  return best?.key;
}

function ProfileMenu({ align = "start" }: { align?: "start" | "end" }) {
  const { user, logout } = useAuth();
  const items = getProfileItems(user?.role ?? "");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-[34px] h-[34px] rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-semibold hover:opacity-80 transition-opacity shrink-0"
          title={user?.name ?? "내 프로필"}
        >
          {user?.name?.[0] ?? "?"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel>
          <p className="text-sm font-medium truncate">{user?.name ?? "사용자"}</p>
          <p className="text-xs font-normal text-muted-foreground">{getRoleLabel(user?.role ?? "")}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} className="flex items-center gap-2">
              {item.icon}
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-destructive focus:text-destructive">
          <LogOut size={16} strokeWidth={STROKE} />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function IconRail({ groups, activeKey }: { groups: RailGroup[]; activeKey?: string }) {
  return (
    <aside className="hidden md:flex w-24 flex-shrink-0 flex-col items-center bg-sidebar border-r border-sidebar-border py-5">
      <Link href="/" className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center mb-6 shrink-0">
        <GraduationCap size={20} strokeWidth={STROKE} className="text-white" />
      </Link>

      <nav className="flex-1 flex flex-col items-center gap-1.5 w-full px-2">
        {groups.map((g) => {
          const isActive = g.key === activeKey;
          return (
            <Link
              key={g.key}
              href={g.href}
              className={cn(
                "w-full flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {g.icon}
              <span className="text-[11px] leading-none">{g.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-2">
        <ProfileMenu align="end" />
      </div>
    </aside>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const groups = getRailGroups(user?.role ?? "");
  const activeKey = getActiveGroupKey(groups, location);
  const activeGroup = groups.find((g) => g.key === activeKey);
  const chips: SubItem[] | undefined = activeGroup?.subItems?.length
    ? [{ label: activeGroup.primaryLabel ?? activeGroup.label, href: activeGroup.href }, ...activeGroup.subItems]
    : undefined;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <IconRail groups={groups} activeKey={activeKey} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-sidebar-border bg-card flex items-center px-4 md:px-8 gap-4 flex-shrink-0">
          {/* Mobile logo (rail hidden below md) */}
          <Link href="/" className="md:hidden w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <GraduationCap size={16} strokeWidth={STROKE} className="text-white" />
          </Link>

          {/* 칩이 있는 화면은 모바일에서 타이틀과 첫 칩이 중복되므로 타이틀을 데스크톱에만 노출 */}
          {title && (
            <h1 className={cn("text-base font-semibold text-foreground shrink-0", chips && "hidden md:block")}>
              {title}
            </h1>
          )}

          {chips && (
            <div className="flex-1 min-w-0 overflow-x-auto">
              <div className="flex items-center gap-2 w-max">
                {chips.map((chip) => {
                  const isChipActive = location === chip.href || location.startsWith(chip.href + "/");
                  return (
                    <Link
                      key={chip.href}
                      href={chip.href}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors border",
                        isChipActive
                          ? "bg-secondary text-secondary-foreground border-transparent font-medium"
                          : "text-muted-foreground border-border hover:bg-accent"
                      )}
                    >
                      {chip.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="ml-auto flex items-center gap-1 shrink-0">
            <UpdatePanel />
            <NotificationDropdown />
            <div className="md:hidden ml-1">
              <ProfileMenu align="end" />
            </div>
          </div>
        </header>

        {/* Page content — 각 페이지가 자체 padding/max-width을 관리 (단계적 리디자인 중 이중 여백 방지) */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar — 전 역할 공통 */}
      {groups.length > 0 && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-sidebar-border flex z-50">
          {groups.map((g) => {
            const isActive = g.key === activeKey;
            return (
              <Link
                key={g.key}
                href={g.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 min-w-11 transition-colors",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {g.icon}
                <span className="text-[11px] leading-none">{g.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
