import { Link } from "react-router-dom";
import { Code2, GraduationCap, Search } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const agents = [
  { type: "research", title: "Research", icon: Search },
  { type: "coding", title: "Coding", icon: Code2 },
  { type: "study-planner", title: "Study planner", icon: GraduationCap },
];

export function AgentsPage() {
  return (
    <>
      <PageHeader title="Agents" description="Run specialized workflows for research, coding, and study planning." />
      <div className="grid gap-4 md:grid-cols-3">
        {agents.map((agent) => (
          <Link key={agent.type} to={`/agents/${agent.type}`}>
            <Card className="h-full transition-colors hover:bg-muted">
              <CardHeader>
                <agent.icon className="h-5 w-5 text-primary" />
                <CardTitle>{agent.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Create a new {agent.title.toLowerCase()} task.</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

