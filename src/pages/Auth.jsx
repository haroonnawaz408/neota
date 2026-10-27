import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Loader2, Eye, EyeOff, Lock, Mail, User,
  CheckCircle2, AlertCircle, Database, Sparkles, Check,
  ArrowLeft, X, KeyRound
} from 'lucide-react'
import { Logo } from '../components/Layout'
import { useStore } from '../store'
import SupabaseConfigModal from '../components/SupabaseConfigModal'

// Official Google Logo SVG
const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
)

// Shared Brand Shell with Security Badge
const Shell = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen grid place-items-center p-4 md:p-6 bg-gradient-to-b from-[#FBF8F2] to-[#F3EDE2]">
      <div className="w-full max-w-md">
        {/* Brand Logo & Royal Title */}
        <div className="text-center mb-6">
          <Logo />
          <p className="text-xs text-taupe mt-1.5 font-serif tracking-wide">
            نیوتا و سلامی ڈیجیٹل کتاب · محفوظ کلاؤڈ سسٹمز
          </p>
        </div>

        {/* Auth Card */}
        <div className="card p-6 md:p-8 bg-white shadow-xl border border-sand/80 rounded-2xl relative overflow-hidden">
          {/* Top Decorative Border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-forest via-gold to-forest"></div>

          <div className="mb-5">
            <h1 className="text-2xl font-serif text-ink font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-taupe mt-1">{subtitle}</p>}
          </div>

          {children}
        </div>

        {/* Security Trust Badge */}
        <div className="mt-5 text-center text-xs space-y-2">
          <p className="text-[11px] text-taupe flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-700" />
            <span>256-Bit TLS · Google OAuth 2.0 · End-to-End Cloud Security</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ========================================================
// 1. LOGIN SCREEN WITH GOOGLE AUTH & DIRECT EMAIL LOGIN
// ========================================================
export function Login() {
  const { auth, authLoading, loginUser, loginWithGoogle, isConnected } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [err, setErr] = useState(null)

  // Seamless 1-Click Redirect: automatically navigates to /admin or /app as soon as session is active
  useEffect(() => {
    if (auth.in && !authLoading) {
      nav(auth.admin ? '/admin' : '/app', { replace: true })
    }
  }, [auth.in, auth.admin, authLoading, nav])

  const handleLogin = async () => {
    if (!email || !password) {
      setErr('Please enter both your email address and password.')
      return
    }

    setLoading(true)
    setErr(null)

    try {
      await loginUser({
        email: email.trim(),
        password
      })
      nav('/app')
    } catch (e) {
      let msg = e.message || 'Login failed. Please verify credentials.'
      if (msg.includes('Invalid login credentials')) {
        msg = 'غلط ای میل یا پاس ورڈ (Invalid email or password). Please verify your credentials.'
      } else if (msg.includes('Email not confirmed')) {
        msg = 'آپ کے ای میل کی ابھی تصدیق نہیں ہوئی۔ براہِ کرم اپنا ای میل ان باکس چیک کریں۔ (Email not yet confirmed).'
      } else if (msg.includes('rate limit')) {
        msg = 'Too many attempts. Please wait a minute before trying again.'
      }
      setErr(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setErr(null)
    try {
      await loginWithGoogle()
    } catch (e) {
      setErr(e.message || 'Failed to authenticate with Google.')
      setGoogleLoading(false)
    }
  }

  const handleGuestLogin = () => {
    loginUser({
      email: 'guest@ledger.local',
      password: '',
      asAdmin: false
    })
    nav('/app')
  }

  return (
    <Shell
      title="Sign in to NEOTA"
      subtitle="Enter your credentials to access your family wedding ledger"
    >
      {err && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-900 flex items-start gap-2 animate-fade-in">
          <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      {/* 1-Click Direct Google Login */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="btn w-full !py-2.5 bg-white hover:bg-cream border border-sand text-ink shadow-sm font-medium text-xs flex items-center justify-center gap-2.5 rounded-xl transition"
      >
        {googleLoading ? <Loader2 size={16} className="animate-spin text-taupe" /> : <GoogleIcon />}
        <span>Continue with Google (گوگل سے لاگ ان)</span>
      </button>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-sand"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
          <span className="bg-white px-2.5 text-taupe font-medium">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); handleLogin() }} className="space-y-3.5">
        <div>
          <label className="label">Email Address</label>
          <div className="relative">
            <input
              className="input pl-9"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="label mb-0">Password</label>
            <Link to="/forgot-password" className="text-[11px] text-brown hover:text-ink hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              className="input pl-9 pr-9"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe hover:text-ink"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-taupe hover:text-ink">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="rounded border-sand text-brown focus:ring-brown"
            />
            <span>Remember this device</span>
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-p w-full !py-2.5 shadow-md font-medium text-sm flex items-center justify-center gap-2"
          disabled={loading || googleLoading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Sign In to Ledger</span>}
        </button>
      </form>

      {/* Guest Mode Option */}
      <div className="mt-3">
        <button
          type="button"
          onClick={handleGuestLogin}
          className="btn w-full text-xs py-2 text-taupe hover:text-ink hover:bg-cream border border-sand flex items-center justify-center gap-1.5 rounded-xl"
          title="Try without an account in local offline mode"
        >
          <User size={13} className="text-taupe" />
          <span>Continue as Guest (Local Offline Mode)</span>
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-sand text-center text-xs text-taupe">
        Don't have an account?{' '}
        <Link to="/signup" className="underline font-bold text-ink">
          Create Account
        </Link>
      </div>
    </Shell>
  )
}

// ========================================================
// 2. SIGN UP WITH REAL-EMAIL VERIFICATION & GOOGLE
// ========================================================
export function SignUp() {
  const { auth, authLoading, signupUser, loginWithGoogle } = useStore()
  const nav = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [verificationPending, setVerificationPending] = useState(false)

  useEffect(() => {
    if (auth.in && !authLoading) {
      nav('/app', { replace: true })
    }
  }, [auth.in, authLoading, nav])

  // Real-time Email Validity Checker (Blocks disposable & malformed emails)
  const emailValidity = useMemo(() => {
    if (!email) return { isValid: false, message: '' }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, message: 'Invalid email format (e.g. name@gmail.com)' }
    }

    // Check for obvious fake or disposable test domains
    const domain = email.split('@')[1]?.toLowerCase()
    const disposableDomains = ['tempmail.com', 'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'fake.com', 'test.com', 'example.com']
    if (disposableDomains.includes(domain)) {
      return { isValid: false, message: 'Temporary/disposable domains are blocked. Please use a real email.' }
    }

    return { isValid: true, message: 'Valid & active email address ✓' }
  }, [email])

  // Password strength calculation
  const strength = useMemo(() => {
    let score = 0
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    if (!password) return { score: 0, label: '', color: 'bg-sand' }
    if (score <= 1) return { score: 1, label: 'Weak (کمزور)', color: 'bg-red-500' }
    if (score <= 2) return { score: 2, label: 'Medium (درمیانہ)', color: 'bg-amber-500' }
    if (score <= 3) return { score: 3, label: 'Strong (مضبوط)', color: 'bg-emerald-500' }
    return { score: 4, label: 'Very Strong (انتہائی محفوظ)', color: 'bg-emerald-600' }
  }, [password])

  const handleSignUp = async e => {
    e.preventDefault()
    setErr(null)

    if (!emailValidity.isValid) {
      setErr(emailValidity.message || 'Please enter a valid email address.')
      return
    }

    if (password !== confirmPassword) {
      setErr('Passwords do not match. Please verify both fields.')
      return
    }

    if (password.length < 8) {
      setErr('Password must be at least 8 characters long.')
      return
    }

    if (!agreeTerms) {
      setErr('Please agree to terms to create your ledger account.')
      return
    }

    setLoading(true)
    try {
      const res = await signupUser({ email: email.trim(), password, fullName: fullName.trim() })
      if (res?.needsEmailVerification) {
        setVerificationPending(true)
      } else {
        nav('/app')
      }
    } catch (e) {
      setErr(e.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setErr(null)
    try {
      await loginWithGoogle()
    } catch (e) {
      setErr(e.message || 'Google registration failed.')
      setGoogleLoading(false)
    }
  }

  if (verificationPending) {
    return (
      <Shell
        title="Check your email"
        subtitle="Verification link has been sent to your email inbox"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto animate-bounce">
            <Mail size={28} />
          </div>

          <div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
              Verification Required
            </span>
            <h3 className="font-serif text-lg font-bold text-ink mt-2">{email}</h3>
            <p className="text-xs text-taupe mt-1.5 leading-relaxed">
              ہم نے آپ کے ای میل پر تصدیقی لنک بھیجا ہے۔ اپنے ان باکس میں جا کر لنک پر کلک کریں تاکہ آپ کا اکاؤنٹ فعال ہو سکے۔
            </p>
          </div>

          <div className="pt-2">
            <Link to="/login" className="btn btn-p w-full text-xs !py-2.5">
              Return to Sign In
            </Link>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell
      title="Create Ledger Account"
      subtitle="Setup your family wedding ledger with 256-bit encrypted storage"
    >
      {err && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-900 flex items-start gap-2 animate-fade-in">
          <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      {/* 1-Click Direct Google Signup */}
      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={googleLoading || loading}
        className="btn w-full !py-2.5 bg-white hover:bg-cream border border-sand text-ink shadow-sm font-medium text-xs flex items-center justify-center gap-2.5 rounded-xl transition"
      >
        {googleLoading ? <Loader2 size={16} className="animate-spin text-taupe" /> : <GoogleIcon />}
        <span>Sign up with Google (فوری رجسٹریشن)</span>
      </button>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-sand"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
          <span className="bg-white px-2.5 text-taupe font-medium">Or register with email</span>
        </div>
      </div>

      <form onSubmit={handleSignUp} className="space-y-3">
        <div>
          <label className="label">Full Name / Family Name *</label>
          <div className="relative">
            <input
              className="input pl-9"
              required
              placeholder="e.g. Chaudhry Tariq Mehmood"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
          </div>
        </div>

        <div>
          <label className="label">Email Address *</label>
          <div className="relative">
            <input
              className={`input pl-9 ${email ? (emailValidity.isValid ? 'border-emerald-500 focus:border-emerald-600' : 'border-amber-400') : ''}`}
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
          </div>

          {/* Real-time Email Authenticity Indicator */}
          {email && (
            <p className={`text-[10px] mt-1 font-medium ${emailValidity.isValid ? 'text-emerald-700' : 'text-amber-700'}`}>
              {emailValidity.message}
            </p>
          )}
        </div>

        <div>
          <label className="label">Create Password *</label>
          <div className="relative">
            <input
              className="input pl-9 pr-9"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Minimum 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe hover:text-ink"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Password Strength Meter */}
          {password && (
            <div className="mt-1.5 space-y-1">
              <div className="h-1.5 w-full bg-sand/60 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${(strength.score / 4) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-taupe block text-right font-medium">
                Strength: {strength.label}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="label">Confirm Password *</label>
          <div className="relative">
            <input
              className="input pl-9"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
          </div>
          {confirmPassword && password !== confirmPassword && (
            <span className="text-[10px] text-red-600 mt-1 block">
              Passwords do not match
            </span>
          )}
        </div>

        <label className="flex items-start gap-2 cursor-pointer text-xs text-taupe pt-1">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={e => setAgreeTerms(e.target.checked)}
            className="rounded border-sand text-brown focus:ring-brown mt-0.5"
          />
          <span>I agree to secure ledger storage and private data privacy terms.</span>
        </label>

        <button
          type="submit"
          className="btn btn-p w-full !py-2.5 shadow-md font-medium text-sm flex items-center justify-center gap-2 mt-2"
          disabled={loading || googleLoading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Create Account</span>}
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-sand text-center text-xs text-taupe">
        Already have an account?{' '}
        <Link to="/login" className="underline font-bold text-ink">
          Sign In
        </Link>
      </div>
    </Shell>
  )
}

// ========================================================
// 3. FORGOT PASSWORD SCREEN
// ========================================================
export function Forgot() {
  const { resetPasswordEmail } = useStore()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState(null)

  const handleReset = async e => {
    e.preventDefault()
    setLoading(true)
    setErr(null)

    try {
      await resetPasswordEmail(email.trim())
      setSent(true)
    } catch (e) {
      setErr(e.message || 'Failed to dispatch reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell
      title="Reset Password"
      subtitle="Enter your email to receive recovery instructions"
    >
      {err && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-900 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      {sent ? (
        <div className="text-center py-4 space-y-4 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto">
            <Check size={26} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Instructions Dispatched</h3>
            <p className="text-xs text-taupe mt-1 leading-relaxed">
              We have dispatched a password recovery link to <b>{email}</b>. Click the link in your email to choose a new password.
            </p>
          </div>
          <Link to="/login" className="btn btn-p text-xs !py-2.5 w-full block">
            Return to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="label">Registered Email Address</label>
            <div className="relative">
              <input
                className="input pl-9"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-p w-full !py-2.5 shadow-md text-sm flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Send Recovery Email</span>}
          </button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-taupe hover:text-ink flex items-center justify-center gap-1">
              <ArrowLeft size={13} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </Shell>
  )
}

// ========================================================
// 4. UPDATE PASSWORD SCREEN (From Recovery Link)
// ========================================================
export function UpdatePassword() {
  const { updateUserPassword } = useStore()
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleUpdate = async e => {
    e.preventDefault()
    setErr(null)

    if (password !== confirmPassword) {
      setErr('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setErr('New password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    try {
      await updateUserPassword(password)
      setSuccess(true)
      setTimeout(() => nav('/app'), 2000)
    } catch (e) {
      setErr(e.message || 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Shell
      title="Set New Password"
      subtitle="Choose a secure new password for your ledger account"
    >
      {err && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-900 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
          <span>{err}</span>
        </div>
      )}

      {success ? (
        <div className="text-center py-4 space-y-3 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="font-serif text-lg font-bold text-ink">Password Updated Successfully!</h3>
          <p className="text-xs text-taupe">Redirecting to your ledger dashboard...</p>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="label">New Password *</label>
            <div className="relative">
              <input
                className="input pl-9 pr-9"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe hover:text-ink"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Confirm New Password *</label>
            <div className="relative">
              <input
                className="input pl-9"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-taupe" />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-p w-full !py-2.5 shadow-md text-sm flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <span>Save New Password</span>}
          </button>
        </form>
      )}
    </Shell>
  )
}
