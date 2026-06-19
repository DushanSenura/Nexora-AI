import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent } from "../../components/ui/card";
import { getUsageLogs } from "../../features/admin/adminApi";

export function AdminUsagePage() {
  const { data, isLoading } = useQuery({ queryKey: ["usageLogs"], queryFn: getUsageLogs });

  return (
    <section>
      <PageHeader title="Usage logs" description="Inspect user actions and token usage." />
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_160px_160px] border-b px-4 py-3 text-sm font-medium text-muted-foreground">
            <span>Action</span><span>User</span><span>Tokens</span>
          </div>
          {(data ?? []).map((log) => (
            <div key={log.id} className="grid grid-cols-[1fr_160px_160px] px-4 py-3 text-sm">
              <span>{log.action}</span><span className="truncate text-muted-foreground">{log.user_email}</span><span>{log.tokens_used}</span>
            </div>
          ))}
          {isLoading ? <div className="p-4 text-sm text-muted-foreground">Loading usage logs...</div> : null}
          {!isLoading && !data?.length ? <div className="p-4 text-sm text-muted-foreground">No usage logs yet.</div> : null}
        </CardContent>
      </Card>
    </section>
  );
}
