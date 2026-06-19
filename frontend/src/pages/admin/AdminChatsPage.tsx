import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getAdminOverview } from "../../features/admin/adminApi";

export function AdminChatsPage() {
  const { data } = useQuery({ queryKey: ["adminOverview"], queryFn: getAdminOverview });
  const chats = data?.chats.count ?? 0;
  const messages = data?.chats.messages ?? 0;

  return (
    <section>
      <PageHeader title="Chat analytics" description="Review chat volume and saved message counts." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Total chats</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{chats}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total messages</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{messages}</div></CardContent>
        </Card>
      </div>
    </section>
  );
}
