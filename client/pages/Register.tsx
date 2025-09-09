import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Email invalide"),
  username: z.string().min(3, "Minimum 3 caractères"),
  password: z.string().min(6, "Minimum 6 caractères"),
});

export default function Register() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", username: "", password: "" },
  });
  const { toast } = useToast();

  async function onSubmit(values: z.infer<typeof schema>) {
    const { createUserWithEmailAndPassword, updateProfile } = await import(
      "firebase/auth"
    );
    const mod = await import("@/lib/firebase");
    const auth = mod.auth;
    if (!auth) {
      toast({
        title: "Auth indisponible",
        description: "Réessayez dans le navigateur (client).",
      });
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, values.email, values.password);
      try {
        if (auth.currentUser)
          await updateProfile(auth.currentUser, { displayName: values.username });
      } catch (e) {
        console.warn('updateProfile failed', e);
      }

      try {
        const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await setDoc(
          doc(db, "users", cred.user.uid),
          {
            email: values.email,
            username: values.username,
            role: "user",
            balances: { available: 0, pending: 0 },
            quests: { completed: [], progress: {} },
            stats: { sales: 0, purchases: 0, joinedAt: serverTimestamp() },
            lastSeen: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (e) {
        console.error('register:setUser failed', e);
        toast({ title: 'Erreur enregistreur', description: 'Impossible de créer le profil. Réessayez.', variant: 'destructive' });
        return;
      }

      toast({ title: `Bienvenue ${values.username} 🎉` });
    } catch (err: any) {
      console.error('createUser failed', err);
      const code = err?.code || err?.message || '';
      if (code.includes('network') || code.includes('auth/network-request-failed')) {
        toast({ title: 'Erreur réseau', description: 'Vérifiez votre connexion internet et réessayez.', variant: 'destructive' });
      } else if (code.includes('auth/email-already-in-use')) {
        toast({ title: 'Email déjà utilisé', description: 'Utilisez un autre email ou connectez-vous.', variant: 'destructive' });
      } else {
        toast({ title: 'Erreur', description: 'Impossible de créer le compte. Réessayez plus tard.', variant: 'destructive' });
      }
    }
  }

  return (
    <div className="container max-w-md py-12">
      <h1 className="font-display text-2xl font-bold">Créer un compte</h1>
      <p className="text-sm text-foreground/70">
        Rejoignez Brainrot Market 🇫🇷 en quelques secondes.
      </p>
      <div className="mt-6 rounded-xl border border-border/60 bg-card p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="vous@exemple.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pseudo</FormLabel>
                  <FormControl>
                    <Input placeholder="Votre pseudo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              Créer mon compte
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
