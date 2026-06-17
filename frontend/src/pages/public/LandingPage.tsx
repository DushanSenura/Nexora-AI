import { Link } from "react-router-dom";
import { ArrowRight, Bot, FileText, MessageSquare } from "lucide-react";
import { BrandLogo } from "../../components/BrandLogo";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const features = [
  { title: "AI chat", icon: MessageSquare, text: "Talk with local models and keep useful conversation history." },
  { title: "Documents", icon: FileText, text: "Upload knowledge and prepare it for retrieval workflows." },
  { title: "Agents", icon: Bot, text: "Run research, coding, and study planning tasks from one workspace." },
];

export function LandingPage() {
  return (
    <section>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <BrandLogo className="mb-6" imageClassName="scale-110" />
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal md:text-5xl">
            Nexora AI
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            A focused AI workspace for chat, documents, and specialized agents with local-model support.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/register"
              className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Create account
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <feature.icon className="h-5 w-5 text-primary" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{feature.text}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
