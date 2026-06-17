import { Bot, FileText, MessageSquare, MousePointerClick } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const stats = [
  {
    label: "Total chats",
    value: "24",
    detail: "8 active this week",
    icon: MessageSquare,
  },
  {
    label: "Documents uploaded",
    value: "12",
    detail: "10 ready for search",
    icon: FileText,
  },
  {
    label: "Agent tasks",
    value: "8",
    detail: "3 completed today",
    icon: Bot,
  },
  {
    label: "Usage count",
    value: "81k",
    detail: "Tokens processed",
    icon: MousePointerClick,
  },
];

export function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Your recent AI activity, documents, and agent progress." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-3">
              <span>Research agent completed market summary</span>
              <span className="shrink-0">Today</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Uploaded product-roadmap.pdf</span>
              <span className="shrink-0">Yesterday</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Started API design review chat</span>
              <span className="shrink-0">Jun 15</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Usage status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 w-2/3 rounded-full bg-primary" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">67% of the monthly usage allowance has been consumed.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
