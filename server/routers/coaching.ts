import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { router, protectedProcedure, studentProcedure } from "../_core/trpc";
import { getDb, createNotification, getUserById } from "../db";
import {
  jobCoachingRequests,
  resumes,
  coverLetters,
  portfolios,
  users,
} from "../../drizzle/schema";

// 첨삭 검토 권한: 학과장 / 관리자 / 공동훈련센터 (admin은 항상 통과)
const REVIEWER_ROLES = ["admin", "professor", "training_center"];
function assertReviewer(role: string) {
  if (!REVIEWER_ROLES.includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "첨삭 권한이 없습니다." });
  }
}

export const coachingRouter = router({
  // ─── 교육생: 첨삭 요청 생성 ────────────────────────────────────────────────
  createRequest: studentProcedure
    .input(
      z.object({
        companyName: z.string().min(1, "회사명을 입력하세요."),
        jobTitle: z.string().min(1, "직무명을 입력하세요."),
        jobUrl: z.string().optional(),
        jobDescription: z.string().optional(),
        resumeId: z.number().optional(),
        coverLetterId: z.number().optional(),
        portfolioId: z.number().optional(),
        studentMessage: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await db.insert(jobCoachingRequests).values({
        studentUserId: ctx.user.id,
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        jobUrl: input.jobUrl,
        jobDescription: input.jobDescription,
        resumeId: input.resumeId,
        coverLetterId: input.coverLetterId,
        portfolioId: input.portfolioId,
        studentMessage: input.studentMessage,
        status: "pending",
      });
      return { id: result.insertId };
    }),

  // ─── 교육생: 내 첨삭 요청 목록 (첨삭 결과 포함) ────────────────────────────
  myRequests: studentProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(jobCoachingRequests)
      .where(eq(jobCoachingRequests.studentUserId, ctx.user.id))
      .orderBy(desc(jobCoachingRequests.createdAt));
  }),

  // ─── 교육생: 내 요청 삭제 (대기중인 것만) ──────────────────────────────────
  deleteRequest: studentProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [row] = await db
        .select()
        .from(jobCoachingRequests)
        .where(eq(jobCoachingRequests.id, input.id))
        .limit(1);
      if (!row || row.studentUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (row.status === "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "이미 첨삭이 완료된 요청은 삭제할 수 없습니다." });
      }
      await db.delete(jobCoachingRequests).where(eq(jobCoachingRequests.id, input.id));
      return { success: true };
    }),

  // ─── 검토자: 전체 요청 목록 (학생명 포함, 상태 필터) ──────────────────────
  listRequests: protectedProcedure
    .input(z.object({ status: z.enum(["pending", "in_review", "completed"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      assertReviewer(ctx.user.role);
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select({ request: jobCoachingRequests, studentName: users.name })
        .from(jobCoachingRequests)
        .leftJoin(users, eq(users.id, jobCoachingRequests.studentUserId))
        .where(input?.status ? eq(jobCoachingRequests.status, input.status) : undefined)
        .orderBy(desc(jobCoachingRequests.createdAt));
      return rows;
    }),

  // ─── 검토자: 요청 상세 (첨부 서류 내용 포함) ──────────────────────────────
  getRequestDetail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      assertReviewer(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [row] = await db
        .select()
        .from(jobCoachingRequests)
        .where(eq(jobCoachingRequests.id, input.id))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      const student = await getUserById(row.studentUserId);

      const [resume] = row.resumeId
        ? await db.select().from(resumes).where(eq(resumes.id, row.resumeId)).limit(1)
        : [undefined];
      const [coverLetter] = row.coverLetterId
        ? await db.select().from(coverLetters).where(eq(coverLetters.id, row.coverLetterId)).limit(1)
        : [undefined];
      const [portfolio] = row.portfolioId
        ? await db.select().from(portfolios).where(eq(portfolios.id, row.portfolioId)).limit(1)
        : [undefined];

      return {
        request: row,
        studentName: student?.name ?? "교육생",
        resume: resume ?? null,
        coverLetter: coverLetter ?? null,
        portfolio: portfolio ?? null,
      };
    }),

  // ─── 검토자: 검토 시작 표시 (pending → in_review) ─────────────────────────
  markInReview: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      assertReviewer(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(jobCoachingRequests)
        .set({ status: "in_review", reviewerUserId: ctx.user.id })
        .where(eq(jobCoachingRequests.id, input.id));
      return { success: true };
    }),

  // ─── 검토자: 첨삭 지도 작성 → 완료 + 학생 알림 ────────────────────────────
  respond: protectedProcedure
    .input(z.object({ id: z.number(), feedbackContent: z.string().min(1, "첨삭 내용을 입력하세요.") }))
    .mutation(async ({ ctx, input }) => {
      assertReviewer(ctx.user.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [row] = await db
        .select()
        .from(jobCoachingRequests)
        .where(eq(jobCoachingRequests.id, input.id))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(jobCoachingRequests)
        .set({
          feedbackContent: input.feedbackContent,
          reviewerUserId: ctx.user.id,
          reviewedAt: new Date(),
          status: "completed",
        })
        .where(eq(jobCoachingRequests.id, input.id));

      await createNotification({
        userId: row.studentUserId,
        type: "job_coaching",
        title: "채용공고 첨삭 완료",
        message: `'${row.companyName} - ${row.jobTitle}' 첨삭 지도가 도착했습니다.`,
        relatedId: row.id,
        relatedType: "job_coaching",
      });

      return { success: true };
    }),
});
