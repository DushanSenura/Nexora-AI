import { type ChangeEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Trash2, Upload } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
  type DocumentRecord,
} from "../../features/documents/documentApi";
import { cn } from "../../utils/cn";

const allowedTypes = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const maxFileSize = 10 * 1024 * 1024;

function formatBytes(value?: number) {
  if (!value) {
    return "-";
  }
  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function statusClass(status: DocumentRecord["status"]) {
  return cn(
    "inline-flex rounded-md px-2 py-1 text-xs font-medium",
    status === "ready" && "bg-primary/10 text-primary",
    status === "processing" && "bg-secondary/15 text-secondary-foreground",
    status === "uploaded" && "bg-muted text-muted-foreground",
    status === "failed" && "bg-destructive/10 text-destructive",
  );
}

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");

  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: async () => {
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: () => setError("Upload failed. Check file type, file size, and AI service status."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, TXT, and DOCX files are supported.");
      return;
    }

    if (file.size > maxFileSize) {
      setError("File size must be 10 MB or less.");
      return;
    }

    await uploadMutation.mutateAsync(file);
  }

  async function handleDelete(document: DocumentRecord) {
    const shouldDelete = window.confirm(`Delete "${document.file_name}"?`);
    if (!shouldDelete) {
      return;
    }
    await deleteMutation.mutateAsync(document.id);
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Documents" description="Upload PDF, TXT, and DOCX files for retrieval, summaries, and document-grounded chat." />
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
          />
          <Button onClick={handleUploadClick} disabled={uploadMutation.isPending}>
            <Upload className="h-4 w-4" />
            {uploadMutation.isPending ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardContent className="p-0">
          <div className="hidden grid-cols-[1fr_130px_110px_110px_72px] border-b px-4 py-3 text-sm font-medium text-muted-foreground md:grid">
            <span>Name</span>
            <span>Status</span>
            <span>Type</span>
            <span>Size</span>
            <span className="text-right">Actions</span>
          </div>

          {documentsQuery.isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading documents...</div>
          ) : null}

          {(documentsQuery.data ?? []).map((document) => (
            <div
              key={document.id}
              className="grid gap-3 border-b px-4 py-4 text-sm last:border-b-0 md:grid-cols-[1fr_130px_110px_110px_72px] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="truncate font-medium">{document.file_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {document.chunk_count ?? 0} chunks · {document.extracted_chars ?? 0} chars
                  </div>
                </div>
              </div>
              <span className={statusClass(document.status)}>{document.status}</span>
              <span className="text-muted-foreground">{document.file_name.split(".").pop()?.toUpperCase()}</span>
              <span className="text-muted-foreground">{formatBytes(document.file_size)}</span>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete document"
                  disabled={deleteMutation.isPending}
                  onClick={() => handleDelete(document)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {!documentsQuery.isLoading && !documentsQuery.data?.length ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No documents uploaded yet.</div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

