import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent } from "../../components/ui/card";

export function AdminChatsPage() {
  return <section><PageHeader title="Chats" description="Review chat volume and moderation signals." /><Card><CardContent className="p-4 text-sm">Chat audit table.</CardContent></Card></section>;
}

