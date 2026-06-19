import { type FormEvent, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Send } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  askDocument,
  getDocument,
  listDocumentMessages,
  type DocumentMessage,
} from "../../features/documents/documentApi";
import { cn } from "../../utils/cn";

function DocumentMessageBubble({ message }: { message: DocumentMessage }) {
  const isUser = message.role === "user";
  const references = message.references ?? [];

  return (
    <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[min(44rem,86%)] rounded-lg px-4 py-3 text-sm leading-6",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {message.content}
      </div>
      {!isUser && references.length ? (
        <div className="max-w-[min(44rem,86%)] space-y-2 rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Source chunks
          </div>
          {references.map((reference) => (
            <div key={`${reference.chunk_index}-${reference.text}`} className="rounded-md bg-muted p-3 text-xs">
              <div className="mb-1 font-medium">Chunk {reference.chunk_index}</div>
              <p className="line-clamp-4 text-muted-foreground">{reference.text}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DocumentDetailPage() {
  const { documentId } = useParams();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");

  const documentQuery = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocument(documentId!),
    enabled: Boolean(documentId),
  });

  const messagesQuery = useQuery({
    queryKey: ["documentMessages", documentId],
    queryFn: () => listDocumentMessages(documentId!),
    enabled: Boolean(documentId),
  });

  const askMutation = useMutation({
    mutationFn: askDocument,
    onSuccess: async () => {
      setQuestion("");
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["documentMessages", documentId] });
    },
    onError: () => setError("Unable to answer from this document. Check processing status and AI service."),
  });

  const messages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);
  const document = documentQuery.data;
  const isReady = document?.status === "ready";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentId || !question.trim() || askMutation.isPending || !isReady) {
      return;
    }

    await askMutation.mutateAsync({ documentId, question: question.trim() });
  }

  return (
    <>
      <div className="mb-4">
        <Link to="/documents" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Documents
        </Link>
      </div>
      <PageHeader
        title={document?.file_name ?? "Document chat"}
        description="Ask questions that are answered only from the selected document context."
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Selected document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="font-medium">{document?.file_name ?? "Loading..."}</div>
            <div className="text-muted-foreground">Status: {document?.status ?? "unknown"}</div>
            <div className="text-muted-foreground">Chunks: {document?.chunk_count ?? 0}</div>
            <div className="text-muted-foreground">Characters: {document?.extracted_chars ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="flex min-h-[34rem] flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messagesQuery.isLoading ? <div className="text-sm text-muted-foreground">Loading document chat...</div> : null}
            {!messages.length && !messagesQuery.isLoading ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Ask a question from this document.
              </div>
            ) : null}
            {messages.map((message) => (
              <DocumentMessageBubble key={message.id} message={message} />
            ))}
            {askMutation.isPending ? (
              <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                Retrieving relevant chunks...
              </div>
            ) : null}
          </div>
          <form className="border-t p-4" onSubmit={handleSubmit}>
            {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
            {!isReady ? <p className="mb-3 text-sm text-muted-foreground">Document must be ready before chat is available.</p> : null}
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question from this document"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                disabled={!isReady || askMutation.isPending}
              />
              <Button size="icon" aria-label="Ask document" disabled={!isReady || askMutation.isPending || !question.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

