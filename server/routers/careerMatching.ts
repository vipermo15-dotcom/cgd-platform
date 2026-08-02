import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  careerMatchingRecords,
  careerMatchingComments,
  resumes,
  coverLetters,
  portfolios,
} from "../../drizzle/schema";
import { eq, desc, inArray } from "drizzle-orm";

function isStaff(role: string) {
  return role === "admin" || role === "professor" || role === "training_center";
}

export const careerMatchingRouter = router({
  // ─── 학과장/공동훈련센터: 진로 매칭 자료 등록 ───────────────────────────────
  createMatchingRecord: protectedProcedure
    .input(
      z.object({
        studentUserId: z.number(),
        resumeId: z.number().optional(),
        coverLetterId: z.number().optional(),
        portfolioId: z.number().optional(),
        desiredEmployerLink: z.string().optional(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [result] = await db.insert(careerMatchingRecords).values({
        studentUserId: input.studentUserId,
        professorUserId: ctx.user.id,
        resumeId: input.resumeId,
        coverLetterId: input.coverLetterId,
        portfolioId: input.portfolioId,
        desiredEmployerLink: input.desiredEmployerLink,
        note: input.note,
      });
      return { id: (result as any).insertId };
    }),

  // ─── 학생 본인 / 학과장 / 공동훈련센터: 누적 매칭 자료 + 댓글 조회 ───────────
  getMatchingRecords: protectedProcedure
    .input(z.object({ studentUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      const isSelf = ctx.user.id === input.studentUserId;
      if (!isSelf && !isStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const records = await db
        .select()
        .from(careerMatchingRecords)
        .where(eq(careerMatchingRecords.studentUserId, input.studentUserId))
        .orderBy(desc(careerMatchingRecords.createdAt));

      if (records.length === 0) return [];

      const recordIds = records.map((r) => r.id);
      const [resumeRows, coverLetterRows, portfolioRows, commentRows] = await Promise.all([
        db.select().from(resumes).where(eq(resumes.userId, input.studentUserId)),
        db.select().from(coverLetters).where(eq(coverLetters.userId, input.studentUserId)),
        db.select().from(portfolios).where(eq(portfolios.userId, input.studentUserId)),
        db
          .select()
          .from(careerMatchingComments)
          .where(inArray(careerMatchingComments.recordId, recordIds))
          .orderBy(careerMatchingComments.createdAt),
      ]);

      const resumeById = new Map(resumeRows.map((r) => [r.id, r]));
      const coverLetterById = new Map(coverLetterRows.map((r) => [r.id, r]));
      const portfolioById = new Map(portfolioRows.map((r) => [r.id, r]));

      return records.map((record) => ({
        ...record,
        resume: record.resumeId ? resumeById.get(record.resumeId) ?? null : null,
        coverLetter: record.coverLetterId ? coverLetterById.get(record.coverLetterId) ?? null : null,
        portfolio: record.portfolioId ? portfolioById.get(record.portfolioId) ?? null : null,
        comments: commentRows.filter((c) => c.recordId === record.id),
      }));
    }),

  // ─── 학생 본인 / 학과장 / 공동훈련센터: 댓글 등록 ────────────────────────────
  addMatchingComment: protectedProcedure
    .input(z.object({ recordId: z.number(), content: z.string().min(1, "내용을 입력하세요.") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [record] = await db
        .select({ id: careerMatchingRecords.id, studentUserId: careerMatchingRecords.studentUserId })
        .from(careerMatchingRecords)
        .where(eq(careerMatchingRecords.id, input.recordId))
        .limit(1);
      if (!record) throw new TRPCError({ code: "NOT_FOUND" });

      const isSelf = ctx.user.id === record.studentUserId;
      if (!isSelf && !isStaff(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });

      await db.insert(careerMatchingComments).values({
        recordId: input.recordId,
        authorUserId: ctx.user.id,
        authorRole: isStaff(ctx.user.role) ? "admin" : "student",
        content: input.content,
      });
      return { success: true };
    }),
});
