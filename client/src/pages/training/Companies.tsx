import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Building2, Phone, Mail } from "lucide-react";

export default function TrainingCompanies() {
  const { data: companies = [] } = trpc.training.getPartnerCompanies.useQuery({});

  return (
    <AppLayout title="산학협력 기업 목록">
      <div className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">{companies.length}개 협력기업</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">등록된 협력기업이 없습니다.</div>
          ) : (
            companies.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {(c.companyName ?? c.name)?.[0] ?? <Building2 size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{c.companyName ?? c.name}</p>
                        {c.isMou && <Badge className="text-xs bg-blue-100 text-blue-700">MOU</Badge>}
                        {c.status && <Badge variant="secondary" className="text-xs">{c.status}</Badge>}
                      </div>
                      {(c.industry ?? c.field) && <p className="text-xs text-muted-foreground">{c.industry ?? c.field}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        {c.contactPhone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone size={11} /> {c.contactPhone}
                          </span>
                        )}
                        {c.contactEmail && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail size={11} /> {c.contactEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
