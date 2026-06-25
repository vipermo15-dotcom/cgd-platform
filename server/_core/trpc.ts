import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/**
 * 역할 기반 접근 제어 가드 팩토리.
 * 인증 여부와 역할을 동시에 검증한다. admin은 별도 명시가 없어도 항상 통과시킨다.
 */
const requireRole = (roles: string[], message: string) =>
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    if (ctx.user.role !== "admin" && !roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  });

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export const studentProcedure = t.procedure.use(
  requireRole(["student"], "교육생만 접근 가능합니다."),
);

export const professorProcedure = t.procedure.use(
  requireRole(["professor"], "학과장만 접근 가능합니다."),
);

export const companyProcedure = t.procedure.use(
  requireRole(["company"], "협력기업만 접근 가능합니다."),
);

export const trainingProcedure = t.procedure.use(
  requireRole(["training_center"], "공동훈련센터만 접근 가능합니다."),
);
