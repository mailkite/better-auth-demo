"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Background } from "@/components/background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await authClient.signUp.email({ name, email, password });
      if (res.error) setError(res.error.message ?? "Could not create the account.");
      else setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Background>
      <section className="py-28 lg:pt-44 lg:pb-32">
        <div className="container">
          <div className="flex flex-col gap-4">
            <Card className="mx-auto w-full max-w-sm">
              <CardHeader className="flex flex-col items-center space-y-0">
                <Image
                  src="/logo.svg"
                  alt="logo"
                  width={94}
                  height={18}
                  className="mb-7 dark:invert"
                />
                <p className="mb-2 text-2xl font-bold">Create your account</p>
                <p className="text-muted-foreground text-center text-sm">
                  We&apos;ll send a verification email through MailKite.
                </p>
              </CardHeader>
              <CardContent>
                {done ? (
                  <div className="grid gap-3 text-center">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      Account created. A verification email is on its way to{" "}
                      <strong>{email}</strong>.
                    </p>
                    <p className="text-muted-foreground text-sm">
                      That message was rendered and delivered by{" "}
                      <code>@mailkite/better-auth</code> — no callback written by
                      hand, the plugin supplied it.
                    </p>
                    <Link href="/login" className="text-primary text-sm font-medium">
                      Back to sign in
                    </Link>
                  </div>
                ) : (
                  <>
                    <form onSubmit={onSubmit} className="grid gap-4">
                      <Input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <div>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={8}
                          required
                        />
                        <p className="text-muted-foreground mt-1 text-sm">
                          Must be at least 8 characters.
                        </p>
                      </div>
                      {error && (
                        <p className="text-destructive text-sm" role="alert">
                          {error}
                        </p>
                      )}
                      <Button type="submit" className="mt-2 w-full" disabled={busy}>
                        {busy ? "Creating…" : "Create an account"}
                      </Button>
                    </form>
                    <div className="text-muted-foreground mx-auto mt-8 flex justify-center gap-1 text-sm">
                      <p>Already have an account?</p>
                      <Link href="/login" className="text-primary font-medium">
                        Log in
                      </Link>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Background>
  );
};

export default Signup;
