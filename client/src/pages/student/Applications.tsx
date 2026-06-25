import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ClipboardList, Building2, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";

const STATUS_COLORS: Record<string, string> = {
  "지원완료": "bg-blue-100 text-blue-700",
  "서류합격": "bg-green-100 text-green-700",
  "면접": "bg-yellow-100 text-yellow-700",
  "최종합격": "bg-emerald-100 text-emerald-700",
  "탈락": "bg-red-100 text-red-700",
};

const STATUS_ORDER = ["지원완료", "서류합격", "면접", "최종합격", "탈락"];

export default function StudentApplications() {
  const { data: applications = [] } = trpc.jobs.myApplications.useQuery();

  const grouped = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = applications.filter((a: any) => a.application.status === status);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <AppLayout title="지원 현황">
      <div className="p-6 space-y-6 pb-20 lg:pb-6">
        {/* Status summary */}
        <div className="grid grid-cols-5 gap-2">
          {STATUS_ORDER.map((status) => (
            <div key={status} className={`rounded-lg p-3 text-center ${STATUS_COLORS[status]}`}>
              <p className="text-xl font-bold">{grouped[status]?.length ?? 0}</p>
              <p className="text-xs mt-0.5">{status}</p>
            </div>
          ))}
        </div>

        {/* Application list */}
        {applications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardList size={48} className="mx-auto opacity-30 mb-4" />
            <p>아직 지원한 공고가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((item: any) => {
              const app = item.application;
              const posting = item.posting;
              const company = item.company;
              return (
                <Card key={app.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{posting.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 size={12} /> {company?.companyName ?? "회사명 없음"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          지원일: {format(new Date(app.createdAt), "yyyy.MM.dd", { locale: ko })}
                        </p>
                        {app.interviewDate && (
                          <p className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
                            <Calendar size={11} />
                            면접일: {format(new Date(app.interviewDate), "yyyy.MM.dd HH:mm", { locale: ko })}
                          </p>
                        )}
                        {app.interviewMessage && (
                          <p className="text-xs text-muted-foreground mt-1 bg-muted rounded p-2">{app.interviewMessage}</p>
                        )}
                      </div>
                      <Badge className={`flex-shrink-0 ${STATUS_COLORS[app.status] ?? ""}`}>
                        {app.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
