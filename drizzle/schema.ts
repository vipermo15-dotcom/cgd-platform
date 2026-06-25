import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  float,
  index,
} from "drizzle-orm/mysql-core";

// ─── 사용자 ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "student", "professor", "company", "training_center"]).default("user").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── 재학생 프로필 ─────────────────────────────────────────────────────────────
export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  studentId: varchar("studentId", { length: 20 }),
  major: varchar("major", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  bio: text("bio"),
  skills: json("skills").$type<string[]>(),
  certificates: json("certificates").$type<string[]>(),
  publicSlug: varchar("publicSlug", { length: 100 }).unique(),
  isPublic: boolean("isPublic").default(false).notNull(),
  employmentStatus: mysqlEnum("employmentStatus", ["준비중", "지원중", "취업확정", "미시작"]).default("미시작").notNull(),
  employedAt: timestamp("employedAt"),
  employedCompany: varchar("employedCompany", { length: 200 }),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("student_profiles_userId_idx").on(t.userId),
  employmentStatusIdx: index("student_profiles_employmentStatus_idx").on(t.employmentStatus),
}));

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = typeof studentProfiles.$inferInsert;

// ─── 기업 프로필 ───────────────────────────────────────────────────────────────
export const companyProfiles = mysqlTable("company_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  website: varchar("website", { length: 300 }),
  description: text("description"),
  logoUrl: text("logoUrl"),
  contactName: varchar("contactName", { length: 100 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  isMou: boolean("isMou").default(false).notNull(),
  mouExpiredAt: timestamp("mouExpiredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = typeof companyProfiles.$inferInsert;

// ─── 이력서 ────────────────────────────────────────────────────────────────────
export const resumes = mysqlTable("resumes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // 기본 정보
  name: varchar("name", { length: 100 }),
  birthDate: varchar("birthDate", { length: 20 }),
  address: varchar("address", { length: 300 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  // 학력 (JSON 배열)
  education: json("education").$type<{
    school: string;
    major: string;
    startDate: string;
    endDate: string;
    status: string; // 졸업, 재학, 중퇴 등
  }[]>(),
  // 경력 (JSON 배열)
  career: json("career").$type<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    type: string; // 정규직, 계약직, 아르바이트 등
    description: string;
  }[]>(),
  // 자격증 / 외국어
  certificates: json("certificates").$type<{
    name: string;
    issuer: string;
    date: string;
  }[]>(),
  languages: json("languages").$type<{
    name: string;
    level: string;
    date: string;
  }[]>(),
  // 기술 스킬
  skills: json("skills").$type<string[]>(),
  // 기타
  summary: text("summary"),
  isPublic: boolean("isPublic").default(false).notNull(),
  // 단계별 승인 흐름
  approvalStep: mysqlEnum("approvalStep", [
    "draft",        // 작성중
    "submitted",    // 제출완료 (교육생이 제출)
    "reviewing",    // 검토중 (관리자/학과장)
    "approved",     // 승인완료
    "rejected",     // 반려
  ]).default("draft").notNull(),
  approvalNote: text("approvalNote"),      // 관리자 메모/피드백
  approvedBy: int("approvedBy"),           // 승인한 관리자 userId
  approvedAt: timestamp("approvedAt"),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("resumes_userId_idx").on(t.userId),
  approvalStepIdx: index("resumes_approvalStep_idx").on(t.approvalStep),
}));

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;

// ─── 포트폴리오 ────────────────────────────────────────────────────────────────
export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  isPublic: boolean("isPublic").default(false).notNull(),
  publicSlug: varchar("publicSlug", { length: 100 }).unique(),
  viewCount: int("viewCount").default(0).notNull(),
  // PDF 업로드 / 외부 URL 지원
  pdfUrl: text("pdfUrl"),
  externalUrl: text("externalUrl"),
  portfolioType: mysqlEnum("portfolioType", ["items", "pdf", "url"]).default("items").notNull(),
  // 단계별 승인 흐름
  approvalStep: mysqlEnum("approvalStep", [
    "draft",
    "submitted",
    "reviewing",
    "approved",
    "rejected",
  ]).default("draft").notNull(),
  approvalNote: text("approvalNote"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("portfolios_userId_idx").on(t.userId),
  approvalStepIdx: index("portfolios_approvalStep_idx").on(t.approvalStep),
}));

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

// ─── 포트폴리오 작품 ───────────────────────────────────────────────────────────
export const portfolioItems = mysqlTable("portfolio_items", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  mediaType: mysqlEnum("mediaType", ["image", "video", "youtube"]).notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  tools: json("tools").$type<string[]>(),
  isPublic: boolean("isPublic").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  portfolioIdx: index("portfolio_items_portfolioId_idx").on(t.portfolioId),
  userIdx: index("portfolio_items_userId_idx").on(t.userId),
}));

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = typeof portfolioItems.$inferInsert;

// ─── AI 역량 분석 ──────────────────────────────────────────────────────────────
export const aiAnalyses = mysqlTable("ai_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  portfolioId: int("portfolioId"),
  scores: json("scores").$type<{
    branding: number;
    sns: number;
    video: number;
    character: number;
    aiGeneration: number;
    editing: number;
  }>(),
  overallScore: float("overallScore"),
  strengths: json("strengths").$type<string[]>(),
  weaknesses: json("weaknesses").$type<string[]>(),
  recommendedSkills: json("recommendedSkills").$type<string[]>(),
  summary: text("summary"),
  rawResponse: text("rawResponse"),
  tokensUsed: int("tokensUsed").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  userIdx: index("ai_analyses_userId_idx").on(t.userId),
}));

export type AiAnalysis = typeof aiAnalyses.$inferSelect;
export type InsertAiAnalysis = typeof aiAnalyses.$inferInsert;

// ─── AI 자기소개서 ─────────────────────────────────────────────────────────────
export const coverLetters = mysqlTable("cover_letters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jobPostingId: int("jobPostingId"),
  title: varchar("title", { length: 300 }),
  content: text("content").notNull(),
  isAiGenerated: boolean("isAiGenerated").default(false).notNull(),
  tokensUsed: int("tokensUsed").default(0),
  // 단계별 승인 흐름
  approvalStep: mysqlEnum("approvalStep", [
    "draft",
    "submitted",
    "reviewing",
    "approved",
    "rejected",
  ]).default("draft").notNull(),
  approvalNote: text("approvalNote"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdx: index("cover_letters_userId_idx").on(t.userId),
}));

export type CoverLetter = typeof coverLetters.$inferSelect;
export type InsertCoverLetter = typeof coverLetters.$inferInsert;

// ─── 채용공고 ──────────────────────────────────────────────────────────────────
export const jobPostings = mysqlTable("job_postings", {
  id: int("id").autoincrement().primaryKey(),
  companyUserId: int("companyUserId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  category: varchar("category", { length: 100 }),
  requiredSkills: json("requiredSkills").$type<string[]>(),
  preferredSkills: json("preferredSkills").$type<string[]>(),
  employmentType: mysqlEnum("employmentType", ["정규직", "계약직", "프리랜서", "인턴"]).notNull(),
  location: varchar("location", { length: 200 }),
  salaryMin: int("salaryMin"),
  salaryMax: int("salaryMax"),
  description: text("description"),
  deadline: timestamp("deadline"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "closed"]).default("pending").notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"),
  viewCount: int("viewCount").default(0).notNull(),
  applicantCount: int("applicantCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  companyIdx: index("job_postings_companyUserId_idx").on(t.companyUserId),
  statusIdx: index("job_postings_status_idx").on(t.status),
}));

export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = typeof jobPostings.$inferInsert;

// ─── 지원 ──────────────────────────────────────────────────────────────────────
export const jobApplications = mysqlTable("job_applications", {
  id: int("id").autoincrement().primaryKey(),
  jobPostingId: int("jobPostingId").notNull(),
  applicantUserId: int("applicantUserId").notNull(),
  portfolioId: int("portfolioId"),
  coverLetterId: int("coverLetterId"),
  resumeId: int("resumeId"),
  status: mysqlEnum("status", ["지원완료", "서류합격", "면접", "최종합격", "탈락"]).default("지원완료").notNull(),
  interviewDate: timestamp("interviewDate"),
  interviewMessage: text("interviewMessage"),
  note: text("note"),
  // 관리자/학과장이 매칭한 경우 표시
  matchedBy: int("matchedBy"),
  matchNote: text("matchNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  postingIdx: index("job_applications_jobPostingId_idx").on(t.jobPostingId),
  applicantIdx: index("job_applications_applicantUserId_idx").on(t.applicantUserId),
  statusIdx: index("job_applications_status_idx").on(t.status),
}));

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = typeof jobApplications.$inferInsert;

// ─── 북마크 ────────────────────────────────────────────────────────────────────
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // 북마크 종류 판별자: 채용공고(job) / 인재(student)
  // 둘 중 하나의 대상 컬럼만 채워지므로, 조회 시 type으로 명확히 구분한다.
  type: mysqlEnum("type", ["job", "student"]).default("job").notNull(),
  jobPostingId: int("jobPostingId"),
  studentUserId: int("studentUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  // 종류별 조회 + 중복 검사(userId+대상)에 사용
  userJobIdx: index("bookmarks_user_job_idx").on(t.userId, t.jobPostingId),
  userStudentIdx: index("bookmarks_user_student_idx").on(t.userId, t.studentUserId),
}));

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

// ─── 피드백 ────────────────────────────────────────────────────────────────────
export const feedbacks = mysqlTable("feedbacks", {
  id: int("id").autoincrement().primaryKey(),
  professorUserId: int("professorUserId").notNull(),
  studentUserId: int("studentUserId").notNull(),
  content: text("content").notNull(),
  rating: int("rating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = typeof feedbacks.$inferInsert;

// ─── 알림 ──────────────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedId: int("relatedId"),
  relatedType: varchar("relatedType", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  // 미읽음 알림 조회: userId + isRead
  userReadIdx: index("notifications_user_read_idx").on(t.userId, t.isRead),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── AI 로그 ───────────────────────────────────────────────────────────────────
export const aiLogs = mysqlTable("ai_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  type: varchar("type", { length: 100 }).notNull(),
  tokensUsed: int("tokensUsed").default(0).notNull(),
  success: boolean("success").default(true).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  // rate limiting / 통계 조회: userId + 시간 윈도우 + type 필터
  userCreatedIdx: index("ai_logs_user_created_idx").on(t.userId, t.createdAt),
  typeIdx: index("ai_logs_type_idx").on(t.type),
}));

export type AiLog = typeof aiLogs.$inferSelect;
export type InsertAiLog = typeof aiLogs.$inferInsert;

// ─── 협력기업 (공동훈련센터 관리) ─────────────────────────────────────────────
export const partnerCompanies = mysqlTable("partner_companies", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  contactName: varchar("contactName", { length: 100 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  isMou: boolean("isMou").default(false).notNull(),
  mouStartAt: timestamp("mouStartAt"),
  mouExpiredAt: timestamp("mouExpiredAt"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  linkedUserId: int("linkedUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PartnerCompany = typeof partnerCompanies.$inferSelect;
export type InsertPartnerCompany = typeof partnerCompanies.$inferInsert;

// ─── 진로지도 카드 ─────────────────────────────────────────────────────────────
export const careerGuidance = mysqlTable("career_guidance", {
  id: int("id").autoincrement().primaryKey(),
  studentUserId: int("studentUserId").notNull(),
  professorUserId: int("professorUserId"),
  // 진로 트랙: 브랜드디자인/SNS마케팅/영상편집/캐릭터굿즈/AI생성/프리랜서
  careerTrack: mysqlEnum("careerTrack", [
    "brand_design",
    "sns_marketing",
    "video_editing",
    "character_goods",
    "ai_generation",
    "freelancer",
    "undecided",
  ]).default("undecided").notNull(),
  // 추천 취업처 (JSON 배열)
  recommendedCompanies: json("recommendedCompanies").$type<{
    companyName: string;
    jobTitle: string;
    reason: string;
    matchScore: number;
  }[]>(),
  // 진로 체크리스트 (JSON 배열)
  checklist: json("checklist").$type<{
    id: string;
    label: string;
    done: boolean;
    category: string; // 포트폴리오/이력서/자소서/면접준비/기타
  }[]>(),
  // 진로 상담 메모
  guidanceNote: text("guidanceNote"),
  // AI 추천 사유
  aiRecommendReason: text("aiRecommendReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  studentIdx: index("career_guidance_studentUserId_idx").on(t.studentUserId),
}));

export type CareerGuidance = typeof careerGuidance.$inferSelect;
export type InsertCareerGuidance = typeof careerGuidance.$inferInsert;

// ─── 업체 파이프라인 (공동훈련센터/관리자 관리) ────────────────────────────────
export const companyPipeline = mysqlTable("company_pipeline", {
  id: int("id").autoincrement().primaryKey(),
  partnerCompanyId: int("partnerCompanyId"),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  contactName: varchar("contactName", { length: 100 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  industry: varchar("industry", { length: 100 }),
  // 파이프라인 단계: 발굴→접촉→협의→MOU체결
  stage: mysqlEnum("stage", ["discovery", "contact", "negotiation", "mou_signed"]).default("discovery").notNull(),
  // 채용 가능 직무
  availablePositions: json("availablePositions").$type<string[]>(),
  // 예상 채용 인원
  expectedHeadcount: int("expectedHeadcount").default(0),
  // 담당자 메모
  note: text("note"),
  // 다음 액션
  nextAction: text("nextAction"),
  nextActionDate: timestamp("nextActionDate"),
  managedBy: int("managedBy"), // 담당 관리자/훈련센터 userId
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyPipeline = typeof companyPipeline.$inferSelect;
export type InsertCompanyPipeline = typeof companyPipeline.$inferInsert;

// ─── 수료 후 취업 추적 ─────────────────────────────────────────────────────────
export const employmentTracking = mysqlTable("employment_tracking", {
  id: int("id").autoincrement().primaryKey(),
  studentUserId: int("studentUserId").notNull(),
  // 수료 정보
  graduationDate: timestamp("graduationDate"),
  // 취업 확정 정보
  employedAt: timestamp("employedAt"),
  companyName: varchar("companyName", { length: 200 }),
  jobTitle: varchar("jobTitle", { length: 200 }),
  employmentType: mysqlEnum("employmentType", ["정규직", "계약직", "프리랜서", "인턴"]),
  salary: int("salary"),
  // 수료 후 D+30/60/90 추적
  checkD30: boolean("checkD30").default(false),
  checkD60: boolean("checkD60").default(false),
  checkD90: boolean("checkD90").default(false),
  checkD30Note: text("checkD30Note"),
  checkD60Note: text("checkD60Note"),
  checkD90Note: text("checkD90Note"),
  // 취업 경로
  source: mysqlEnum("source", ["platform", "professor_match", "self", "other"]).default("self"),
  // 관련 지원 ID
  jobApplicationId: int("jobApplicationId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  studentIdx: index("employment_tracking_studentUserId_idx").on(t.studentUserId),
}));

export type EmploymentTracking = typeof employmentTracking.$inferSelect;
export type InsertEmploymentTracking = typeof employmentTracking.$inferInsert;

// ─── 프리랜서 활동 추적 ────────────────────────────────────────────────────────
export const freelancerActivity = mysqlTable("freelancer_activity", {
  id: int("id").autoincrement().primaryKey(),
  studentUserId: int("studentUserId").notNull(),
  platform: mysqlEnum("platform", ["kmong", "kakao", "soomgo", "other"]).notNull(),
  profileUrl: text("profileUrl"),
  monthlyRevenue: int("monthlyRevenue").default(0),
  projectCount: int("projectCount").default(0),
  rating: float("rating"),
  isActive: boolean("isActive").default(true).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FreelancerActivity = typeof freelancerActivity.$inferSelect;
export type InsertFreelancerActivity = typeof freelancerActivity.$inferInsert;

// ─── 포트폴리오 열람 로그 ──────────────────────────────────────────────────────
export const portfolioViews = mysqlTable("portfolio_views", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  viewerUserId: int("viewerUserId"),        // null이면 비로그인 방문자
  viewerIp: varchar("viewerIp", { length: 45 }),
  viewerRole: varchar("viewerRole", { length: 50 }),
  companyName: varchar("companyName", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  portfolioIdx: index("portfolio_views_portfolioId_idx").on(t.portfolioId),
}));

export type PortfolioView = typeof portfolioViews.$inferSelect;
export type InsertPortfolioView = typeof portfolioViews.$inferInsert;

// ─── 취업 축하 배너 ────────────────────────────────────────────────────────────
export const employmentSuccessBanner = mysqlTable("employment_success_banner", {
  id: int("id").autoincrement().primaryKey(),
  studentUserId: int("studentUserId").notNull(),
  studentName: varchar("studentName", { length: 100 }).notNull(),
  // 이름 이니셜 처리 여부 (개인정보 보호)
  useInitial: boolean("useInitial").default(true).notNull(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  jobTitle: varchar("jobTitle", { length: 200 }).notNull(),
  message: text("message"),
  isActive: boolean("isActive").default(true).notNull(),
  // 자동 생성 여부 (최종합격 시 자동)
  isAutoGenerated: boolean("isAutoGenerated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmploymentSuccessBanner = typeof employmentSuccessBanner.$inferSelect;
export type InsertEmploymentSuccessBanner = typeof employmentSuccessBanner.$inferInsert;

// ─── 교육생 서류 피드백 ────────────────────────────────────────────────────────
// 관리자/학과장이 이력서·자소서·포트폴리오에 남기는 피드백
export const studentFeedbacks = mysqlTable("student_feedbacks", {
  id: int("id").autoincrement().primaryKey(),
  studentUserId: int("studentUserId").notNull(),
  authorUserId: int("authorUserId").notNull(),  // 피드백 작성자 (admin/professor)
  docType: mysqlEnum("docType", ["resume", "cover_letter", "portfolio"]).notNull(),
  docId: int("docId"),  // 해당 서류 ID (resumes.id / cover_letters.id / portfolios.id)
  content: text("content").notNull(),
  rating: mysqlEnum("rating", ["excellent", "good", "needs_improvement", "poor"]),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  studentIdx: index("student_feedbacks_studentUserId_idx").on(t.studentUserId),
}));
export type StudentFeedback = typeof studentFeedbacks.$inferSelect;
export type InsertStudentFeedback = typeof studentFeedbacks.$inferInsert;

// ─── 진로지도 피드백 ───────────────────────────────────────────────────────────
// 직무분석, 입사 지원 전략, Claude AI 분석, MD 파일 첨부
export const careerFeedbacks = mysqlTable("career_feedbacks", {
  id: int("id").autoincrement().primaryKey(),
  studentUserId: int("studentUserId").notNull(),
  authorUserId: int("authorUserId").notNull(),
  feedbackType: mysqlEnum("feedbackType", ["job_analysis", "application_strategy", "ai_analysis", "general"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),  // Markdown 본문
  mdFileUrl: text("mdFileUrl"),  // 업로드된 MD 파일 URL
  mdFileName: varchar("mdFileName", { length: 300 }),
  aiModel: varchar("aiModel", { length: 100 }),  // 사용된 AI 모델명
  targetCompany: varchar("targetCompany", { length: 200 }),  // 목표 기업
  targetJob: varchar("targetJob", { length: 200 }),  // 목표 직무
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  studentIdx: index("career_feedbacks_studentUserId_idx").on(t.studentUserId),
}));
export type CareerFeedback = typeof careerFeedbacks.$inferSelect;
export type InsertCareerFeedback = typeof careerFeedbacks.$inferInsert;

// ─── 구직활동 공유 권한 ────────────────────────────────────────────────────────
// 교육생이 공동훈련센터에 구직활동(지원현황) 공유를 허용하는 권한 테이블
export const jobActivityShares = mysqlTable("job_activity_shares", {
  id: int("id").autoincrement().primaryKey(),
  studentUserId: int("studentUserId").notNull(),
  trainingUserId: int("trainingUserId"),  // null이면 전체 공동훈련센터에 공개
  isActive: boolean("isActive").default(true).notNull(),
  sharedAt: timestamp("sharedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
  note: text("note"),  // 교육생 메모
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type JobActivityShare = typeof jobActivityShares.$inferSelect;
export type InsertJobActivityShare = typeof jobActivityShares.$inferInsert;

// ─── 입사지원 희망 요청 ────────────────────────────────────────────────────────
// 기업이 교육생에게 입사지원을 요청하는 테이블 (학과장 검토 → 교육생 수락/거절)
export const hireRequests = mysqlTable("hire_requests", {
  id: int("id").autoincrement().primaryKey(),
  companyUserId: int("companyUserId").notNull(),     // 요청 기업 userId
  studentUserId: int("studentUserId").notNull(),     // 대상 교육생 userId
  reviewerUserId: int("reviewerUserId"),             // 검토한 학과장/관리자 userId
  position: varchar("position", { length: 200 }).notNull(),   // 채용 포지션
  employmentType: mysqlEnum("employmentType", ["fulltime", "contract", "freelance", "intern"]).notNull().default("fulltime"),
  workLocation: varchar("workLocation", { length: 200 }),
  salary: varchar("salary", { length: 200 }),
  message: text("message"),                          // 기업 요청 메시지
  contactMethod: mysqlEnum("contactMethod", ["platform", "kakaotalk", "email"]).default("platform"),
  deadline: timestamp("deadline"),                   // 지원 희망 마감일
  status: mysqlEnum("status", ["pending", "approved", "rejected", "accepted", "declined"]).notNull().default("pending"),
  reviewNote: text("reviewNote"),                    // 학과장 검토 메모
  studentNote: text("studentNote"),                  // 교육생 응답 메모
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  studentIdx: index("hire_requests_studentUserId_idx").on(t.studentUserId),
  companyIdx: index("hire_requests_companyUserId_idx").on(t.companyUserId),
  statusIdx: index("hire_requests_status_idx").on(t.status),
}));
export type HireRequest = typeof hireRequests.$inferSelect;
export type InsertHireRequest = typeof hireRequests.$inferInsert;

// ─── 인재풀 공개 동의 ──────────────────────────────────────────────────────────
// 교육생이 기업체에게 자신의 프로필을 공개하는 동의 설정
export const talentPoolConsents = mysqlTable("talent_pool_consents", {
  id: int("id").autoincrement().primaryKey(),
  studentUserId: int("studentUserId").notNull().unique(),
  isPublic: boolean("isPublic").default(false).notNull(),          // 인재풀 공개 여부
  exposeResume: boolean("exposeResume").default(true).notNull(),   // 이력서 공개
  exposePortfolio: boolean("exposePortfolio").default(true).notNull(), // 포트폴리오 공개
  exposeCoverLetterPreview: boolean("exposeCoverLetterPreview").default(true).notNull(), // 자소서 미리보기(300자)
  exposeFullCoverLetter: boolean("exposeFullCoverLetter").default(false).notNull(), // 자소서 전체
  consentedAt: timestamp("consentedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TalentPoolConsent = typeof talentPoolConsents.$inferSelect;
export type InsertTalentPoolConsent = typeof talentPoolConsents.$inferInsert;
