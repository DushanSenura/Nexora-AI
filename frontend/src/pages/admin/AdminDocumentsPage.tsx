import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent } from "../../components/ui/card";

export function AdminDocumentsPage() {
  return <section><PageHeader title="Documents" description="Track document ingestion status and storage." /><Card><CardContent className="p-4 text-sm">Document operations table.</CardContent></Card></section>;
}

