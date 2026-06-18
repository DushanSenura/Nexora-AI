import { type FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Eraser, Globe2, MessageSquarePlus, Send, Trash2, X } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { cn } from "../../utils/cn";
import {
  clearChatMessages,
  createChat,
  deleteChat,
  listChats,
  listMessages,
  renameChat,
  sendMessage,
  type ChatRecord,
  type MessageRecord,
} from "../../features/chat/chatApi";

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: MessageRecord }) {
  const isUser = message.role === "user";
  const sources = message.sources ?? [];

  return (
    <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[min(42rem,85%)] rounded-lg px-4 py-3 text-sm leading-6",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {message.content}
      </div>
      {!isUser && sources.length ? (
        <div className="max-w-[min(42rem,85%)] space-y-2 rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Globe2 className="h-3.5 w-3.5" />
            Sources
          </div>
          <div className="space-y-2">
            {sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md p-2 text-xs hover:bg-muted"
              >
                <div className="font-medium text-foreground">{source.title}</div>
                {source.snippet ? <div className="mt-1 line-clamp-2 text-muted-foreground">{source.snippet}</div> : null}
                <div className="mt-1 truncate text-primary">{source.url}</div>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const chatsQuery = useQuery({
    queryKey: ["chats"],
    queryFn: listChats,
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => listMessages(chatId!),
    enabled: Boolean(chatId),
  });

  const createChatMutation = useMutation({
    mutationFn: createChat,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chats"] }),
        queryClient.invalidateQueries({ queryKey: ["messages", variables.chatId] }),
      ]);
    },
  });

  const renameChatMutation = useMutation({
    mutationFn: renameChat,
    onSuccess: async () => {
      setEditingChatId(null);
      setEditingTitle("");
      await queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: deleteChat,
    onSuccess: async (_data, deletedChatId) => {
      await queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.removeQueries({ queryKey: ["messages", deletedChatId] });
      if (deletedChatId === chatId) {
        navigate("/chat", { replace: true });
      }
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: clearChatMessages,
    onSuccess: async (_data, clearedChatId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chats"] }),
        queryClient.invalidateQueries({ queryKey: ["messages", clearedChatId] }),
      ]);
    },
  });

  const messages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);
  const isSending = createChatMutation.isPending || sendMessageMutation.isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = message.trim();
    if (!content || isSending) {
      return;
    }

    setError("");

    try {
      let activeChatId = chatId;
      if (!activeChatId) {
        const chat = await createChatMutation.mutateAsync("New chat");
        activeChatId = chat.id;
        navigate(`/chat/${chat.id}`, { replace: true });
      }

      setMessage("");
      await sendMessageMutation.mutateAsync({ chatId: activeChatId, content, searchMode });
    } catch {
      setMessage(content);
      setError("Unable to send message. Check that the backend and AI service are running.");
    }
  }

  async function handleRenameSubmit(event: FormEvent<HTMLFormElement>, chat: ChatRecord) {
    event.preventDefault();
    const title = editingTitle.trim();
    if (!title || renameChatMutation.isPending) {
      return;
    }

    await renameChatMutation.mutateAsync({ chatId: chat.id, title });
  }

  async function handleDelete(chat: ChatRecord) {
    const shouldDelete = window.confirm(`Delete "${chat.title}"?`);
    if (!shouldDelete) {
      return;
    }

    await deleteChatMutation.mutateAsync(chat.id);
  }

  async function handleClearCurrentChat() {
    if (!chatId || clearChatMutation.isPending) {
      return;
    }

    await clearChatMutation.mutateAsync(chatId);
  }

  return (
    <>
      <PageHeader title={chatId ? "Chat thread" : "New chat"} description="Ask questions, use local models, and keep the conversation history." />
      <div className="grid min-h-[calc(100vh-13rem)] gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Recent chats</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/chat")}>
              <MessageSquarePlus className="h-4 w-4" />
              New
            </Button>
          </div>
          <div className="mt-3 space-y-1 text-sm">
            {chatsQuery.isLoading ? (
              <div className="text-muted-foreground">Loading chats...</div>
            ) : null}
            {(chatsQuery.data ?? []).map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group flex min-h-10 items-center gap-1 rounded-md px-2 text-muted-foreground hover:bg-muted hover:text-foreground",
                  chat.id === chatId && "bg-muted text-foreground",
                )}
              >
                {editingChatId === chat.id ? (
                  <form className="flex min-w-0 flex-1 items-center gap-1" onSubmit={(event) => handleRenameSubmit(event, chat)}>
                    <Input
                      className="h-8"
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      autoFocus
                    />
                    <Button type="button" variant="ghost" size="icon" aria-label="Cancel rename" onClick={() => setEditingChatId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <>
                    <Link to={`/chat/${chat.id}`} className="min-w-0 flex-1 truncate px-1 py-2">
                      {chat.title}
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Rename chat"
                      onClick={() => {
                        setEditingChatId(chat.id);
                        setEditingTitle(chat.title);
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Delete chat"
                      onClick={() => handleDelete(chat)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            {!chatsQuery.isLoading && !chatsQuery.data?.length ? (
              <div className="text-muted-foreground">No chats yet.</div>
            ) : null}
          </div>
        </Card>
        <Card className="flex min-h-[34rem] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">
                {chatsQuery.data?.find((chat) => chat.id === chatId)?.title ?? "New chat"}
              </h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!chatId || clearChatMutation.isPending}
              onClick={handleClearCurrentChat}
            >
              <Eraser className="h-4 w-4" />
              Clear
            </Button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {!chatId ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Start a new chat by sending a message.
              </div>
            ) : null}
            {messagesQuery.isLoading ? <div className="text-sm text-muted-foreground">Loading messages...</div> : null}
            {messages.map((item) => (
              <MessageBubble key={item.id} message={item} />
            ))}
            {isSending ? (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted">
                  {searchMode ? <div className="px-3 pt-2 text-xs text-muted-foreground">Searching the web...</div> : null}
                  <LoadingDots />
                </div>
              </div>
            ) : null}
          </div>
          <form className="border-t p-4" onSubmit={handleSubmit}>
            {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={searchMode}
                  onChange={(event) => setSearchMode(event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Search web
              </label>
              {searchMode ? <span className="text-xs text-muted-foreground">Answers include sources</span> : null}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={searchMode ? "Ask a current-events question" : "Message Nexora AI"}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={isSending}
              />
              <Button size="icon" aria-label="Send message" disabled={isSending || !message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
