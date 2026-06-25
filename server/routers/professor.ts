import { z } from "zod/v4";
import {
  createFeedback,
  createNotification,
  getAllStudents,
  getAllStudentApplications,
  getDashboardStats,
  getEmploymentByCategory,
  getMonthlyEmploymentStats,
  getPartnerCompanies,
  getStudentFeedbacks,
  getStudentProfile,
  getUserById,
} from "../db";
import { adminProcedure, professorProcedure, router } from "../_core/trpc";

export const professorRouter = router({
  // 대시보드 통계
  getDashboardStats: professorProcedure.query(async () => {
    return getDashboardStats();
  }),

  // 월별 취업률
  getMonthlyStats: professorProcedure.query(async () => {
    return getMonthlyEmploymentStats();
  }),

  // 직군별 취업 분포
  getCategoryStats: professorProcedure.query(async () => {
    return getEmploymentByCategory();
  }),

  // 학생 목록
  getStudents: professorProcedure
    .input(z.object({
      employmentStatus: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return getAllStudents(input);
    }),

  // 학생 상세 (프로필 + 피드백)
  getStudentDetail: professorProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.userId);
      const profile = await getStudentProfile(input.userId);
      const feedbacks = await getStudentFeedbacks(input.userId);
      return { user, profile, feedbacks };
    }),

  // 피드백 작성
  createFeedback: professorProcedure
    .input(z.object({
      studentUserId: z.number(),
      content: z.string().min(1),
      rating: z.number().min(1).max(5),
    }))
    .mutation(async ({ ctx, input }) => {
      await createFeedback({
        professorUserId: ctx.user.id,
        studentUserId: input.studentUserId,
        content: input.content,
        rating: input.rating,
      });
      // 학생에게 알림
      await createNotification({
        userId: input.studentUserId,
        type: "feedback_received",
        title: "교수 피드백",
        message: "교수님으로부터 새 피드백이 작성되었습니다.",
        relatedId: ctx.user.id,
        relatedType: "feedback",
      });
      return { success: true };
    }),

  // 전체 학생 채용공고 지원 현황 (매칭 현황)
  getJobMatchingStatus: professorProcedure.query(async () => {
    return getAllStudentApplications();
  }),

  // 협력기업 현황
  getPartnerCompanies: professorProcedure.query(async () => {
    return getPartnerCompanies();
  }),

  // HRD-Net 보고서 다운로드 (실제 Excel .xlsx / 인쇄용 HTML PDF)
  downloadReport: professorProcedure
    .input(z.object({ format: z.enum(["excel", "pdf"]) }))
    .mutation(async ({ input }) => {
      const ExcelJS = await import("exceljs");
      const stats = await getDashboardStats();
      const monthly = await getMonthlyEmploymentStats();
      const students = await getAllStudents({});

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;

      if (input.format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'CGD 취업지원 플랫폼';
        workbook.created = now;

        // Sheet 1: 학생 취업현황
        const sheet1 = workbook.addWorksheet('학생 취업현황');
        sheet1.columns = [
          { header: '이름', key: 'name', width: 12 },
          { header: '학번', key: 'studentId', width: 14 },
          { header: '전공', key: 'major', width: 18 },
          { header: '취업상태', key: 'status', width: 14 },
          { header: '취업회사', key: 'company', width: 20 },
          { header: '취업일', key: 'employedAt', width: 14 },
        ];
        sheet1.getRow(1).font = { bold: true };
        sheet1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
        for (const s of students as any[]) {
          sheet1.addRow({
            name: s.user?.name ?? '',
            studentId: s.profile?.studentId ?? '',
            major: s.profile?.major ?? '',
            status: s.profile?.employmentStatus ?? '',
            company: s.profile?.employedCompany ?? '',
            employedAt: s.profile?.employedAt ? new Date(s.profile.employedAt).toLocaleDateString('ko-KR') : '',
          });
        }

        // Sheet 2: 월별 취업률
        const sheet2 = workbook.addWorksheet('월별 취업률');
        sheet2.columns = [
          { header: '연월', key: 'month', width: 12 },
          { header: '취업자 수', key: 'count', width: 12 },
          { header: '취업률(%)', key: 'rate', width: 14 },
        ];
        sheet2.getRow(1).font = { bold: true };
        sheet2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
        for (const m of monthly as any[]) {
          sheet2.addRow({ month: m.month, count: m.count, rate: m.rate });
        }

        // Sheet 3: 요약
        const sheet3 = workbook.addWorksheet('요약 통계');
        sheet3.addRow(['항목', '값']);
        sheet3.getRow(1).font = { bold: true };
        sheet3.addRow(['전체 학생', stats?.totalStudents ?? 0]);
        sheet3.addRow(['취업 확정', stats?.employedStudents ?? 0]);
        sheet3.addRow(['취업률', `${stats?.employmentRate ?? 0}%`]);
        sheet3.addRow(['전체 공고', stats?.totalPostings ?? 0]);
        sheet3.addRow(['전체 지원', stats?.totalApplications ?? 0]);
        sheet3.columns = [{ width: 18 }, { width: 14 }];

        const buffer = await workbook.xlsx.writeBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
        return { url: dataUrl, filename: `HRD-Net_취업현황_${dateStr}.xlsx` };
      } else {
        // PDF: 인쇄 최적화 HTML
        const tableRows = (students as any[]).map((s) =>
          `<tr><td>${s.user?.name??''}</td><td>${s.profile?.studentId??''}</td><td>${s.profile?.major??''}</td><td>${s.profile?.employmentStatus??''}</td><td>${s.profile?.employedCompany??''}</td></tr>`
        ).join('');
        const monthlyRows = (monthly as any[]).map((m) =>
          `<tr><td>${m.month}</td><td>${m.count}</td><td>${m.rate}%</td></tr>`
        ).join('');
        const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<title>HRD-Net 취업현황 보고서</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Malgun Gothic', sans-serif; font-size: 11pt; color: #222; }
  h1 { font-size: 16pt; text-align: center; margin-bottom: 4px; }
  .subtitle { text-align: center; color: #666; font-size: 10pt; margin-bottom: 16px; }
  .summary { display: flex; gap: 16px; margin-bottom: 16px; }
  .stat-box { border: 1px solid #ccc; border-radius: 6px; padding: 10px 16px; text-align: center; flex: 1; }
  .stat-box .val { font-size: 20pt; font-weight: bold; color: #2563eb; }
  .stat-box .lbl { font-size: 9pt; color: #666; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 10pt; }
  th { background: #e8f0fe; font-weight: bold; text-align: center; }
  h2 { font-size: 12pt; margin-top: 20px; margin-bottom: 8px; border-left: 4px solid #2563eb; padding-left: 8px; }
  .footer { text-align: center; font-size: 9pt; color: #999; margin-top: 24px; }
</style></head><body>
<h1>HRD-Net 취업현황 보고서</h1>
<p class="subtitle">서울시기술교육원 컴퓨터그래픽디자인과 &nbsp;|&nbsp; 생성일: ${now.toLocaleDateString('ko-KR')}</p>
<div class="summary">
  <div class="stat-box"><div class="val">${stats?.totalStudents ?? 0}</div><div class="lbl">전체 학생</div></div>
  <div class="stat-box"><div class="val">${stats?.employedStudents ?? 0}</div><div class="lbl">취업 확정</div></div>
  <div class="stat-box"><div class="val">${stats?.employmentRate ?? 0}%</div><div class="lbl">취업률</div></div>
  <div class="stat-box"><div class="val">${stats?.totalApplications ?? 0}</div><div class="lbl">전체 지원</div></div>
</div>
<h2>학생 취업현황</h2>
<table><thead><tr><th>이름</th><th>학번</th><th>전공</th><th>취업상태</th><th>취업회사</th></tr></thead><tbody>${tableRows}</tbody></table>
<h2>월별 취업 통계</h2>
<table><thead><tr><th>연월</th><th>취업자 수</th><th>취업률</th></tr></thead><tbody>${monthlyRows}</tbody></table>
<div class="footer">서울시기술교육원 CGD 취업지원 플랫폼 자동 생성</div>
</body></html>`;
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
        return { url: dataUrl, filename: `HRD-Net_취업현황_${dateStr}.pdf` };
      }
    }),
});
