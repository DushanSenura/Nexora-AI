import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent } from "../../components/ui/card";

export function HistoryPage() {
  return (
    <>
      <PageHeader title="History" description="Review previous chats, document actions, and agent runs." />
      <Card><CardContent className="p-4 text-sm text-muted-foreground">No history filters applied.</CardContent></Card>
    </>
  );
}

