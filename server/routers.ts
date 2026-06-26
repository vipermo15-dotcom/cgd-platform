import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { userRouter } from "./routers/user";
import { portfolioRouter } from "./routers/portfolio";
import { aiRouter } from "./routers/ai";
import { jobsRouter } from "./routers/jobs";
import { professorRouter } from "./routers/professor";
import { companyRouter, trainingRouter, adminRouter } from "./routers/company";
import { manualRouter } from "./routers/manual";
import { resumeRouter } from "./routers/resume";
import { guidanceRouter } from "./routers/guidance";
import { coachingRouter } from "./routers/coaching";
import { aiAgentRouter } from "./routers/ai-agent";
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  user: userRouter,
  portfolio: portfolioRouter,
  ai: aiRouter,
  jobs: jobsRouter,
  professor: professorRouter,
  company: companyRouter,
  training: trainingRouter,
  admin: adminRouter,
  manual: manualRouter,
  resume: resumeRouter,
  guidance: guidanceRouter,
  coaching: coachingRouter,
  aiAgent: aiAgentRouter,
});

export type AppRouter = typeof appRouter;
