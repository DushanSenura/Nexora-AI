import { useParams } from "react-router-dom";
import { Send } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

export function ChatPage() {
  const { chatId } = useParams();

  return (
    <>
      <PageHeader title={chatId ? "Chat thread" : "New chat"} description="Ask questions, use local models, and keep the conversation history." />
      <div className="grid min-h-[calc(100vh-13rem)] gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Recent chats</h2>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <div>Research notes</div>
            <div>API design review</div>
            <div>Study plan draft</div>
          </div>
        </Card>
        <Card className="flex flex-col">
          <div className="flex-1 space-y-4 p-4">
            <div className="max-w-xl rounded-md bg-muted p-3 text-sm">How can I help with your workspace today?</div>
          </div>
          <form className="flex gap-2 border-t p-4">
            <Input placeholder="Message Nexora AI" />
            <Button size="icon" aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}

