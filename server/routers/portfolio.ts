import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod/v4";
import {
  createPortfolio,
  createPortfolioItem,
  deletePortfolio,
  deletePortfolioItem,
  getPortfolioById,
  getPortfolioBySlug,
  getPortfolioItems,
  getUserPortfolios,
  updatePortfolio,
  updatePortfolioItem,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

export const portfolioRouter = router({
  // 내 포트폴리오 목록
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserPortfolios(ctx.user.id);
  }),

  // 포트폴리오 생성
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const slug = `${nanoid(8)}`;
      await createPortfolio({
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        isPublic: input.isPublic ?? false,
        publicSlug: slug,
      });
      return { success: true, slug };
    }),

  // 포트폴리오 수정
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      isPublic: z.boolean().optional(),
      publicSlug: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const portfolio = await getPortfolioById(input.id);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      await updatePortfolio(id, data);
      return { success: true };
    }),

  // 포트폴리오 삭제
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const portfolio = await getPortfolioById(input.id);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await deletePortfolio(input.id);
      return { success: true };
    }),

  // 포트폴리오 작품 목록
  getItems: protectedProcedure
    .input(z.object({ portfolioId: z.number() }))
    .query(async ({ ctx, input }) => {
      const portfolio = await getPortfolioById(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getPortfolioItems(input.portfolioId);
    }),

  // 작품 추가
  addItem: protectedProcedure
    .input(z.object({
      portfolioId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      category: z.string().optional(),
      mediaType: z.enum(["image", "video", "youtube"]),
      mediaUrl: z.string().min(1),
      thumbnailUrl: z.string().optional(),
      tools: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const portfolio = await getPortfolioById(input.portfolioId);
      if (!portfolio || portfolio.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await createPortfolioItem({ ...input, userId: ctx.user.id });
      return { success: true };
    }),

  // 작품 수정
  updateItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      tools: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updatePortfolioItem(id, data);
      return { success: true };
    }),

  // 작품 삭제
  deleteItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deletePortfolioItem(input.id);
      return { success: true };
    }),

  // 파일 업로드 URL 생성 (이미지/영상)
  uploadMedia: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      contentType: z.string(),
      base64Data: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64Data, "base64");
      const key = `portfolios/${ctx.user.id}/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.contentType);
      return { url, key };
    }),

  // 공개 포트폴리오 조회 (slug)
  getPublic: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const portfolio = await getPortfolioBySlug(input.slug);
      if (!portfolio || !portfolio.isPublic) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const items = await getPortfolioItems(portfolio.id, true);
      await updatePortfolio(portfolio.id, { viewCount: (portfolio.viewCount ?? 0) + 1 });
      return { portfolio, items };
    }),
});
