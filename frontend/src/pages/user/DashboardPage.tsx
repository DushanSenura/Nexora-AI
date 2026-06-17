import { Bot, FileText, MessageSquare, Zap } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const stats = [
  { label: "Chats", value: "24", icon: MessageSquare },
  { label: "Documents", value: "12", icon: FileText },
  { label: "Agent tasks", value: "8", icon: Bot },
  { label: "Tokens used", value: "81k", icon: Zap },
];

export function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Your recent AI activity, documents, and agent progress." />
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

