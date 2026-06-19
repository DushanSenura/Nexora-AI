import { Link } from "react-router-dom";
import { Code2, Image, Search } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const agents = [
  { type: "research", title: "Research Agent", icon: Search, description: "Create concise research briefs with assumptions and next steps." },
  { type: "coding", title: "Coding Helper Agent", icon: Code2, description: "Plan implementation work, risks, tests, and code examples." },
  { type: "image-generater", title: "Image Generate Agent", icon: Image, description: "Turn rough ideas into detailed image-generation prompts." },
];

export function AgentsPage() {
  return (
    <>
      <PageHeader title="Agents" description="Run specialized workflows for research, coding help, and image prompt generation." />
      <div className="grid gap-4 md:grid-cols-3">
        {agents.map((agent) => (
          <Link key={agent.type} to={`/agents/${agent.type}`}>
            <Card className="h-full transition-colors hover:bg-muted">
              <CardHeader>
                <agent.icon className="h-5 w-5 text-primary" />
                <CardTitle>{agent.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{agent.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
