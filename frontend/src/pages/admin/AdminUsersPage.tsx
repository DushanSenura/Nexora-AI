import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent } from "../../components/ui/card";

export function AdminUsersPage() {
  return <section><PageHeader title="Users" description="Manage accounts, roles, and access." /><Card><CardContent className="p-4 text-sm">User management table.</CardContent></Card></section>;
}

