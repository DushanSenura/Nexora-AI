import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { deleteAdminUser, listAdminUsers, setUserDisabled } from "../../features/admin/adminApi";

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const usersQuery = useQuery({
    queryKey: ["adminUsers", search],
    queryFn: () => listAdminUsers(search),
  });
  const disableMutation = useMutation({
    mutationFn: setUserDisabled,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
  });

  return (
    <section>
      <PageHeader title="Users" description="Search users, disable accounts, and remove accounts." />
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-3 font-medium">Name</th>
                  <th className="py-3 font-medium">Email</th>
                  <th className="py-3 font-medium">Role</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(usersQuery.data ?? []).map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3">{user.name}</td>
                    <td className="py-3 text-muted-foreground">{user.email}</td>
                    <td className="py-3">{user.role}</td>
                    <td className="py-3">{user.disabled_at ? "Disabled" : "Active"}</td>
                    <td className="flex justify-end gap-2 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disableMutation.mutate({ userId: user.id, disabled: !user.disabled_at })}
                      >
                        {user.disabled_at ? "Enable" : "Disable"}
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete user" onClick={() => deleteMutation.mutate(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {usersQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading users...</p> : null}
          {!usersQuery.isLoading && !usersQuery.data?.length ? <p className="text-sm text-muted-foreground">No users found.</p> : null}
        </CardContent>
      </Card>
    </section>
  );
}
