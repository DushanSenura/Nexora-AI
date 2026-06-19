import { type FormEvent, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Clock } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  listAgentTasks,
  runAgent,
  type AgentTask,
  type AgentType,
} from "../../features/agents/agentApi";

const agentLabels: Record<AgentType, { title: string; description: string; placeholder: string }> = {
  research: {
    title: "Research Agent",
    description: "Get a focused research brief with findings, assumptions, and verification steps.",
    placeholder: "Research the current state of local-first AI productivity tools.",
  },
  coding: {
    title: "Coding Helper Agent",
    description: "Get implementation steps, risks, tests, and concise code examples.",
    placeholder: "Help me add pagination to the documents table.",
  },
  "image-generater": {
    title: "Image Generate Agent",
    description: "Create detailed prompts for image generation workflows.",
    placeholder: "Create a futuristic product hero image prompt for Nexora AI.",
  },
};

function isAgentType(value: string | undefined): value is AgentType {
  return value === "research" || value === "coding" || value === "image-generater";
}

function TaskPreview({ task }: { task: AgentTask }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {new Date(task.created_at).toLocaleString()}
      </div>
      <div className="mt-2 line-clamp-2 text-sm font-medium">{task.input}</div>
      <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">{task.output}</p>
    </div>
  );
}

export function AgentDetailPage() {
  const params = useParams();
  const agentType = isAgentType(params.agentType) ? params.agentType : "research";
  const metadata = agentLabels[agentType];
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [latestTask, setLatestTask] = useState<AgentTask | null>(null);
  const [error, setError] = useState("");

  const tasksQuery = useQuery({
    queryKey: ["agentTasks", agentType],
    queryFn: () => listAgentTasks(agentType),
  });

  const runMutation = useMutation({
    mutationFn: runAgent,
    onSuccess: async (task) => {
      setLatestTask(task);
      setInput("");
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["agentTasks", agentType] });
    },
    onError: () => setError("Unable to run this agent. Check that the AI service is running."),
  });

  const history = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const output = latestTask?.output ?? history[0]?.output;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim();
    if (!value || runMutation.isPending) {
      return;
    }
    await runMutation.mutateAsync({ agentType, input: value });
  }

  return (
    <>
      <PageHeader title={metadata.title} description={metadata.description} />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Agent workspace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <textarea
                  className="min-h-44 w-full rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder={metadata.placeholder}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={runMutation.isPending}
                />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" disabled={!input.trim() || runMutation.isPending}>
                  {runMutation.isPending ? "Running..." : "Run agent"}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Agent output</CardTitle>
            </CardHeader>
            <CardContent>
              {runMutation.isPending ? (
                <div className="text-sm text-muted-foreground">Thinking through the task...</div>
              ) : output ? (
                <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-6">{output}</pre>
              ) : (
                <div className="text-sm text-muted-foreground">Run an agent task to see output here.</div>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Previous tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksQuery.isLoading ? <div className="text-sm text-muted-foreground">Loading tasks...</div> : null}
            {history.map((task) => (
              <TaskPreview key={task.id} task={task} />
            ))}
            {!tasksQuery.isLoading && !history.length ? (
              <div className="text-sm text-muted-foreground">No previous tasks for this agent.</div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

