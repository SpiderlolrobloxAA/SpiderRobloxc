import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { DEFAULT_AVATAR_IMG } from "@/lib/images";
import { useToast } from "@/hooks/use-toast";
import { uploadFileToCatbox } from "@/lib/catbox";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR_IMG);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploading(true);
      const url = await uploadFileToCatbox(f);
      setAvatarUrl(url);
      toast({ title: "Avatar importé" });
    } catch (err) {
      console.error("avatar upload failed", err);
      toast({ title: "Upload avatar indisponible", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { displayName, avatarUrl },
        { merge: true },
      );
      try {
        const { updateProfile } = await import("firebase/auth");
        const mod = await import("@/lib/firebase");
        if (mod.auth && mod.auth.currentUser)
          await updateProfile(mod.auth.currentUser, {
            displayName,
            photoURL: avatarUrl,
          });
      } catch {}
      toast({ title: "Profil enregistré" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-xl py-10">
      <h1 className="font-display text-2xl font-bold">Profil</h1>
      <div className="mt-6 grid gap-3">
        <label className="text-sm">Pseudo</label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Votre pseudo"
        />
        <label className="text-sm mt-3">Avatar</label>
        <div className="flex items-center gap-2">
          <img
            src={avatarUrl}
            alt="avatar"
            className="h-10 w-10 rounded-full object-cover border"
          />
          <input
            id="avatar-file"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pickAvatar}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("avatar-file")?.click()}
            disabled={uploading}
          >
            {uploading ? "Import…" : "Choisir un avatar"}
          </Button>
        </div>
        <Input
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
        />
        <div className="mt-4">
          <Button onClick={save} disabled={saving}>
            {saving ? "Sauvegarde…" : "Sauvegarder"}
          </Button>
        </div>
      </div>
    </div>
  );
}
