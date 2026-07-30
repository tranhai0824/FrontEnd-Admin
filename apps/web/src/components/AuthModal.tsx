import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
  User,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { firebaseAuth } from '../firebase';

type AuthMode = 'login' | 'register';
type AuthStep = 'method' | 'form' | 'otp';

export interface AuthenticatedUser {
  name: string;
  email: string;
  avatar: string;
}

interface AuthModalProps {
  initialMode: AuthMode;
  onClose: () => void;
  onAuthenticated: (user: AuthenticatedUser, mode: AuthMode) => void;
}

const DEMO_OTP = '123456';
const OTP_LENGTH = 6;

const createDisplayName = (email: string, fullName: string) => {
  if (fullName.trim()) return fullName.trim();
  const username = email.split('@')[0] || 'Người dùng';
  return username.charAt(0).toUpperCase() + username.slice(1);
};

function getFirebasePhoneError(error: unknown) {
  const firebaseError = error as { code?: string; message?: string };
  const code = firebaseError.code ?? firebaseError.message ?? '';
  if (code.includes('operation-not-allowed')) return 'Firebase chưa bật đăng nhập bằng số điện thoại.';
  if (code.includes('too-many-requests')) return 'Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau.';
  if (code.includes('quota-exceeded')) return 'Firebase đã vượt hạn mức gửi SMS.';
  if (code.includes('invalid-phone-number')) return 'Số điện thoại không hợp lệ.';
  if (code.includes('unauthorized-domain')) return 'Tên miền hiện tại chưa được thêm vào Firebase Authorized domains.';
  console.error('Firebase Phone Auth error:', error);
  return 'Không thể gửi mã xác minh. Kiểm tra cấu hình Firebase và kết nối mạng.';
}

function getFirebaseOtpError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  if (code.includes('code-expired')) return 'Mã OTP đã hết hạn. Vui lòng gửi lại mã.';
  if (code.includes('invalid-verification-code')) return 'Mã OTP không đúng.';
  return 'Không thể xác minh mã OTP. Vui lòng thử lại.';
}

export default function AuthModal({
  initialMode,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'candidate' | 'partner'>('candidate');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneMode, setPhoneMode] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const resetRecaptcha = () => {
    try {
      recaptchaRef.current?.clear();
    } catch {
      // The verifier may already have been disposed by Firebase.
    }
    recaptchaRef.current = null;
    document.getElementById('recaptcha-container')?.replaceChildren();
  };

  useEffect(() => {
    return () => resetRecaptcha();
  }, []);

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, secondsLeft]);

  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (phoneMode) {
          setPhoneMode(false);
          setPhoneError('');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, phoneMode]);

  const resetFormState = (nextMode: AuthMode) => {
    setMode(nextMode);
    setStep('form');
    setError('');
    setPassword('');
    setConfirmPassword('');
    setOtp(Array(OTP_LENGTH).fill(''));
    setPhoneMode(false);
    setPhone('');
    setPhoneError('');
    setConfirmationResult(null);
  };

  const handlePhoneSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const digits = phone.replace(/\D/g, '');
    const normalizedPhone = digits.length === 9 ? `0${digits}` : digits;
    if (!/^0(3|5|7|8|9)\d{8}$/.test(normalizedPhone)) {
      setPhoneError('Vui lòng nhập số điện thoại Việt Nam hợp lệ.');
      return;
    }
    setPhoneError('');
    setIsSubmitting(true);
    if (firebaseAuth) {
      try {
        if (!recaptchaRef.current) {
          document.getElementById('recaptcha-container')?.replaceChildren();
          recaptchaRef.current = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', { size: 'invisible' });
        }
        const result = await signInWithPhoneNumber(firebaseAuth, `+84${normalizedPhone.slice(1)}`, recaptchaRef.current);
        setConfirmationResult(result);
        setPhone(normalizedPhone);
        setStep('otp');
        setSecondsLeft(60);
        window.setTimeout(() => otpRefs.current[0]?.focus(), 80);
      } catch (firebaseError) {
        setPhoneError(getFirebasePhoneError(firebaseError));
        resetRecaptcha();
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!import.meta.env.DEV) {
      setIsSubmitting(false);
      setPhoneError('Firebase chưa được cấu hình. Vui lòng liên hệ quản trị viên.');
      return;
    }

    window.setTimeout(() => {
      setIsSubmitting(false);
      setPhone(normalizedPhone);
      setStep('otp');
      setSecondsLeft(60);
      window.setTimeout(() => otpRefs.current[0]?.focus(), 80);
    }, 500);
  };

  const completeAuthentication = () => {
    const displayName = createDisplayName(email, fullName);
    onAuthenticated(
      {
        name: displayName,
        email,
        avatar:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
      },
      mode,
    );
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email không đúng định dạng.');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu cần có ít nhất 8 ký tự.');
      return;
    }

    if (mode === 'login') {
      setIsSubmitting(true);
      window.setTimeout(() => {
        setIsSubmitting(false);
        completeAuthentication();
      }, 500);
      return;
    }

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    if (!acceptedTerms) {
      setError('Bạn cần đồng ý với điều khoản sử dụng.');
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setStep('otp');
      setSecondsLeft(60);
      window.setTimeout(() => otpRefs.current[0]?.focus(), 80);
    }, 500);
  };

  const updateOtp = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 1) {
      const next = Array(OTP_LENGTH).fill('');
      digits.slice(0, OTP_LENGTH).split('').forEach((digit, digitIndex) => {
        next[digitIndex] = digit;
      });
      setOtp(next);
      setError('');
      otpRefs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
      return;
    }

    const digit = digits.slice(-1);
    setOtp((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    setError('');
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)
      .split('');
    if (!digits.length) return;
    const next = Array(OTP_LENGTH).fill('');
    digits.forEach((digit, index) => {
      next[index] = digit;
    });
    setOtp(next);
    otpRefs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
  };

  const handleOtpSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Vui lòng nhập đủ 6 chữ số.');
      return;
    }
    if (confirmationResult) {
      setIsSubmitting(true);
      try {
        await confirmationResult.confirm(code);
        completeAuthentication();
      } catch (firebaseError) {
        setError(getFirebaseOtpError(firebaseError));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (code !== DEMO_OTP) {
      setError('Mã OTP chưa chính xác. Mã dùng thử là 123456.');
      return;
    }
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      completeAuthentication();
    }, 500);
  };

  const resendOtp = () => {
    if (secondsLeft > 0) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setSecondsLeft(60);
    setError('');
    otpRefs.current[0]?.focus();
  };

  const passwordChecks = [
    { label: 'Ít nhất 8 ký tự', valid: password.length >= 8 },
    { label: 'Mật khẩu xác nhận khớp', valid: Boolean(password) && password === confirmPassword },
  ];

  return (
    <div
      className={`fixed inset-0 z-[70] flex p-4 ${
        step === 'method'
          ? 'items-center justify-center bg-[#F2F5F8]/95 backdrop-blur-[2px]'
          : mode === 'login'
            ? 'items-start justify-end bg-black/40'
            : 'items-center justify-center bg-slate-950/55 backdrop-blur-[2px]'
      }`}
      id="auth-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        initial={{ opacity: 0, scale: 0.97, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18 }}
        className={`${phoneMode ? 'hidden' : ''} relative max-h-[calc(100vh-32px)] w-full overflow-y-auto rounded-xl bg-white shadow-2xl pointer-events-auto ${
          mode === 'login' && step !== 'method'
            ? 'mt-12 max-w-[420px] border border-[#2C6EAF]'
            : 'max-w-[480px] border border-slate-200'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        id="auth-modal-content"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2C6EAF]/30"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" strokeWidth={1.8} />
        </button>

        <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
          {step === 'method' ? (
            <>
              <div className="mb-6 pr-10">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-[#2C6EAF] text-white shadow-sm">
                  <GraduationCap className="h-6 w-6" strokeWidth={1.8} />
                </div>
                <h2 id="auth-modal-title" className="text-xl font-bold text-[#181818]">
                  Đăng ký tài khoản
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-[#606061]">
                  Chọn phương thức phù hợp để bắt đầu cùng Top Scholar.
                </p>
              </div>

              <div className="divide-y divide-slate-200 border-y border-slate-200">
                <RegistrationMethod
                  label="Đăng ký bằng Gmail"
                  icon={<Mail className="h-5 w-5 text-[#EA4335]" strokeWidth={2} />}
                  onClick={() => setStep('form')}
                />
                <RegistrationMethod
                  label="Đăng ký bằng Facebook"
                  icon={<span className="text-xl font-bold leading-none text-[#1877F2]">f</span>}
                  onClick={() => setStep('form')}
                />
                <RegistrationMethod
                  label="Đăng ký bằng Google"
                  icon={<span className="text-lg font-bold leading-none text-[#4285F4]">G</span>}
                  onClick={() => setStep('form')}
                />
                <RegistrationMethod
                  label="Đăng ký bằng số điện thoại"
                  icon={<Smartphone className="h-5 w-5 text-[#475569]" strokeWidth={1.9} />}
                  onClick={() => setStep('form')}
                />
              </div>

              <button
                type="button"
                onClick={() => resetFormState('login')}
                className="mt-6 min-h-10 w-full text-sm font-semibold text-[#2C6EAF] hover:underline"
              >
                Đã có tài khoản? Đăng nhập
              </button>
            </>
          ) : step === 'otp' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setError('');
                }}
                className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm text-[#606061] transition-colors hover:text-[#2C6EAF]"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </button>

              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border border-[#DCEAF6] bg-[#F4F8FC] text-[#2C6EAF]">
                  <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
                </div>
                <h2 id="auth-modal-title" className="text-xl font-bold text-[#181818]">
                  Xác thực email
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#606061]">
                  Nhập mã gồm 6 chữ số đã gửi đến
                  <span className="block font-semibold text-[#181818]">{email}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit}>
                <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        otpRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      value={digit}
                      onChange={(event) => updateOtp(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      className="h-12 w-11 rounded-lg border border-slate-300 bg-white text-center text-lg font-semibold text-[#181818] outline-none transition-colors focus:border-[#2C6EAF] focus:ring-2 focus:ring-[#2C6EAF]/15 sm:h-13 sm:w-12"
                      aria-label={`Chữ số OTP ${index + 1}`}
                    />
                  ))}
                </div>

                <p className="mt-4 text-center text-xs text-[#7D7A75]">
                  Mã dùng thử: <span className="font-semibold text-[#2C6EAF]">123456</span>
                </p>

                {error && (
                  <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2C6EAF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1E5084] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  Xác nhận mã OTP
                </button>

                <div className="mt-5 text-center text-sm text-[#606061]">
                  Chưa nhận được mã?{' '}
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={secondsLeft > 0}
                    className="min-h-10 font-semibold text-[#2C6EAF] disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {secondsLeft > 0 ? `Gửi lại sau ${secondsLeft}s` : 'Gửi lại mã'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {mode === 'register' && (
                <div className="mb-6 pr-10">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[#2C6EAF] text-white shadow-sm">
                    <GraduationCap className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <h2 id="auth-modal-title" className="text-xl font-bold text-[#181818]">Tạo tài khoản Top Scholar</h2>
                  <p className="mt-1.5 text-sm leading-6 text-[#606061]">Đăng ký để lưu học bổng và theo dõi tiến độ ứng tuyển.</p>
                </div>
              )}

              {mode === 'login' && (
                <div className="mb-5 space-y-2">
                  <SocialAuthButton label="Tiếp tục với Google" tone="google" />
                  <SocialAuthButton label="Tiếp tục với Facebook" tone="facebook" />
                  <SocialAuthButton label="Tiếp tục với số điện thoại" tone="phone" onClick={() => setPhoneMode(true)} />
                  <div className="flex items-center gap-3 py-1 text-xs text-[#7D7A75]">
                    <span className="h-px flex-1 bg-slate-200" />
                    hoặc
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                </div>
              )}

              <div className="mb-5 grid grid-cols-2 rounded-lg bg-[#F4F8FC] p-1">
                {(['login', 'register'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => resetFormState(item)}
                    className={`min-h-10 rounded-md text-sm font-semibold transition-all ${
                      mode === item
                        ? 'bg-white text-[#2C6EAF] shadow-sm'
                        : 'text-[#606061] hover:text-[#181818]'
                    }`}
                  >
                    {item === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {mode === 'register' && (
                  <>
                    <AuthField
                      id="auth-full-name-input"
                      label="Họ và tên"
                      icon={<User className="h-4 w-4" />}
                    >
                      <input
                        id="auth-full-name-input"
                        type="text"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Nguyễn Văn An"
                        className="auth-input"
                        autoComplete="name"
                      />
                    </AuthField>

                    <div>
                      <span className="mb-2 block text-sm font-semibold text-[#2C2C2B]">
                        Bạn đăng ký với vai trò
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'candidate', label: 'Ứng viên', description: 'Tìm và ứng tuyển' },
                          { value: 'partner', label: 'Đối tác', description: 'Đăng học bổng' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setAccountType(option.value as 'candidate' | 'partner')}
                            className={`min-h-[62px] rounded-lg border px-3 text-left transition-colors ${
                              accountType === option.value
                                ? 'border-[#2C6EAF] bg-[#F4F8FC]'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <span className="block text-sm font-semibold text-[#181818]">
                              {option.label}
                            </span>
                            <span className="mt-0.5 block text-xs text-[#7D7A75]">
                              {option.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <AuthField
                  id="auth-email-input"
                  label="Email"
                  icon={<Mail className="h-4 w-4" />}
                >
                  <input
                    id="auth-email-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="email@example.com"
                    className="auth-input"
                    autoComplete="email"
                  />
                </AuthField>
                {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                  <p className="-mt-2 text-xs text-rose-600">Email không đúng định dạng.</p>
                )}

                <AuthField
                  id="auth-password-input"
                  label="Mật khẩu"
                  icon={<LockKeyhole className="h-4 w-4" />}
                >
                  <div className="relative">
                    <input
                      id="auth-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="auth-input pr-11"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-[#2C6EAF]"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </AuthField>
                {password && password.length < 8 && (
                  <p className="-mt-2 text-xs text-rose-600">Mật khẩu cần có ít nhất 8 ký tự.</p>
                )}

                {mode === 'register' && (
                  <>
                    <AuthField
                      id="auth-confirm-password-input"
                      label="Xác nhận mật khẩu"
                      icon={<LockKeyhole className="h-4 w-4" />}
                    >
                      <input
                        id="auth-confirm-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        className="auth-input"
                        autoComplete="new-password"
                      />
                    </AuthField>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="-mt-2 text-xs text-rose-600">Mật khẩu xác nhận chưa khớp.</p>
                    )}

                    <div className="grid gap-1.5">
                      {passwordChecks.map((check) => (
                        <div
                          key={check.label}
                          className={`flex items-center gap-2 text-xs ${
                            check.valid ? 'text-emerald-700' : 'text-[#7D7A75]'
                          }`}
                        >
                          <span
                            className={`grid h-4 w-4 place-items-center rounded-full ${
                              check.valid ? 'bg-emerald-100' : 'bg-slate-100'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          {check.label}
                        </div>
                      ))}
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-[#606061]">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(event) => setAcceptedTerms(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#2C6EAF]"
                      />
                      <span>
                        Tôi đồng ý với{' '}
                        <button type="button" className="font-semibold text-[#2C6EAF] hover:underline">
                          Điều khoản sử dụng
                        </button>{' '}
                        và Chính sách bảo mật.
                      </span>
                    </label>
                  </>
                )}

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="min-h-9 text-xs font-semibold text-[#2C6EAF] hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                {error && (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2C6EAF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1E5084] disabled:cursor-not-allowed disabled:opacity-60"
                  id="auth-btn-submit"
                >
                  {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              </form>

              {mode === 'login' ? (
                <p className="mt-5 border-t border-slate-200 pt-4 text-center text-sm text-[#606061]">
                  Bạn là đối tác?{' '}
                  <a
                    href="#lien-he"
                    onClick={() => console.log('Liên hệ')}
                    className="font-bold text-[#2C6EAF] transition-colors hover:text-[#1E5084] hover:underline"
                  >
                    Liên hệ
                  </a>
                </p>
              ) : (
                <p className="mt-5 text-center text-xs leading-5 text-[#7D7A75]">
                  Thông tin của bạn được bảo vệ và không chia sẻ cho bên thứ ba.
                </p>
              )}
            </>
          )}
        </div>
      </motion.section>

      {phoneMode && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPhoneMode(false);
              setPhoneError('');
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-[400px] rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="phone-modal-title"
          >
            {step === 'otp' ? (
              <PhoneOtpStep otp={otp} error={error} secondsLeft={secondsLeft} onChange={updateOtp} onKeyDown={handleOtpKeyDown} onPaste={handleOtpPaste} onSubmit={handleOtpSubmit} onResend={resendOtp} onBack={() => { setStep('form'); setPhoneError(''); }} refs={otpRefs} />
            ) : (
              <>
                <button type="button" onClick={() => { setPhoneMode(false); setPhoneError(''); }} className="absolute right-4 top-4 text-2xl text-slate-400 hover:text-slate-700" aria-label="Đóng">×</button>
                <h2 id="phone-modal-title" className="text-lg font-semibold text-[#181818]">Đăng nhập bằng số điện thoại</h2>
                <p className="mt-2 text-sm leading-5 text-[#606061]">Chúng tôi sẽ gửi mã xác minh đến số điện thoại của bạn.</p>
                <form onSubmit={(event) => { event.preventDefault(); handlePhoneSubmit(event); }} className="mt-5 space-y-3">
                  <label htmlFor="auth-phone-input" className="block text-sm font-semibold text-[#2C2C2B]">Số điện thoại</label>
                  <div className="flex gap-2">
                    <span className="flex min-h-11 items-center rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-600">+84</span>
                    <input id="auth-phone-input" type="tel" inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))} placeholder="Nhập số điện thoại" className="auth-input" style={{ textAlign: 'left', paddingLeft: '12px' }} autoComplete="tel" autoFocus />
                  </div>
                  {phoneError && <p className="text-xs text-rose-600">{phoneError}</p>}
                  <button type="submit" disabled={isSubmitting} className="min-h-11 w-full rounded-lg bg-[#2C6EAF] px-4 text-sm font-semibold text-white hover:bg-[#1E5084] disabled:opacity-60">{isSubmitting ? 'Đang xử lý...' : 'Tiếp tục'}</button>
                  <button type="button" onClick={() => { setPhoneMode(false); setPhoneError(''); }} className="min-h-10 w-full text-sm font-semibold text-[#2C6EAF] hover:underline">Quay lại</button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
      <div id="recaptcha-container" className="absolute h-0 w-0 overflow-hidden" aria-hidden="true" />
    </div>
  );
}

interface AuthFieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function PhoneOtpStep({ otp, error, secondsLeft, onChange, onKeyDown, onPaste, onSubmit, onResend, onBack, refs }: any) {
  return (
    <>
      <button type="button" onClick={onBack} className="mb-4 text-sm font-semibold text-[#2C6EAF] hover:underline">Quay lại</button>
      <h2 className="text-lg font-semibold text-[#181818]">Nhập mã xác minh</h2>
      <p className="mt-2 text-sm text-[#606061]">Mã đã gửi đến số điện thoại của bạn.</p>
      <form onSubmit={onSubmit} className="mt-5" onPaste={onPaste}>
        <div className="flex justify-center gap-2">
          {otp.map((digit: string, index: number) => (
            <input key={index} ref={(element) => { refs.current[index] = element; }} value={digit} onChange={(event) => onChange(index, event.target.value)} onKeyDown={(event) => onKeyDown(index, event)} inputMode="numeric" maxLength={1} className="h-12 w-10 rounded-lg border border-slate-300 text-center text-lg font-semibold focus:border-[#2C6EAF] focus:ring-2 focus:ring-[#2C6EAF]/20" aria-label={`Mã OTP ${index + 1}`} />
          ))}
        </div>
        {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
        <button type="submit" className="mt-5 min-h-11 w-full rounded-lg bg-[#2C6EAF] text-sm font-semibold text-white hover:bg-[#1E5084]">Xác nhận</button>
        <button type="button" disabled={secondsLeft > 0} onClick={onResend} className="mt-3 min-h-10 w-full text-sm font-semibold text-[#2C6EAF] disabled:text-slate-400">{secondsLeft > 0 ? `Gửi lại mã sau ${secondsLeft}s` : 'Gửi lại mã'}</button>
      </form>
    </>
  );
}

function AuthField({ id, label, icon, children }: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[#2C2C2B]">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-slate-400">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

interface RegistrationMethodProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function RegistrationMethod({ label, icon, onClick }: RegistrationMethodProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-4 px-4 text-left transition-colors hover:bg-[#F4F8FC]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#F8FAFC]">
        {icon}
      </span>
      <span className="flex-1 text-[15px] font-semibold text-[#2C2C2B]">{label}</span>
      <ChevronRight className="h-4 w-4 text-[#94A3B8]" strokeWidth={2} />
    </button>
  );
}

interface SocialAuthButtonProps {
  label: string;
  tone: 'google' | 'facebook' | 'phone';
  onClick?: () => void;
}

function SocialAuthButton({ label, tone, onClick }: SocialAuthButtonProps) {
  const toneClass = {
    google: 'border border-slate-300 !bg-white !text-[#181818] hover:!bg-slate-50',
    facebook: 'bg-[#4567B2] hover:bg-[#36569B]',
    phone: 'bg-[#16A34A] hover:bg-[#15803D]',
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 w-full items-center justify-center gap-3 rounded-md px-4 text-sm font-semibold text-white transition-colors ${toneClass}`}
    >
      <span className="grid h-6 w-6 place-items-center rounded-sm bg-white/15 text-base font-bold">
        {tone === 'google' ? 'G' : tone === 'facebook' ? 'f' : <Phone className="h-4 w-4" strokeWidth={2.2} />}
      </span>
      {label}
    </button>
  );
}
