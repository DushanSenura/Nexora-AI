import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent } from "../../components/ui/card";

export function AdminAnalyticsPage() {
  return <section><PageHeader title="Analytics" description="Understand adoption, latency, and workflow outcomes." /><Card><CardContent className="p-4 text-sm">Analytics charts.</CardContent></Card></section>;
}

