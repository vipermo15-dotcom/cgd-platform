import { z } from "zod/v4";
import {
  createAiLog,
  createNotification,
  createPartnerCompany,
  getAiLogStats,
  getAiLogs,
  getDashboardStats,
  getPartnerCompanies,
  searchPublicStudents,
  toggleStudentBookmark,
  updatePartnerCompany,
} from "../db";
import { adminProcedure, companyProcedure, router, trainingProcedure } from "../_core/trpc";

export const companyRouter = router({
  // 인재 탐색
  searchStudents: companyProcedure
    .input(z.object({
      major: z.string().optional(),
      minScore: z.number().optional(),
      maxScore: z.number().optional(),
      skills: z.array(z.string()).optional(),
    }))
    .query(async ({ input }) => {
      return searchPublicStudents(input);
    }),

  // 학생 북마크 토글
  toggleStudentBookmark: companyProcedure
    .input(z.object({ studentUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const isBookmarked = await toggleStudentBookmark(ctx.user.id, input.studentUserId);
      return { isBookmarked };
    }),

  // 면접 요청 발송
  sendInterviewRequest: companyProcedure
    .input(z.object({
      studentUserId: z.number(),
      jobPostingId: z.number().optional(),
      message: z.string(),
      interviewDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await createNotification({
        userId: input.studentUserId,
        type: "interview_request",
        title: "면접 요청",
        message: input.message,
        relatedId: input.jobPostingId,
        relatedType: "job_posting",
      });
      return { success: true };
    }),
});

export const trainingRouter = router({
  // 대시보드 통계
  getDashboardStats: trainingProcedure.query(async () => {
    return getDashboardStats();
  }),

  // 협력기업 목록
  getPartnerCompanies: trainingProcedure
    .input(z.object({ status: z.string().optional(), isMou: z.boolean().optional() }))
    .query(async ({ input }) => {
      return getPartnerCompanies(input);
    }),

  // 협력기업 등록
  createPartnerCompany: trainingProcedure
    .input(z.object({
      companyName: z.string().min(1),
      industry: z.string().optional(),
      contactName: z.string().optional(),
      contactPhone: z.string().optional(),
      contactEmail: z.string().optional(),
      isMou: z.boolean().optional(),
      mouStartAt: z.string().optional(),
      mouExpiredAt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await createPartnerCompany({
        ...input,
        mouStartAt: input.mouStartAt ? new Date(input.mouStartAt) : undefined,
        mouExpiredAt: input.mouExpiredAt ? new Date(input.mouExpiredAt) : undefined,
      });
      return { success: true };
    }),

  // 협력기업 수정
  updatePartnerCompany: trainingProcedure
    .input(z.object({
      id: z.number(),
      companyName: z.string().optional(),
      industry: z.string().optional(),
      contactName: z.string().optional(),
      contactPhone: z.string().optional(),
      contactEmail: z.string().optional(),
      isMou: z.boolean().optional(),
      mouStartAt: z.string().optional(),
      mouExpiredAt: z.string().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, mouStartAt, mouExpiredAt, ...data } = input;
      await updatePartnerCompany(id, {
        ...data,
        mouStartAt: mouStartAt ? new Date(mouStartAt) : undefined,
        mouExpiredAt: mouExpiredAt ? new Date(mouExpiredAt) : undefined,
      });
      return { success: true };
    }),

  // AI 기업-학생 매칭
  aiMatching: trainingProcedure
    .input(z.object({
      companyId: z.number(),
      requiredSkills: z.array(z.string()),
      major: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const students = await searchPublicStudents({ major: input.major });
      // 간단한 스킬 매칭 점수 계산
      const matched = students
        .map(({ user, profile, analysis }) => {
          const studentSkills = (profile?.skills as string[] | null) ?? [];
          const matchCount = input.requiredSkills.filter(skill =>
            studentSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
          ).length;
          const matchRate = input.requiredSkills.length > 0
            ? Math.round((matchCount / input.requiredSkills.length) * 100)
            : 0;
          return { user, profile, analysis, matchRate };
        })
        .filter(s => s.matchRate > 0)
        .sort((a, b) => b.matchRate - a.matchRate)
        .slice(0, 10);

      await createAiLog({ type: "matching", tokensUsed: 0, success: true });
      return matched;
    }),
});

export const adminRouter = router({
  // 전체 통계
  getStats: adminProcedure.query(async () => {
    return getDashboardStats();
  }),

  // AI 로그
  getAiLogs: adminProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return getAiLogs(input.limit ?? 50);
    }),

  // AI 로그 통계
  getAiLogStats: adminProcedure.query(async () => {
    return getAiLogStats();
  }),
});
