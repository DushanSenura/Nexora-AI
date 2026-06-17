import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function AdminOverviewPage() {
  return (
    <section>
      <PageHeader title="Admin overview" description="Monitor users, chats, documents, usage, and platform analytics." />
      <div className="grid gap-4 md:grid-cols-4">
        {["Users", "Chats", "Documents", "Usage"].map((item) => (
          <Card key={item}>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">{item}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">128</div></CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

