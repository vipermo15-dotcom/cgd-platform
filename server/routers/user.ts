import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import {
  createNotification,
  getAllUsers,
  getCompanyProfile,
  getStudentProfile,
  getUserById,
  markAllNotificationsRead,
  markNotificationRead,
  getUnreadNotificationCount,
  getUserNotifications,
  updateUserRole,
  updateUserStatus,
  updateUserName,
  upsertCompanyProfile,
  upsertStudentProfile,
  upsertUser,
  getDb,
  deleteUser,
  getApprovedJobPostings,
  createJobApplication,
  getUserApplications,
  getAllStudentApplications,
} from "../db";
import { users, studentProfiles, portfolios, portfolioItems, coverLetters, aiAnalyses } from "../../drizzle/schema";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const userRouter = router({
  // 내 프로필 조회
  me: publicProcedure.query((opts) => opts.ctx.user),

  // 역할 설정 (최초 가입 시)
  setRole: protectedProcedure
    .input(z.object({
      role: z.enum(["student", "professor", "company", "training_center"]),
      studentId: z.string().optional(),
      major: z.string().optional(),
      companyName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateUserRole(ctx.user.id, input.role);
      if (input.role === "student") {
        await upsertStudentProfile(ctx.user.id, {
          studentId: input.studentId,
          major: input.major,
        });
      } else if (input.role === "company" && input.companyName) {
        await upsertCompanyProfile(ctx.user.id, { companyName: input.companyName });
      }
      // 관리자에게 알림 (학생/기업 가입 시)
      if (input.role === "student" || input.role === "company") {
        const admins = await getAllUsers({ role: "admin" });
        for (const admin of admins) {
          await createNotification({
            userId: admin.id,
            type: "new_user",
            title: "신규 가입 신청",
            message: `${ctx.user.name ?? "신규 사용자"}님이 ${input.role === "student" ? "재학생" : "협력기업"}으로 가입 신청했습니다.`,
            relatedId: ctx.user.id,
            relatedType: "user",
          });
        }
      }
      return { success: true };
    }),

  // 재학생 프로필 조회
  getStudentProfile: protectedProcedure.query(async ({ ctx }) => {
    return getStudentProfile(ctx.user.id);
  }),

  // 재학생 프로필 업데이트
  updateStudentProfile: protectedProcedure
    .input(z.object({
      studentId: z.string().optional(),
      major: z.string().optional(),
      phone: z.string().optional(),
      bio: z.string().optional(),
      skills: z.array(z.string()).optional(),
      certificates: z.array(z.string()).optional(),
      publicSlug: z.string().optional(),
      isPublic: z.boolean().optional(),
      employmentStatus: z.enum(["준비중", "지원중", "취업확정", "미시작"]).optional(),
      employedCompany: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const data: any = { ...input };
      // publicSlug 빈 문자열 → null (UNIQUE 제약조건 위반 방지)
      if (data.publicSlug === "") data.publicSlug = null;
      if (input.employmentStatus === "취업확정") {
        data.employedAt = new Date();
        // 학과장에게 알림
        const professors = await getAllUsers({ role: "professor" });
        for (const prof of professors) {
          await createNotification({
            userId: prof.id,
            type: "employment_confirmed",
            title: "취업 확정 등록",
            message: `${ctx.user.name ?? "학생"}님이 취업 확정을 등록했습니다.`,
            relatedId: ctx.user.id,
            relatedType: "user",
          });
        }
      }
      await upsertStudentProfile(ctx.user.id, data);
      return { success: true };
    }),

  // 내 이름 수정 (본인)
  updateMyName: protectedProcedure
    .input(z.object({ name: z.string().min(1, "이름을 입력하세요.").max(100) }))
    .mutation(async ({ ctx, input }) => {
      await updateUserName(ctx.user.id, input.name.trim());
      return { success: true };
    }),

  // 기업 프로필 조회
  getCompanyProfile: protectedProcedure.query(async ({ ctx }) => {
    return getCompanyProfile(ctx.user.id);
  }),

  // 기업 프로필 업데이트
  updateCompanyProfile: protectedProcedure
    .input(z.object({
      companyName: z.string().optional(),
      industry: z.string().optional(),
      website: z.string().optional(),
      description: z.string().optional(),
      contactName: z.string().optional(),
      contactPhone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await upsertCompanyProfile(ctx.user.id, input);
      return { success: true };
    }),

  // 알림 목록
  getNotifications: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return getUserNotifications(ctx.user.id, input.limit ?? 20);
    }),

  // 미읽 알림 수
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadNotificationCount(ctx.user.id);
  }),

  // 알림 읽음 처리
  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id);
      return { success: true };
    }),

  // 전체 알림 읽음 처리
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),

  // 관리자: 전체 사용자 목록
  adminGetUsers: adminProcedure
    .input(z.object({ role: z.string().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      return getAllUsers(input);
    }),

  // 관리자: 사용자 승인/거절
  adminUpdateStatus: adminProcedure
    .input(z.object({ userId: z.number(), status: z.enum(["approved", "rejected"]) }))
    .mutation(async ({ input }) => {
      await updateUserStatus(input.userId, input.status);
      const user = await getUserById(input.userId);
      if (user) {
        await createNotification({
          userId: input.userId,
          type: "account_status",
          title: input.status === "approved" ? "가입 승인" : "가입 거절",
          message: input.status === "approved" ? "계정이 승인되었습니다. 서비스를 이용하실 수 있습니다." : "가입 신청이 거절되었습니다. 관리자에게 문의하세요.",
          relatedType: "user",
        });
      }
      return { success: true };
    }),

  // 관리자: 회원 삭제
  adminDeleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteUser(input.userId);
      return { success: true };
    }),

  // 관리자: 승인된 채용공고 목록 (재학생 매칭용)
  adminGetApprovedPostings: adminProcedure.query(async () => {
    return getApprovedJobPostings();
  }),

  // 관리자: 재학생에게 채용공고 매칭 (대신 지원)
  adminMatchJobToStudent: adminProcedure
    .input(z.object({ studentUserId: z.number(), jobPostingId: z.number() }))
    .mutation(async ({ input }) => {
      // 중복 지원 방지
      const existing = await getUserApplications(input.studentUserId);
      const alreadyApplied = (existing as any[]).some(
        (a: any) => a.application?.jobPostingId === input.jobPostingId
      );
      if (alreadyApplied) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "이미 해당 공고에 지원되어 있습니다." });
      }
      await createJobApplication({
        applicantUserId: input.studentUserId,
        jobPostingId: input.jobPostingId,
        status: "지원완료",
        coverLetterId: null,
      });
      await createNotification({
        userId: input.studentUserId,
        type: "job_applied",
        title: "채용공고 매칭 완료",
        message: "관리자가 채용공고를 매칭했습니다. 지원 현황에서 확인하세요.",
        relatedType: "job",
      });
      return { success: true };
    }),

  // 관리자: 매칭 이력 조회 (관리자가 매칭한 지원 내역 전체)
  adminGetMatchHistory: adminProcedure.query(async () => {
    return getAllStudentApplications();
  }),

  // 관리자: 일괄 매칭 (여러 재학생 → 동일 공고)
  adminBulkMatchJob: adminProcedure
    .input(z.object({ studentUserIds: z.array(z.number()), jobPostingId: z.number() }))
    .mutation(async ({ input }) => {
      const results: { userId: number; success: boolean; reason?: string }[] = [];
      for (const studentUserId of input.studentUserIds) {
        try {
          const existing = await getUserApplications(studentUserId);
          const alreadyApplied = (existing as any[]).some(
            (a: any) => a.application?.jobPostingId === input.jobPostingId
          );
          if (alreadyApplied) {
            results.push({ userId: studentUserId, success: false, reason: "이미 지원됨" });
            continue;
          }
          await createJobApplication({
            applicantUserId: studentUserId,
            jobPostingId: input.jobPostingId,
            status: "지원완료",
            coverLetterId: null,
          });
          await createNotification({
            userId: studentUserId,
            type: "job_applied",
            title: "채용공고 매칭 완료",
            message: "관리자가 채용공고를 매칭했습니다. 지원 현황에서 확인하세요.",
            relatedType: "job",
          });
          results.push({ userId: studentUserId, success: true });
        } catch {
          results.push({ userId: studentUserId, success: false, reason: "오류 발생" });
        }
      }
      return { results };
    }),

  // 관리자: 역할 변경
  adminUpdateRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["student", "professor", "company", "training_center", "admin", "user"]) }))
    .mutation(async ({ input }) => {
      await updateUserRole(input.userId, input.role);
      return { success: true };
    }),

  // 관리자: 회원 이름 수정
  adminUpdateUserName: adminProcedure
    .input(z.object({ userId: z.number(), name: z.string().min(1, "이름을 입력하세요.").max(100) }))
    .mutation(async ({ input }) => {
      await updateUserName(input.userId, input.name.trim());
      return { success: true };
    }),

  // 공개 취업 랜딩페이지 (이력서 + 자기소개서 + 포트폴리오)
  getPublicResume: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // slug로 학생 프로필 찾기
      const profileResult = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.publicSlug, input.slug))
        .limit(1);
      const profile = profileResult[0];
      if (!profile || !profile.isPublic) {
        throw new TRPCError({ code: "NOT_FOUND", message: "공개된 프로필을 찾을 수 없습니다." });
      }

      // 사용자 정보
      const userResult = await db.select().from(users).where(eq(users.id, profile.userId)).limit(1);
      const user = userResult[0];
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      // 공개 포트폴리오 목록
      const publicPortfolios = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, profile.userId))
        .limit(10);
      const publicOnes = publicPortfolios.filter((p) => p.isPublic);

      // 각 포트폴리오 아이템
      const portfolioWithItems = await Promise.all(
        publicOnes.map(async (p) => {
          const items = await db.select().from(portfolioItems).where(eq(portfolioItems.portfolioId, p.id)).limit(6);
          return { ...p, items };
        })
      );

      // 최신 자기소개서 (공개된 것만)
      const coverLetterResult = await db
        .select()
        .from(coverLetters)
        .where(eq(coverLetters.userId, profile.userId))
        .limit(3);

      // AI 역량 분석 최신
      const analysisResult = await db
        .select()
        .from(aiAnalyses)
        .where(eq(aiAnalyses.userId, profile.userId))
        .limit(1);
      const analysis = analysisResult[0] ?? null;

      return {
        user: { name: user.name, email: user.email },
        profile,
        portfolios: portfolioWithItems,
        coverLetters: coverLetterResult,
        analysis,
      };
    }),
});
