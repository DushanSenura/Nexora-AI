import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent } from "../../components/ui/card";

export function AdminUsagePage() {
  return <section><PageHeader title="Usage" description="Inspect token usage and action logs." /><Card><CardContent className="p-4 text-sm">Usage logs table.</CardContent></Card></section>;
}

