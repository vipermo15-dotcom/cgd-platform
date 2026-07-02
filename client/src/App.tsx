import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

// 첫 진입 경로 / 폴백은 즉시 로딩 (분할 시 오히려 왕복 지연)
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "@/pages/NotFound";
import { getLoginUrl } from "./const";

// 나머지는 역할별 코드 분할(lazy) — 해당 역할이 접근할 때만 청크 로드
const RoleSetup = lazy(() => import("./pages/RoleSetup"));

// Student pages
const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const StudentPortfolio = lazy(() => import("./pages/student/Portfolio"));
const StudentAIAnalysis = lazy(() => import("./pages/student/AIAnalysis"));
const StudentCoverLetter = lazy(() => import("./pages/student/CoverLetter"));
const StudentJobs = lazy(() => import("./pages/student/Jobs"));
const StudentJobMatching = lazy(() => import("./pages/student/JobMatching"));
const StudentJobCoaching = lazy(() => import("./pages/student/JobCoaching"));
const StudentApplications = lazy(() => import("./pages/student/Applications"));
const StudentProfile = lazy(() => import("./pages/student/Profile"));
const StudentDocumentCenter = lazy(() => import("./pages/student/DocumentCenter"));
const StudentCareerProgress = lazy(() => import("./pages/student/CareerProgress"));
const StudentAIAgents = lazy(() => import("./pages/student/AIAgents"));

// Professor pages
const ProfessorDashboard = lazy(() => import("./pages/professor/Dashboard"));
const ProfessorStudents = lazy(() => import("./pages/professor/Students"));
const ProfessorStudentDetail = lazy(() => import("./pages/professor/StudentDetail"));
const ProfessorStats = lazy(() => import("./pages/professor/Stats"));
const ProfessorDocumentReview = lazy(() => import("./pages/professor/DocumentReview"));

// Company pages
const CompanyTalent = lazy(() => import("./pages/company/Talent"));
const CompanyPostings = lazy(() => import("./pages/company/Postings"));
const CompanyApplicants = lazy(() => import("./pages/company/Applicants"));

// Training center pages
const TrainingDashboard = lazy(() => import("./pages/training/Dashboard"));
const TrainingCompanies = lazy(() => import("./pages/training/Companies"));
const TrainingMatching = lazy(() => import("./pages/training/Matching"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminPostings = lazy(() => import("./pages/admin/Postings"));
const AdminAILogs = lazy(() => import("./pages/admin/AILogs"));
const AdminCompanyPipeline = lazy(() => import("./pages/admin/CompanyPipeline"));
const AdminEmploymentStats = lazy(() => import("./pages/admin/EmploymentStats"));
const AdminCareerGuidance = lazy(() => import("./pages/admin/CareerGuidance"));
const AdminEmploymentBanners = lazy(() => import("./pages/admin/EmploymentBanners"));
const AdminJobCoaching = lazy(() => import("./pages/admin/JobCoaching"));
const AdminAIMatching = lazy(() => import("./pages/admin/AIMatching"));
const StudentReadiness = lazy(() => import("./pages/admin/StudentReadiness"));

// Shared pages
const Feedback = lazy(() => import("./pages/Feedback"));
const FeedbackResults = lazy(() => import("./pages/admin/FeedbackResults"));
const LearningHub = lazy(() => import("./pages/LearningHub"));

// Public pages
const PublicPortfolio = lazy(() => import("./pages/PublicPortfolio"));
const PublicResume = lazy(() => import("./pages/PublicResume"));
const ManualDownload = lazy(() => import("./pages/ManualDownload"));
const EmploymentResults = lazy(() => import("./pages/EmploymentResults"));

// ─── Role Guard ───────────────────────────────────────────────────────────────

// 인증 확인 / lazy 청크 로딩 시 공통으로 쓰는 전체화면 스피너
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
}

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !user) {
    window.location.href = getLoginUrl();
    return null;
  }

  // User has no role yet → go to role setup
  if (!user.role || user.role === "user") {
    navigate("/role-setup");
    return null;
  }

  // User role not in allowed list → redirect to their own dashboard
  if (!allowedRoles.includes(user.role)) {
    const roleRoutes: Record<string, string> = {
      student: "/student",
      professor: "/professor",
      company: "/company/talent",
      training_center: "/training",
      admin: "/admin",
    };
    navigate(roleRoutes[user.role] ?? "/");
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/role-setup" component={RoleSetup} />
      <Route path="/portfolio/:slug" component={PublicPortfolio} />
      <Route path="/results" component={EmploymentResults} />
      <Route path="/resume/:slug" component={PublicResume} />
      <Route path="/manual">
        <RoleGuard allowedRoles={["student", "professor", "training_center", "company", "admin"]}><ManualDownload /></RoleGuard>
      </Route>

      {/* Student */}
      <Route path="/student">
        <RoleGuard allowedRoles={["student", "admin"]}><StudentDashboard /></RoleGuard>
      </Route>
      <Route path="/student/portfolio">
        <RoleGuard allowedRoles={["student", "admin"]}><StudentPortfolio /></RoleGuard>
      </Route>
      <Route path="/student/ai-analysis">
        <RoleGuard allowedRoles={["student", "admin"]}><StudentAIAnalysis /></RoleGuard>
      </Route>
      <Route path="/student/cover-letter">
        <RoleGuard allowedRoles={["student", "admin"]}><StudentCoverLetter /></RoleGuard>
      </Route>
      <Route path="/student/jobs">
        <RoleGuard allowedRoles={["student", "admin"]}><StudentJobs /></RoleGuard>
      </Route>
      <Route path="/student/job-matching">
        <RoleGuard allowedRoles={["student", "admin"]}><StudentJobMatching /></RoleGuard>
      </Route>
      <Route path="/student/job-coaching">
        <RoleGuard allowedRoles={["student", "admin"]}><StudentJobCoaching /></RoleGuard>
      </Route>
      <Route path="/student/applications">
        <RoleGuard allowedRoles={["student", "admin"]}><StudentApplications /></RoleGuard>
      </Route>
      <Route path="/student/profile">
        <RoleGuard allowedRoles={["student", "admin"]}><StudentProfile /></RoleGuard>
      </Route>
      <Route path="/student/documents">
        <RoleGuard allowedRoles={["student", "admin"]}><StudentDocumentCenter /></RoleGuard>
      </Route>
      <Route path="/student/career-progress">
        <RoleGuard allowedRoles={["student", "admin"]}><StudentCareerProgress /></RoleGuard>
      </Route>
      <Route path="/student/ai-agents">
        <RoleGuard allowedRoles={["student", "admin"]}><StudentAIAgents /></RoleGuard>
      </Route>

      {/* Professor */}
      <Route path="/professor">
        <RoleGuard allowedRoles={["professor", "admin"]}><ProfessorDashboard /></RoleGuard>
      </Route>
      <Route path="/professor/students">
        <RoleGuard allowedRoles={["professor", "admin", "training_center"]}><ProfessorStudents /></RoleGuard>
      </Route>
      <Route path="/professor/students/:id">
        {(params) => (
          <RoleGuard allowedRoles={["professor", "admin", "training_center"]}><ProfessorStudentDetail /></RoleGuard>
        )}
      </Route>
      <Route path="/professor/stats">
        <RoleGuard allowedRoles={["professor", "admin"]}><ProfessorStats /></RoleGuard>
      </Route>
      <Route path="/professor/documents">
        <RoleGuard allowedRoles={["professor", "admin"]}><ProfessorDocumentReview /></RoleGuard>
      </Route>

      {/* Company */}
      <Route path="/company/talent">
        <RoleGuard allowedRoles={["company", "admin"]}><CompanyTalent /></RoleGuard>
      </Route>
      <Route path="/company/postings">
        <RoleGuard allowedRoles={["company", "admin"]}><CompanyPostings /></RoleGuard>
      </Route>
      <Route path="/company/applicants/:id">
        {(params) => (
          <RoleGuard allowedRoles={["company", "admin"]}><CompanyApplicants /></RoleGuard>
        )}
      </Route>

      {/* Training */}
      <Route path="/training">
        <RoleGuard allowedRoles={["training_center", "admin"]}><TrainingDashboard /></RoleGuard>
      </Route>
      <Route path="/training/companies">
        <RoleGuard allowedRoles={["training_center", "admin"]}><TrainingCompanies /></RoleGuard>
      </Route>
      <Route path="/training/matching">
        <RoleGuard allowedRoles={["training_center", "admin"]}><TrainingMatching /></RoleGuard>
      </Route>

      {/* Admin */}
      <Route path="/admin">
        <RoleGuard allowedRoles={["admin"]}><AdminDashboard /></RoleGuard>
      </Route>
      <Route path="/admin/users">
        <RoleGuard allowedRoles={["admin"]}><AdminUsers /></RoleGuard>
      </Route>
      <Route path="/admin/postings">
        <RoleGuard allowedRoles={["admin"]}><AdminPostings /></RoleGuard>
      </Route>
      <Route path="/admin/ai-logs">
        <RoleGuard allowedRoles={["admin"]}><AdminAILogs /></RoleGuard>
      </Route>
      <Route path="/admin/pipeline">
        <RoleGuard allowedRoles={["admin", "professor", "training_center"]}><AdminCompanyPipeline /></RoleGuard>
      </Route>
      <Route path="/admin/employment-stats">
        <RoleGuard allowedRoles={["admin", "professor", "training_center"]}><AdminEmploymentStats /></RoleGuard>
      </Route>
      <Route path="/admin/career-guidance">
        <RoleGuard allowedRoles={["admin", "professor", "training_center"]}><AdminCareerGuidance /></RoleGuard>
      </Route>
      <Route path="/admin/banners">
        <RoleGuard allowedRoles={["admin", "professor"]}><AdminEmploymentBanners /></RoleGuard>
      </Route>
      <Route path="/admin/job-coaching">
        <RoleGuard allowedRoles={["admin", "professor", "training_center"]}><AdminJobCoaching /></RoleGuard>
      </Route>
      <Route path="/admin/ai-matching">
        <RoleGuard allowedRoles={["admin", "professor", "training_center"]}><AdminAIMatching /></RoleGuard>
      </Route>
      <Route path="/admin/student-readiness">
        <RoleGuard allowedRoles={["admin", "professor", "training_center"]}><StudentReadiness /></RoleGuard>
      </Route>

      {/* Shared */}
      <Route path="/feedback">
        <RoleGuard allowedRoles={["student", "professor", "training_center", "company", "admin"]}><Feedback /></RoleGuard>
      </Route>
      <Route path="/admin/feedback-results">
        <RoleGuard allowedRoles={["admin", "professor"]}><FeedbackResults /></RoleGuard>
      </Route>
      <Route path="/learning-hub">
        <RoleGuard allowedRoles={["student", "professor", "training_center", "company", "admin"]}><LearningHub /></RoleGuard>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="bottom-right" richColors />
          <Suspense fallback={<PageLoader />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
