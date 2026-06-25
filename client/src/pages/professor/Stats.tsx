import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];

export default function ProfessorStats() {
  const { data: stats } = trpc.professor.getDashboardStats.useQuery();
  const { data: monthlyData = [] } = trpc.professor.getMonthlyStats.useQuery();
  const { data: categoryData = [] } = trpc.professor.getCategoryStats.useQuery();

  const downloadReport = trpc.professor.downloadReport.useMutation({
    onSuccess: (data: { url: string; filename: string }) => {
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.filename;
      link.click();
      toast.success(`${data.filename} 다운로드 시작`);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  return (
    <AppLayout title="통계 & 보고서">
      <div className="p-6 space-y-6">
        {/* Download buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => downloadReport.mutate({ format: "excel" })}
            disabled={downloadReport.isPending}
          >
            <FileSpreadsheet size={18} className="text-green-600" />
            HRD-Net 보고서 Excel
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => downloadReport.mutate({ format: "pdf" })}
            disabled={downloadReport.isPending}
          >
            <FileText size={18} className="text-red-600" />
            HRD-Net 보고서 PDF
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "전체 재학생", value: stats?.totalStudents ?? 0 },
            { label: "취업 확정", value: stats?.employedStudents ?? 0 },
            { label: "취업률", value: `${stats?.employmentRate ?? 0}%` },
            { label: "총 포트폴리오", value: stats?.totalPortfolios ?? 0 },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">월별 취업률 (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v) => [`${v}%`, "취업률"]} />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category pie chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">분야별 취업 현황</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryData.map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  데이터가 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
