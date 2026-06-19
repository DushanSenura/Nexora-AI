import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getAdminOverview } from "../../features/admin/adminApi";

function AgentBar({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span>{value}</span></div>
      <div className="h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary" style={{ width: `${width}%` }} /></div>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const { data } = useQuery({ queryKey: ["adminOverview"], queryFn: getAdminOverview });
  const agents = data?.agents ?? { count: 0, research: 0, coding: 0, image: 0 };

  return (
    <section>
      <PageHeader title="Agent usage analytics" description="Compare usage across research, coding, and image-generation agents." />
      <Card>
        <CardHeader><CardTitle>Agent task mix</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <AgentBar label="Research" value={agents.research} total={agents.count} />
          <AgentBar label="Coding helper" value={agents.coding} total={agents.count} />
          <AgentBar label="Image generate" value={agents.image} total={agents.count} />
        </CardContent>
      </Card>
    </section>
  );
}
