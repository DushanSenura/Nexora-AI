import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "../../features/admin/adminApi";

export function AdminOverviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ["adminOverview"], queryFn: getAdminOverview });
  const stats = [
    { label: "Users", value: data?.users.count ?? 0, detail: `${data?.users.disabled ?? 0} disabled` },
    { label: "Chats", value: data?.chats.count ?? 0, detail: `${data?.chats.messages ?? 0} messages` },
    { label: "Documents", value: data?.documents.count ?? 0, detail: `${data?.documents.ready ?? 0} ready` },
    { label: "Agent tasks", value: data?.agents.count ?? 0, detail: "All agent runs" },
  ];

  return (
    <section>
      <PageHeader title="Admin overview" description="Monitor users, chats, documents, usage, and platform analytics." />
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{isLoading ? "-" : item.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
