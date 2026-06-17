import { useParams } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export function DocumentDetailPage() {
  const { documentId } = useParams();
  return (
    <>
      <PageHeader title="Document details" description={`Document ID: ${documentId ?? "unknown"}`} />
      <Card>
        <CardHeader><CardTitle>Processing status</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Ready for search, summary, and chat retrieval.</CardContent>
      </Card>
    </>
  );
}

