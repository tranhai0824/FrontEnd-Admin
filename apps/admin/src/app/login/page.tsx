"use client";

import { FormEvent, useState } from "react";
import { GraduationCap, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void authClient.login(email, password, otp || undefined).then(() => router.replace(new URLSearchParams(window.location.search).get("next") || "/admin")).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Đăng nhập không thành công"));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-panel">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Đăng nhập quản trị</h1>
          <p className="mt-2 text-sm text-muted-foreground">Truy cập khu vực vận hành TopScholar</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm font-medium" htmlFor="email">
            Email quản trị
            <span className="relative block">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30" placeholder="admin@example.com" />
            </span>
          </label>

          <label className="block space-y-2 text-sm font-medium" htmlFor="password">
            Mật khẩu
            <span className="relative block">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30" placeholder="Nhập mật khẩu" />
            </span>
          </label>

          <label className="block space-y-2 text-sm font-medium" htmlFor="otp">
            Mã 2FA (nếu đã bật)
            <input id="otp" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30" placeholder="6 chữ số" />
          </label>

          <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            Đăng nhập
          </button>
          {message && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
        </form>
      </section>
    </main>
  );
}
