"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void authClient.login(email, password, otp || undefined)
      .then(() => router.replace(new URLSearchParams(window.location.search).get("next") || "/admin"))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Đăng nhập không thành công"));
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-[#f4f4f4] px-4 pt-20 font-[Segoe_UI,Arial,sans-serif]">
      <section className="w-full max-w-[550px]">
        <div className="mb-6 flex justify-center"><img src="/login-assets/skola.png" alt="Skola" className="h-auto w-[155px]" /></div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {['Microsoft', 'Google'].map((provider) => (
            <button key={provider} type="button" className="flex h-[54px] flex-1 items-center justify-between rounded-[10px] border border-[#d9e0e8] bg-white px-4 text-left text-[#202a3b] shadow-sm transition hover:shadow-md">
              <span className="flex items-center gap-3 text-[17px] font-semibold">
                <img src={provider === 'Microsoft' ? '/login-assets/microsoft.png' : '/login-assets/google.png'} alt="" className="h-[30px] w-[30px] object-contain" />{provider}
              </span><span className="text-3xl leading-none text-[#9aa8bb]">›</span>
            </button>
          ))}
        </div>
        <div className="my-[18px] flex items-center gap-4 whitespace-nowrap text-base text-[#65758b] before:h-px before:flex-1 before:bg-[#cfd8e3] after:h-px after:flex-1 after:bg-[#cfd8e3]">Or email and password</div>
        <form className="bg-white px-[22px] pb-[18px] pt-[22px]" onSubmit={handleSubmit}>
          <div className="mb-4"><label className="mb-1.5 block text-xs text-[#333]" htmlFor="email">Email Address</label><input id="email" type="text" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-[38px] w-full border border-[#d5d5d5] bg-white px-2 text-[13px] outline-none focus:border-[#16a0c8]" /></div>
          <div className="mb-4"><label className="mb-1.5 block text-xs text-[#333]" htmlFor="password">Password</label><div className="relative"><input id="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-[38px] w-full border border-[#d5d5d5] bg-white px-2 pr-10 text-[13px] outline-none focus:border-[#16a0c8]" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-0 top-0 flex h-[38px] w-10 items-center justify-center text-[#7A8795] hover:text-black" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
          <div className="flex items-center justify-between"><label className="flex items-center gap-1.5 text-[11px] text-[#333]"><input type="checkbox" className="h-[13px] w-[13px]" />Remember Me</label><button type="submit" className="h-[42px] min-w-[112px] bg-[#16a0c8] px-5 text-sm font-bold text-white hover:bg-[#128cad]">Login</button></div>
          {message && <p className="mt-3 bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
        </form>
        <div className="flex items-center justify-between px-1 pt-3 text-[11px] text-[#555]"><span>New here? <a className="text-[#16a0c8] underline-offset-2 hover:underline" href="#">Create an account</a></span><a className="underline-offset-2 hover:text-[#16a0c8] hover:underline" href="#">Forgot password?</a></div>
      </section>
    </main>
  );
}
