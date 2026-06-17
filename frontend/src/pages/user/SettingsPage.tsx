import { PageHeader } from "../../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage account, model, and workspace preferences." />
      <Card className="max-w-xl">
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Name" defaultValue="Nexora User" />
          <Input placeholder="Email" defaultValue="user@nexora.local" />
        </CardContent>
      </Card>
    </>
  );
}

