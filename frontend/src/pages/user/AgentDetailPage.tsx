import { useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export function AgentDetailPage() {
  const { agentType } = useParams();
  const title = agentType?.split("-").join(" ") ?? "agent";

  return (
    <>
      <PageHeader title={`${title} agent`} description="Describe the outcome you want and let the agent plan the steps." />
      <Card>
        <CardContent className="space-y-4 p-4">
          <textarea className="min-h-40 w-full rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Describe the task" />
          <Button>Run agent</Button>
        </CardContent>
      </Card>
    </>
  );
}

