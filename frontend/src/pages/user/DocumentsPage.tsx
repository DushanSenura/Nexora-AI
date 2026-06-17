import { Upload } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export function DocumentsPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Documents" description="Upload files for retrieval, summaries, and document-grounded chat." />
        <Button><Upload className="h-4 w-4" /> Upload</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_140px_140px] border-b px-4 py-3 text-sm font-medium text-muted-foreground">
            <span>Name</span><span>Status</span><span>Type</span>
          </div>
          {["Product spec.pdf", "Meeting notes.docx", "Research links.md"].map((name) => (
            <div key={name} className="grid grid-cols-[1fr_140px_140px] px-4 py-3 text-sm">
              <span>{name}</span><span>Ready</span><span>{name.split(".").pop()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

