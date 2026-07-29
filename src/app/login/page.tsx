"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Background } from "@/components/background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type Mode = "password" | "magic" | "otp";

const Login = () => {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<{ error?: { message?: string } | null }>) {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fn();
      if (res?.error) setError(res.error.message ?? "Something went wrong.");
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return { error: { message: "failed" } };
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "password") {
      const res = await run(() =>
        authClient.signIn.email({ email, password }),
      );
      if (!res.error) router.push("/inbox");
      return;
    }

    if (mode === "magic") {
      const res = await run(() =>
        authClient.signIn.magicLink({ email, callbackURL: "/inbox" }),
      );
      if (!res.error) setStatus(`Magic link sent to ${email}. Check your inbox.`);
      return;
    }

    if (!otpSent) {
      const res = await run(() =>
        authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" }),
      );
      if (!res.error) {
        setOtpSent(true);
        setStatus(`Code sent to ${email}.`);
      }
      return;
    }

    const res = await run(() => authClient.signIn.emailOtp({ email, otp }));
    if (!res.error) router.push("/inbox");
  }

  const tabs: { id: Mode; label: string }[] = [
    { id: "magic", label: "Magic link" },
    { id: "otp", label: "Email code" },
    { id: "password", label: "Password" },
  ];

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
                <p className="mb-2 text-2xl font-bold">Welcome back</p>
                <p className="text-muted-foreground text-center text-sm">
                  Every email below is sent through MailKite.
                </p>
              </CardHeader>
              <CardContent>
                <div className="bg-muted mb-4 grid grid-cols-3 gap-1 rounded-lg p-1">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setMode(t.id);
                        setOtpSent(false);
                        setStatus(null);
                        setError(null);
                      }}
                      className={`rounded-md px-2 py-1.5 text-xs font-medium transition ${
                        mode === t.id
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={onSubmit} className="grid gap-4">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  {mode === "password" && (
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  )}

                  {mode === "otp" && otpSent && (
                    <Input
                      inputMode="numeric"
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  )}

                  {error && (
                    <p className="text-destructive text-sm" role="alert">
                      {error}
                    </p>
                  )}
                  {status && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {status}
                    </p>
                  )}

                  <Button type="submit" className="mt-2 w-full" disabled={busy}>
                    {busy
                      ? "Working…"
                      : mode === "password"
                        ? "Sign in"
                        : mode === "magic"
                          ? "Email me a link"
                          : otpSent
                            ? "Verify code"
                            : "Email me a code"}
                  </Button>
                </form>

                <div className="text-muted-foreground mx-auto mt-8 flex justify-center gap-1 text-sm">
                  <p>Don&apos;t have an account?</p>
                  <Link href="/signup" className="text-primary font-medium">
                    Sign up
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Background>
  );
};

export default Login;
