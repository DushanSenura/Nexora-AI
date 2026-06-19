import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getAdminOverview } from "../../features/admin/adminApi";

function Bar({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span>{value}</span></div>
      <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} /></div>
    </div>
  );
}

export function AdminDocumentsPage() {
  const { data } = useQuery({ queryKey: ["adminOverview"], queryFn: getAdminOverview });
  const documents = data?.documents ?? { count: 0, ready: 0, failed: 0 };

  return (
    <section>
      <PageHeader title="Document analytics" description="Track document ingestion and processing outcomes." />
      <Card>
        <CardHeader><CardTitle>Processing status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Bar label="Ready" value={documents.ready} total={documents.count} />
          <Bar label="Failed" value={documents.failed} total={documents.count} />
          <Bar label="Other" value={Math.max(0, documents.count - documents.ready - documents.failed)} total={documents.count} />
        </CardContent>
      </Card>
    </section>
  );
}
