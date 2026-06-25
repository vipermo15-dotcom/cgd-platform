import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  aiAnalyses,
  aiLogs,
  bookmarks,
  companyProfiles,
  coverLetters,
  feedbacks,
  jobApplications,
  jobPostings,
  notifications,
  partnerCompanies,
  portfolioItems,
  portfolios,
  studentProfiles,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── 사용자 ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserRole(userId: number, role: "student" | "professor" | "company" | "training_center" | "admin" | "user") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateUserStatus(userId: number, status: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function getAllUsers(filters?: { role?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.role) conditions.push(eq(users.role, filters.role as any));
  if (filters?.status) conditions.push(eq(users.status, filters.status as any));
  return db.select().from(users).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(users.createdAt));
}

// ─── 재학생 프로필 ─────────────────────────────────────────────────────────────
export async function getStudentProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertStudentProfile(userId: number, data: Partial<typeof studentProfiles.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getStudentProfile(userId);
  if (existing) {
    await db.update(studentProfiles).set({ ...data, updatedAt: new Date() }).where(eq(studentProfiles.userId, userId));
  } else {
    await db.insert(studentProfiles).values({ userId, ...data } as any);
  }
}

export async function getAllStudents(filters?: { employmentStatus?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(users.role, "student")];
  if (filters?.employmentStatus) {
    conditions.push(eq(studentProfiles.employmentStatus, filters.employmentStatus as any));
  }
  if (filters?.search) {
    conditions.push(or(like(users.name, `%${filters.search}%`), like(studentProfiles.studentId, `%${filters.search}%`)) as any);
  }
  return db
    .select({ user: users, profile: studentProfiles })
    .from(users)
    .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
    .where(and(...conditions))
    .orderBy(desc(users.createdAt));
}

export async function getStudentBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ user: users, profile: studentProfiles })
    .from(studentProfiles)
    .innerJoin(users, eq(studentProfiles.userId, users.id))
    .where(eq(studentProfiles.publicSlug, slug))
    .limit(1);
  return result[0];
}

// ─── 기업 프로필 ───────────────────────────────────────────────────────────────
export async function getCompanyProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companyProfiles).where(eq(companyProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertCompanyProfile(userId: number, data: Partial<typeof companyProfiles.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getCompanyProfile(userId);
  if (existing) {
    await db.update(companyProfiles).set({ ...data, updatedAt: new Date() }).where(eq(companyProfiles.userId, userId));
  } else {
    await db.insert(companyProfiles).values({ userId, companyName: "미설정", ...data } as any);
  }
}

// ─── 포트폴리오 ────────────────────────────────────────────────────────────────
export async function getUserPortfolios(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolios).where(eq(portfolios.userId, userId)).orderBy(desc(portfolios.createdAt));
}

export async function getPortfolioById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(portfolios).where(eq(portfolios.id, id)).limit(1);
  return result[0];
}

export async function getPortfolioBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(portfolios).where(eq(portfolios.publicSlug, slug)).limit(1);
  return result[0];
}

export async function createPortfolio(data: typeof portfolios.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(portfolios).values(data);
  return result[0];
}

export async function updatePortfolio(id: number, data: Partial<typeof portfolios.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(portfolios).set({ ...data, updatedAt: new Date() }).where(eq(portfolios.id, id));
}

export async function deletePortfolio(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(portfolioItems).where(eq(portfolioItems.portfolioId, id));
  await db.delete(portfolios).where(eq(portfolios.id, id));
}

// ─── 포트폴리오 작품 ───────────────────────────────────────────────────────────
export async function getPortfolioItems(portfolioId: number, publicOnly = false) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(portfolioItems.portfolioId, portfolioId)];
  if (publicOnly) conditions.push(eq(portfolioItems.isPublic, true));
  return db.select().from(portfolioItems).where(and(...conditions)).orderBy(portfolioItems.sortOrder);
}

export async function createPortfolioItem(data: typeof portfolioItems.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(portfolioItems).values(data);
  return result[0];
}

export async function updatePortfolioItem(id: number, data: Partial<typeof portfolioItems.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(portfolioItems).set({ ...data, updatedAt: new Date() }).where(eq(portfolioItems.id, id));
}

export async function deletePortfolioItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
}

// ─── AI 분석 ───────────────────────────────────────────────────────────────────
export async function getLatestAiAnalysis(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiAnalyses).where(eq(aiAnalyses.userId, userId)).orderBy(desc(aiAnalyses.createdAt)).limit(1);
  return result[0];
}

export async function createAiAnalysis(data: typeof aiAnalyses.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(aiAnalyses).values(data);
  return result[0];
}

// ─── 자기소개서 ────────────────────────────────────────────────────────────────
export async function getUserCoverLetters(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coverLetters).where(eq(coverLetters.userId, userId)).orderBy(desc(coverLetters.createdAt));
}

export async function getCoverLetterById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coverLetters).where(eq(coverLetters.id, id)).limit(1);
  return result[0];
}

export async function createCoverLetter(data: typeof coverLetters.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(coverLetters).values(data);
  return result[0];
}

export async function updateCoverLetter(id: number, data: Partial<typeof coverLetters.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(coverLetters).set({ ...data, updatedAt: new Date() }).where(eq(coverLetters.id, id));
}

export async function deleteCoverLetter(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(coverLetters).where(eq(coverLetters.id, id));
}

// ─── 채용공고 ──────────────────────────────────────────────────────────────────
export async function getJobPostings(filters?: {
  status?: string;
  category?: string;
  search?: string;
  companyUserId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(jobPostings.status, filters.status as any));
  if (filters?.category) conditions.push(eq(jobPostings.category, filters.category));
  if (filters?.search) conditions.push(like(jobPostings.title, `%${filters.search}%`));
  if (filters?.companyUserId) conditions.push(eq(jobPostings.companyUserId, filters.companyUserId));
  const query = db
    .select({ posting: jobPostings, company: companyProfiles })
    .from(jobPostings)
    .leftJoin(companyProfiles, eq(jobPostings.companyUserId, companyProfiles.userId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(jobPostings.createdAt));
  if (filters?.limit) return query.limit(filters.limit).offset(filters?.offset ?? 0);
  return query;
}

export async function getJobPostingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ posting: jobPostings, company: companyProfiles })
    .from(jobPostings)
    .leftJoin(companyProfiles, eq(jobPostings.companyUserId, companyProfiles.userId))
    .where(eq(jobPostings.id, id))
    .limit(1);
  return result[0];
}

export async function createJobPosting(data: typeof jobPostings.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(jobPostings).values(data);
  return result[0];
}

export async function updateJobPosting(id: number, data: Partial<typeof jobPostings.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(jobPostings).set({ ...data, updatedAt: new Date() }).where(eq(jobPostings.id, id));
}

// ─── 지원 ──────────────────────────────────────────────────────────────────────
export async function getUserApplications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ application: jobApplications, posting: jobPostings, company: companyProfiles })
    .from(jobApplications)
    .innerJoin(jobPostings, eq(jobApplications.jobPostingId, jobPostings.id))
    .leftJoin(companyProfiles, eq(jobPostings.companyUserId, companyProfiles.userId))
    .where(eq(jobApplications.applicantUserId, userId))
    .orderBy(desc(jobApplications.createdAt));
}

export async function getJobApplications(jobPostingId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ application: jobApplications, user: users, profile: studentProfiles })
    .from(jobApplications)
    .innerJoin(users, eq(jobApplications.applicantUserId, users.id))
    .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
    .where(eq(jobApplications.jobPostingId, jobPostingId))
    .orderBy(desc(jobApplications.createdAt));
}

export async function createJobApplication(data: typeof jobApplications.$inferInsert) {
  const db = await getDb();
  if (!db) return null;

  // 중복 지원 방지: 같은 공고에 같은 지원자가 이미 있으면 새로 만들지 않는다.
  const existing = await db
    .select({ id: jobApplications.id })
    .from(jobApplications)
    .where(and(
      eq(jobApplications.jobPostingId, data.jobPostingId),
      eq(jobApplications.applicantUserId, data.applicantUserId),
    ))
    .limit(1);
  if (existing.length > 0) {
    return null; // 이미 지원함 — 호출 측에서 중복으로 처리
  }

  const result = await db.insert(jobApplications).values(data);
  // 카운트를 +1 대신 실제 행 수로 재계산해 드리프트(삭제 누락 등)를 자가 치유한다.
  await db
    .update(jobPostings)
    .set({
      applicantCount: sql`(SELECT COUNT(*) FROM job_applications WHERE jobPostingId = ${data.jobPostingId})`,
    })
    .where(eq(jobPostings.id, data.jobPostingId));
  return result[0];
}

export async function updateApplicationStatus(id: number, status: "지원완료" | "서류합격" | "면접" | "최종합격" | "탈락", extra?: { interviewDate?: Date; interviewMessage?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(jobApplications).set({ status, ...extra, updatedAt: new Date() }).where(eq(jobApplications.id, id));
}

export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(jobApplications).where(eq(jobApplications.id, id)).limit(1);
  return result[0] ?? null;
}

// ─── 북마크 ────────────────────────────────────────────────────────────────────
export async function getUserBookmarks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ bookmark: bookmarks, posting: jobPostings })
    .from(bookmarks)
    .innerJoin(jobPostings, eq(bookmarks.jobPostingId, jobPostings.id))
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.type, "job")))
    .orderBy(desc(bookmarks.createdAt));
}

export async function toggleBookmark(userId: number, jobPostingId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.jobPostingId, jobPostingId))).limit(1);
  if (existing.length > 0) {
    await db.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.jobPostingId, jobPostingId)));
    return false;
  } else {
    await db.insert(bookmarks).values({ userId, jobPostingId, type: "job" });
    return true;
  }
}

export async function toggleStudentBookmark(userId: number, studentUserId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.studentUserId, studentUserId))).limit(1);
  if (existing.length > 0) {
    await db.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.studentUserId, studentUserId)));
    return false;
  } else {
    await db.insert(bookmarks).values({ userId, studentUserId, type: "student" });
    return true;
  }
}

// ─── 피드백 ────────────────────────────────────────────────────────────────────
export async function getStudentFeedbacks(studentUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ feedback: feedbacks, professor: users })
    .from(feedbacks)
    .innerJoin(users, eq(feedbacks.professorUserId, users.id))
    .where(eq(feedbacks.studentUserId, studentUserId))
    .orderBy(desc(feedbacks.createdAt));
}

export async function createFeedback(data: typeof feedbacks.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(feedbacks).values(data);
  return result[0];
}

// ─── 알림 ──────────────────────────────────────────────────────────────────────
export async function getUserNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ─── 통계 ──────────────────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  const [totalStudents] = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "student"));
  const [employed] = await db.select({ count: sql<number>`count(*)` }).from(studentProfiles).where(eq(studentProfiles.employmentStatus, "취업확정"));
  const [totalPostings] = await db.select({ count: sql<number>`count(*)` }).from(jobPostings).where(eq(jobPostings.status, "approved"));
  const [totalApplications] = await db.select({ count: sql<number>`count(*)` }).from(jobApplications);
  const [totalPortfolios] = await db.select({ count: sql<number>`count(*)` }).from(portfolios);
  return {
    totalStudents: totalStudents?.count ?? 0,
    employedStudents: employed?.count ?? 0,
    employmentRate: totalStudents?.count ? Math.round(((employed?.count ?? 0) / totalStudents.count) * 100) : 0,
    totalPostings: totalPostings?.count ?? 0,
    totalApplications: totalApplications?.count ?? 0,
    totalPortfolios: totalPortfolios?.count ?? 0,
  };
}

export async function getMonthlyEmploymentStats() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      month: sql<string>`DATE_FORMAT(employedAt, '%Y-%m')`,
      count: sql<number>`count(*)`,
    })
    .from(studentProfiles)
    .where(eq(studentProfiles.employmentStatus, "취업확정"))
    .groupBy(sql`DATE_FORMAT(employedAt, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(employedAt, '%Y-%m')`);
}

export async function getEmploymentByCategory() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      category: jobPostings.category,
      count: sql<number>`count(*)`,
    })
    .from(jobApplications)
    .innerJoin(jobPostings, eq(jobApplications.jobPostingId, jobPostings.id))
    .where(eq(jobApplications.status, "최종합격"))
    .groupBy(jobPostings.category);
}

// ─── AI 로그 ───────────────────────────────────────────────────────────────────
export async function createAiLog(data: typeof aiLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(aiLogs).values(data);
}

export async function getAiLogs(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiLogs).orderBy(desc(aiLogs.createdAt)).limit(limit);
}

/**
 * 특정 사용자가 최근 windowMs 동안 호출한 AI 로그 수를 센다.
 * type을 지정하면 해당 종류(analysis/cover_letter 등)만 집계한다.
 * rate limiting 용도. DB가 없으면 0을 반환해 제한을 우회하지 않는다.
 */
export async function countRecentAiLogs(
  userId: number,
  windowMs: number,
  type?: string,
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const since = new Date(Date.now() - windowMs);
  const conditions = [eq(aiLogs.userId, userId), gte(aiLogs.createdAt, since)];
  if (type) conditions.push(eq(aiLogs.type, type));
  const [row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(aiLogs)
    .where(and(...conditions));
  return Number(row?.c ?? 0);
}

export async function getAiLogStats() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      date: sql<string>`DATE(createdAt)`,
      totalCalls: sql<number>`count(*)`,
      totalTokens: sql<number>`sum(tokensUsed)`,
      errors: sql<number>`sum(CASE WHEN success = false THEN 1 ELSE 0 END)`,
    })
    .from(aiLogs)
    .groupBy(sql`DATE(createdAt)`)
    .orderBy(desc(sql`DATE(createdAt)`))
    .limit(30);
}

// ─── 협력기업 ──────────────────────────────────────────────────────────────────
export async function getPartnerCompanies(filters?: { status?: string; isMou?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(partnerCompanies.status, filters.status as any));
  if (filters?.isMou !== undefined) conditions.push(eq(partnerCompanies.isMou, filters.isMou));
  return db.select().from(partnerCompanies).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(partnerCompanies.createdAt));
}

export async function createPartnerCompany(data: typeof partnerCompanies.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(partnerCompanies).values(data);
  return result[0];
}

export async function updatePartnerCompany(id: number, data: Partial<typeof partnerCompanies.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(partnerCompanies).set({ ...data, updatedAt: new Date() }).where(eq(partnerCompanies.id, id));
}

// ─── 공개 학생 탐색 (기업용) ───────────────────────────────────────────────────
export async function searchPublicStudents(filters?: {
  major?: string;
  minScore?: number;
  maxScore?: number;
  skills?: string[];
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(users.role, "student"), eq(users.status, "approved"), eq(studentProfiles.isPublic, true)];
  if (filters?.major) conditions.push(eq(studentProfiles.major, filters.major));
  return db
    .select({ user: users, profile: studentProfiles, analysis: aiAnalyses })
    .from(users)
    .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
    .leftJoin(aiAnalyses, eq(users.id, aiAnalyses.userId))
    .where(and(...conditions))
    .orderBy(desc(aiAnalyses.overallScore));
}

// ─── 학과장용: 전체 학생 지원 현황 ────────────────────────────────────────────
export async function getAllStudentApplications() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      application: jobApplications,
      posting: jobPostings,
      student: users,
      profile: studentProfiles,
      company: companyProfiles,
    })
    .from(jobApplications)
    .innerJoin(users, eq(jobApplications.applicantUserId, users.id))
    .innerJoin(jobPostings, eq(jobApplications.jobPostingId, jobPostings.id))
    .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
    .leftJoin(companyProfiles, eq(jobPostings.companyUserId, companyProfiles.userId))
    .where(eq(users.role, "student"))
    .orderBy(desc(jobApplications.createdAt));
}

// ─── 관리자: 회원 삭제 ────────────────────────────────────────────────────────
export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  // 연관 데이터 순서대로 삭제
  await db.delete(jobApplications).where(eq(jobApplications.applicantUserId, userId));
  await db.delete(bookmarks).where(eq(bookmarks.userId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(feedbacks).where(eq(feedbacks.studentUserId, userId));
  await db.delete(feedbacks).where(eq(feedbacks.professorUserId, userId));
  await db.delete(coverLetters).where(eq(coverLetters.userId, userId));
  await db.delete(aiAnalyses).where(eq(aiAnalyses.userId, userId));
  // 포트폴리오 아이템 → 포트폴리오
  const userPortfolios = await db.select({ id: portfolios.id }).from(portfolios).where(eq(portfolios.userId, userId));
  for (const p of userPortfolios) {
    await db.delete(portfolioItems).where(eq(portfolioItems.portfolioId, p.id));
  }
  await db.delete(portfolios).where(eq(portfolios.userId, userId));
  await db.delete(studentProfiles).where(eq(studentProfiles.userId, userId));
  await db.delete(companyProfiles).where(eq(companyProfiles.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

// ─── 관리자: 승인된 채용공고 목록 (매칭용) ────────────────────────────────────
export async function getApprovedJobPostings() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      posting: jobPostings,
      company: companyProfiles,
    })
    .from(jobPostings)
    .leftJoin(companyProfiles, eq(jobPostings.companyUserId, companyProfiles.userId))
    .where(eq(jobPostings.status, "approved"))
    .orderBy(desc(jobPostings.createdAt))
    .limit(50);
}
