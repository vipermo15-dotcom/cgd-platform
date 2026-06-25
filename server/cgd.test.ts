import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  const clearedCookies: any[] = [];
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "테스트 사용자",
      loginMethod: "manus",
      role: "student",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: {
      clearCookie: (name: string, opts: any) => clearedCookies.push({ name, opts }),
    } as any,
  };
}

function makeAdminCtx() {
  return makeCtx({ id: 99, role: "admin", openId: "admin-user", name: "관리자" });
}

function makeProfessorCtx() {
  return makeCtx({ id: 2, role: "professor", openId: "prof-user", name: "교수님" });
}

function makeCompanyCtx() {
  return makeCtx({ id: 3, role: "company", openId: "company-user", name: "기업담당자" });
}

function makeTrainingCtx() {
  return makeCtx({ id: 4, role: "training_center", openId: "training-user", name: "훈련센터" });
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("테스트 사용자");
  });

  it("logout clears session cookie and returns success", async () => {
    const clearedCookies: any[] = [];
    const ctx: TrpcContext = {
      user: makeCtx().user,
      req: { protocol: "https", headers: {} } as any,
      res: {
        clearCookie: (name: string, opts: any) => clearedCookies.push({ name, opts }),
      } as any,
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBeGreaterThan(0);
  });
});

// ─── Role-based Access Tests ──────────────────────────────────────────────────

describe("role-based access", () => {
  it("professor procedures reject non-professor users", async () => {
    const ctx = makeCtx({ role: "student" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.professor.getDashboardStats()).rejects.toThrow();
  });

  it("professor procedures allow professor users", async () => {
    const ctx = makeProfessorCtx();
    const caller = appRouter.createCaller(ctx);
    // Should not throw (may return null without DB)
    await expect(caller.professor.getDashboardStats()).resolves.not.toThrow();
  }, 10000);

  it("company procedures reject non-company users", async () => {
    const ctx = makeCtx({ role: "student" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.company.searchStudents({ field: undefined, search: undefined })).rejects.toThrow();
  });

  it("training procedures reject non-training users", async () => {
    const ctx = makeCtx({ role: "student" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.training.getDashboardStats()).rejects.toThrow();
  });

  it("training procedures allow training_center users", async () => {
    const ctx = makeTrainingCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.training.getDashboardStats()).resolves.toBeDefined();
  });

  it("admin procedures reject non-admin users", async () => {
    const ctx = makeCtx({ role: "student" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getStats()).rejects.toThrow();
  });

  it("admin procedures allow admin users", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getStats()).resolves.toBeDefined();
  });

  // 중앙화된 역할 가드: admin은 모든 역할 프로시저를 우회 통과해야 한다
  it("admin can access professor procedures (admin override)", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.professor.getDashboardStats()).resolves.not.toThrow();
  }, 10000);

  it("admin can access company procedures (admin override)", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.company.searchStudents({ field: undefined, search: undefined }),
    ).resolves.not.toThrow();
  }, 10000);

  // 교차 역할 거부: 한 역할이 다른 역할 전용 프로시저를 호출하면 막혀야 한다
  it("professor cannot access company procedures", async () => {
    const ctx = makeProfessorCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.company.searchStudents({ field: undefined, search: undefined }),
    ).rejects.toThrow();
  });

  it("company cannot access professor procedures", async () => {
    const ctx = makeCompanyCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.professor.getDashboardStats()).rejects.toThrow();
  });

  it("company procedures reject unauthenticated users", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.company.searchStudents({ field: undefined, search: undefined }),
    ).rejects.toThrow();
  });
});

// ─── Portfolio Tests ──────────────────────────────────────────────────────────

describe("portfolio", () => {
  it("getPublic is accessible without authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(ctx);
    // getPublic is a publicProcedure that takes a slug
    await expect(caller.portfolio.getPublic({ slug: "nonexistent" })).rejects.toThrow();
  });

  it("create requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.portfolio.create({
      title: "테스트 작품",
      category: "branding",
      isPublic: true,
    })).rejects.toThrow();
  });
});

// ─── Jobs Tests ───────────────────────────────────────────────────────────────

describe("jobs", () => {
  it("list is publicly accessible", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.jobs.list({})).resolves.toBeDefined();
  });

  it("create requires company role", async () => {
    const ctx = makeCtx({ role: "student" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.jobs.create({
      title: "디자이너 채용",
      description: "설명",
      employmentType: "정규직",
    })).rejects.toThrow();
  });

  it("adminPendingPostings requires admin role", async () => {
    const ctx = makeCtx({ role: "company" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.jobs.adminPendingPostings()).rejects.toThrow();
  });

  it("adminPendingPostings succeeds for admin", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.jobs.adminPendingPostings()).resolves.toBeDefined();
  });
});

// ─── AI Router Tests ──────────────────────────────────────────────────────────

describe("ai router", () => {
  it("analyzePortfolio requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.ai.analyzePortfolio()).rejects.toThrow();
  });

  it("getLatest resolves without throwing for authenticated user", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    // Should resolve (may return null/undefined without DB)
    await expect(caller.ai.getLatest()).resolves.not.toThrow();
  });
});

// ─── Notification Tests ───────────────────────────────────────────────────────

describe("notifications", () => {
  it("getNotifications requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.user.getNotifications({ limit: 10 })).rejects.toThrow();
  });

  it("getUnreadCount is accessible for authenticated user", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.user.getUnreadCount()).resolves.toBeDefined();
  });
});

// ─── HRD-Net Report Tests ─────────────────────────────────────────────────────

describe("professor downloadReport", () => {
  it("returns excel data url with xlsx extension", async () => {
    const ctx = makeProfessorCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.professor.downloadReport({ format: "excel" });
    expect(result.filename).toMatch(/\.xlsx$/);
    expect(result.url).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  });

  it("returns pdf data url with pdf extension", async () => {
    const ctx = makeProfessorCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.professor.downloadReport({ format: "pdf" });
    expect(result.filename).toMatch(/\.pdf$/);
    expect(result.url).toContain("text/html");
  });

  it("rejects non-professor users", async () => {
    const ctx = makeCtx({ role: "student" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.professor.downloadReport({ format: "excel" })).rejects.toThrow();
  });
});
