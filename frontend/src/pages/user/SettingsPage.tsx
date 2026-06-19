import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../features/auth/AuthProvider";
import { useTheme } from "../../features/theme/ThemeProvider";
import {
  deleteAccount,
  getPreferences,
  savePreferences,
  updatePassword,
  updateProfile,
  uploadAvatar,
  type AppPreferences,
} from "../../features/settings/settingsApi";

export function SettingsPage() {
  const { user, logout, setCurrentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [preferences, setPreferences] = useState<AppPreferences>(() => getPreferences());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (nextUser) => {
      setCurrentUser(nextUser);
      setNotice("Profile updated.");
      setError("");
    },
    onError: () => setError("Unable to update profile."),
  });

  const passwordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setNotice("Password updated.");
      setError("");
    },
    onError: () => setError("Unable to update password. Check your current password."),
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (nextUser) => {
      setCurrentUser(nextUser);
      setNotice("Profile image updated.");
      setError("");
    },
    onError: () => setError("Unable to upload profile image."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: logout,
    onError: () => setError("Unable to delete account."),
  });

  function updatePreference<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) {
    const nextPreferences = { ...preferences, [key]: value };
    setPreferences(nextPreferences);
    savePreferences(nextPreferences);
    setNotice("Settings saved.");
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await profileMutation.mutateAsync({ name });
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await passwordMutation.mutateAsync({ currentPassword, newPassword });
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    await avatarMutation.mutateAsync(file);
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm("Delete your account permanently?");
    if (!confirmed) {
      return;
    }
    await deleteMutation.mutateAsync();
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage account, model, and workspace preferences." />
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>User profile</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-semibold">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user?.name?.slice(0, 1)}
              </div>
              <div>
                <input ref={avatarInputRef} type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} />
                <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={avatarMutation.isPending}>
                  <Camera className="h-4 w-4" />
                  Upload image
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, or WEBP up to 2 MB.</p>
              </div>
            </div>

            <form className="space-y-3" onSubmit={handleProfileSubmit}>
              <Input placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} required />
              <Input placeholder="Email" value={user?.email ?? ""} disabled />
              <Button type="submit" disabled={profileMutation.isPending || !name.trim()}>Update name</Button>
            </form>

            <form className="space-y-3" onSubmit={handlePasswordSubmit}>
              <Input type="password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
              <Input type="password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required />
              <Button type="submit" variant="outline" disabled={passwordMutation.isPending}>Update password</Button>
            </form>

            <Button type="button" variant="destructive" onClick={handleDeleteAccount} disabled={deleteMutation.isPending}>
              <Trash2 className="h-4 w-4" />
              Delete account
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>App settings</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Theme</div>
                <div className="text-sm text-muted-foreground">Current theme: {theme}</div>
              </div>
              <Button type="button" variant="outline" onClick={toggleTheme}>Change theme</Button>
            </div>

            <label className="block space-y-2 text-sm">
              <span className="font-medium">Default AI model</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={preferences.defaultModel}
                onChange={(event) => updatePreference("defaultModel", event.target.value)}
              >
                <option value="llama3.2">llama3.2</option>
                <option value="llama3.1">llama3.1</option>
                <option value="mistral">mistral</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium">Response style</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={preferences.responseStyle}
                onChange={(event) => updatePreference("responseStyle", event.target.value as AppPreferences["responseStyle"])}
              >
                <option value="balanced">Balanced</option>
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
              </select>
            </label>

            <div className="space-y-3">
              <div className="text-sm font-medium">Data and privacy</div>
              {[
                ["saveChatHistory", "Save chat history"],
                ["allowSearchHistory", "Save web search history"],
                ["allowDocumentRetention", "Keep uploaded documents for retrieval"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(preferences[key as keyof AppPreferences])}
                    onChange={(event) => updatePreference(key as keyof AppPreferences, event.target.checked as never)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {notice ? <p className="mt-4 text-sm text-primary">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </>
  );
}

