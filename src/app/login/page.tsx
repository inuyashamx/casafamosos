"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/dashboard",
    });
    if (res?.error) setError("Credenciales inválidas o no implementadas");
    else if (res?.ok) router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm bg-card p-8 rounded-lg shadow-md border border-border">
        <h1 className="text-2xl font-bold mb-6 text-center text-foreground">Iniciar sesión</h1>
        <button
          className="w-full bg-primary text-primary-foreground py-2 rounded mb-4 hover:bg-primary/90 transition-colors"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
          Iniciar sesión con Google
        </button>
        <div className="text-center text-muted-foreground mb-4 text-sm">o usa tu correo</div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded hover:bg-primary/90 transition-colors"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </main>
  );
} 