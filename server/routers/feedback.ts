import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { db } from "../_core/db";
import { platformFeedback } from "../../drizzle/schema";
import { desc } from "drizzle-orm";

export const feedbackRouter = router({
  // 설문 제출 (로그인된 모든 사용자)
  submit: protectedProcedure
    .input(
      z.object({
        role: z.string(),
        name: z.string().optional(),
        answers: z.record(z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.insert(platformFeedback).values({
        userId: ctx.user.id,
        role: input.role,
        name: input.name ?? ctx.user.name ?? "익명",
        answers: input.answers,
      });
      return { success: true };
    }),

  // 관리자 전체 조회
  adminList: adminProcedure.query(async () => {
    const rows = await db
      .select()
      .from(platformFeedback)
      .orderBy(desc(platformFeedback.createdAt));
    return rows;
  }),

  // 관리자 삭제
  adminDelete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { eq } = await import("drizzle-orm");
      await db.delete(platformFeedback).where(eq(platformFeedback.id, input.id));
      return { success: true };
    }),
});
