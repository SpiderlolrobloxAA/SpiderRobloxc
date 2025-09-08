import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
});

export default function Login() {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const { toast } = useToast();

  async function onSubmit(values: z.infer<typeof schema>) {
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    const mod = await import("@/lib/firebase");
    const auth = mod.auth;
    if (!auth) {
      toast({ title: "Auth indisponible", description: "Réessayez dans le navigateur (client)." });
      return;
    }
    await signInWithEmailAndPassword(auth, values.email, values.password);
    toast({ title: `Connexion réussie`, description: values.email });
  }

  return (
    <div className="container max-w-md py-12">
      <h1 className="font-display text-2xl font-bold">Se connecter</h1>
      <p className="text-sm text-foreground/70">Entrez vos identifiants pour accéder à Brainrot Market 🇫🇷.</p>
      <div className="mt-6 rounded-xl border border-border/60 bg-card p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="vous@exemple.com" {...field} /></FormControl>
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
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary">Connexion</Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
