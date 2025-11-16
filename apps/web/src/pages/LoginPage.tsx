import React, { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { toast } from 'sonner';
import { Home } from 'lucide-react';
import imgImageWithFallback from '../../assets/images/background.png';

interface LoginPageProps {
  onSuccess: () => void;
  onNavigateToHome?: () => void;
}

export function LoginPage({ onSuccess, onNavigateToHome }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('Successfully signed in!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signUp(name, email, password);
      toast.success('Account created successfully!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock forgot password functionality
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Password reset link sent to your email!');
      setIsForgotPassword(false);
      setEmail('');
    } catch (error) {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password View
  if (isForgotPassword) {
    return (
      <div className="bg-white relative size-full">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            alt=""
            className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full"
            src={imgImageWithFallback}
          />
        </div>

        {/* Home Button */}
        {onNavigateToHome && (
          <button
            onClick={onNavigateToHome}
            className="absolute left-6 top-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors backdrop-blur-sm"
          >
            <Home className="size-5 text-neutral-950" />
            <span className="font-['Arimo',_sans-serif] font-normal text-[14px] text-neutral-950">
              Home
            </span>
          </button>
        )}

        {/* Forgot Password Form Container */}
        <div className="absolute box-border content-stretch flex flex-col gap-[32px] items-start left-1/2 -translate-x-1/2 pb-0 pt-[24px] px-[24px] top-[35px] w-[448px] max-h-[calc(100vh-70px)] overflow-y-auto">
          {/* Header */}
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <div className="h-[48px] relative shadow-[0px_4px_8px_0px_rgba(0,0,0,0.15)] shrink-0 w-full">
              <p className="absolute font-['Arimo',_sans-serif] font-normal leading-[48px] left-1/2 text-[48px] text-center text-nowrap text-white top-[-5px] -translate-x-1/2 whitespace-pre">
                Waterways
              </p>
            </div>
            <div className="h-[28px] opacity-90 relative shadow-[0px_3px_6px_0px_rgba(0,0,0,0.12)] shrink-0 w-full">
              <p className="absolute font-['Arimo',_sans-serif] font-normal leading-[28px] left-1/2 text-[20px] text-center text-nowrap text-white top-[-2.2px] -translate-x-1/2 whitespace-pre">
                Navigate your water journey
              </p>
            </div>
          </div>

          {/* Forgot Password Card */}
          <div className="bg-[rgba(255,255,255,0.95)] relative rounded-[14px] shrink-0 w-full p-[24px]">
            <div
              aria-hidden="true"
              className="absolute border-[0.8px] border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[14px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
            />

            {/* Card Header */}
            <div className="mb-[24px]">
              <h3 className="font-['Arimo',_sans-serif] font-normal leading-[36px] text-[30px] text-center text-neutral-950">
                Reset Password
              </h3>
              <p className="font-['Arimo',_sans-serif] font-normal leading-[24px] text-[#717182] text-[16px] text-center">
                Enter your email to receive a password reset link
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleForgotPassword} className="space-y-[16px]">
              {/* Email Field */}
              <div className="space-y-[8px]">
                <label className="font-['Arimo',_sans-serif] font-normal leading-[14px] text-[14px] text-neutral-950">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="bg-[#f3f3f5] h-[36px] w-full rounded-[8px] px-[12px] py-[4px] font-['Arimo',_sans-serif] font-normal text-[14px] text-neutral-950 placeholder:text-[#717182] border-[0.8px] border-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-[#030213] h-[36px] w-full rounded-[8px] font-['Arimo',_sans-serif] font-normal leading-[20px] text-[14px] text-white text-center hover:bg-[#030213]/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              {/* Divider */}
              <div className="bg-[rgba(0,0,0,0.1)] h-px w-full my-[16px]" />

              {/* Back to Sign In Link */}
              <div>
                <p className="font-['Arimo',_sans-serif] font-normal leading-[24px] text-[#717182] text-[16px] text-center mb-[8px]">
                  Remember your password?
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="bg-white h-[36px] w-full rounded-[8px] font-['Arimo',_sans-serif] font-normal leading-[20px] text-[14px] text-neutral-950 text-center border-[0.8px] border-[rgba(0,0,0,0.1)] hover:bg-[#f3f3f5] transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <p className="font-['Arimo',_sans-serif] font-normal leading-[24px] text-[16px] text-[rgba(255,255,255,0.8)] text-center w-full shadow-[0px_3px_6px_0px_rgba(0,0,0,0.12)]">
            © 2024 Waterways. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  if (isSignUp) {
    return (
      <div className="bg-white relative size-full">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            alt=""
            className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full"
            src={imgImageWithFallback}
          />
        </div>

        {/* Home Button */}
        {onNavigateToHome && (
          <button
            onClick={onNavigateToHome}
            className="absolute left-6 top-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors backdrop-blur-sm"
          >
            <Home className="size-5 text-neutral-950" />
            <span className="font-['Arimo',_sans-serif] font-normal text-[14px] text-neutral-950">
              Home
            </span>
          </button>
        )}

        {/* Sign Up Form Container */}
        <div className="absolute box-border content-stretch flex flex-col gap-[32px] items-start left-1/2 -translate-x-1/2 pb-0 pt-[24px] px-[24px] top-[35px] w-[448px] max-h-[calc(100vh-70px)] overflow-y-auto">
          {/* Header */}
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <div className="h-[48px] relative shadow-[0px_4px_8px_0px_rgba(0,0,0,0.15)] shrink-0 w-full">
              <p className="absolute font-['Arimo',_sans-serif] font-normal leading-[48px] left-1/2 text-[48px] text-center text-nowrap text-white top-[-5px] -translate-x-1/2 whitespace-pre">
                Waterways
              </p>
            </div>
            <div className="h-[28px] opacity-90 relative shadow-[0px_3px_6px_0px_rgba(0,0,0,0.12)] shrink-0 w-full">
              <p className="absolute font-['Arimo',_sans-serif] font-normal leading-[28px] left-1/2 text-[20px] text-center text-nowrap text-white top-[-2.2px] -translate-x-1/2 whitespace-pre">
                Navigate your water journey
              </p>
            </div>
          </div>

          {/* Sign Up Card */}
          <div className="bg-[rgba(255,255,255,0.95)] relative rounded-[14px] shrink-0 w-full p-[24px]">
            <div
              aria-hidden="true"
              className="absolute border-[0.8px] border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[14px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
            />

            {/* Card Header */}
            <div className="mb-[24px]">
              <h3 className="font-['Arimo',_sans-serif] font-normal leading-[36px] text-[30px] text-center text-neutral-950">
                Create Account
              </h3>
              <p className="font-['Arimo',_sans-serif] font-normal leading-[24px] text-[#717182] text-[16px] text-center">
                Join Waterways to start mapping your observations
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignUp} className="space-y-[16px]">
              {/* Name Field */}
              <div className="space-y-[8px]">
                <label className="font-['Arimo',_sans-serif] font-normal leading-[14px] text-[14px] text-neutral-950">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your name"
                  className="bg-[#f3f3f5] h-[36px] w-full rounded-[8px] px-[12px] py-[4px] font-['Arimo',_sans-serif] font-normal text-[14px] text-neutral-950 placeholder:text-[#717182] border-[0.8px] border-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-[8px]">
                <label className="font-['Arimo',_sans-serif] font-normal leading-[14px] text-[14px] text-neutral-950">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="bg-[#f3f3f5] h-[36px] w-full rounded-[8px] px-[12px] py-[4px] font-['Arimo',_sans-serif] font-normal text-[14px] text-neutral-950 placeholder:text-[#717182] border-[0.8px] border-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-[8px]">
                <label className="font-['Arimo',_sans-serif] font-normal leading-[14px] text-[14px] text-neutral-950">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="bg-[#f3f3f5] h-[36px] w-full rounded-[8px] px-[12px] py-[4px] font-['Arimo',_sans-serif] font-normal text-[14px] text-neutral-950 placeholder:text-[#717182] border-[0.8px] border-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-[#030213] h-[36px] w-full rounded-[8px] font-['Arimo',_sans-serif] font-normal leading-[20px] text-[14px] text-white text-center hover:bg-[#030213]/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              {/* Divider */}
              <div className="bg-[rgba(0,0,0,0.1)] h-px w-full my-[16px]" />

              {/* Sign In Link */}
              <div>
                <p className="font-['Arimo',_sans-serif] font-normal leading-[24px] text-[#717182] text-[16px] text-center mb-[8px]">
                  Already have an account?
                </p>
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="bg-white h-[36px] w-full rounded-[8px] font-['Arimo',_sans-serif] font-normal leading-[20px] text-[14px] text-neutral-950 text-center border-[0.8px] border-[rgba(0,0,0,0.1)] hover:bg-[#f3f3f5] transition-colors"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <p className="font-['Arimo',_sans-serif] font-normal leading-[24px] text-[16px] text-[rgba(255,255,255,0.8)] text-center w-full shadow-[0px_3px_6px_0px_rgba(0,0,0,0.12)]">
            © 2024 Waterways. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white relative size-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          alt=""
          className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full"
          src={imgImageWithFallback}
        />
      </div>

      {/* Home Button */}
      {onNavigateToHome && (
        <button
          onClick={onNavigateToHome}
          className="absolute left-6 top-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors backdrop-blur-sm"
        >
          <Home className="size-5 text-neutral-950" />
          <span className="font-['Arimo',_sans-serif] font-normal text-[14px] text-neutral-950">
            Home
          </span>
        </button>
      )}

      {/* Sign In Form Container */}
      <div className="absolute box-border content-stretch flex flex-col gap-[32px] items-start left-1/2 -translate-x-1/2 pb-0 pt-[24px] px-[24px] top-[35px] w-[448px] max-h-[calc(100vh-70px)] overflow-y-auto">
        {/* Header */}
        <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
          <div className="h-[48px] relative shadow-[0px_4px_8px_0px_rgba(0,0,0,0.15)] shrink-0 w-full">
            <p className="absolute font-['Arimo',_sans-serif] font-normal leading-[48px] left-1/2 text-[48px] text-center text-nowrap text-white top-[-5px] -translate-x-1/2 whitespace-pre">
              Waterways
            </p>
          </div>
          <div className="h-[28px] opacity-90 relative shadow-[0px_3px_6px_0px_rgba(0,0,0,0.12)] shrink-0 w-full">
            <p className="absolute font-['Arimo',_sans-serif] font-normal leading-[28px] left-1/2 text-[20px] text-center text-nowrap text-white top-[-2.2px] -translate-x-1/2 whitespace-pre">
              Navigate your water journey
            </p>
          </div>
        </div>

        {/* Sign In Card */}
        <div className="bg-[rgba(255,255,255,0.95)] relative rounded-[14px] shrink-0 w-full p-[24px]">
          <div
            aria-hidden="true"
            className="absolute border-[0.8px] border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[14px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
          />

          {/* Card Header */}
          <div className="mb-[24px]">
            <h3 className="font-['Arimo',_sans-serif] font-normal leading-[36px] text-[30px] text-center text-neutral-950">
              Welcome Back
            </h3>
            <p className="font-['Arimo',_sans-serif] font-normal leading-[24px] text-[#717182] text-[16px] text-center">
              Sign in to your Waterways account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-[16px]">
            {/* Email Field */}
            <div className="space-y-[8px]">
              <label className="font-['Arimo',_sans-serif] font-normal leading-[14px] text-[14px] text-neutral-950">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="bg-[#f3f3f5] h-[36px] w-full rounded-[8px] px-[12px] py-[4px] font-['Arimo',_sans-serif] font-normal text-[14px] text-neutral-950 placeholder:text-[#717182] border-[0.8px] border-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-[8px]">
              <label className="font-['Arimo',_sans-serif] font-normal leading-[14px] text-[14px] text-neutral-950">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="bg-[#f3f3f5] h-[36px] w-full rounded-[8px] px-[12px] py-[4px] font-['Arimo',_sans-serif] font-normal text-[14px] text-neutral-950 placeholder:text-[#717182] border-[0.8px] border-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#030213] h-[36px] w-full rounded-[8px] font-['Arimo',_sans-serif] font-normal leading-[20px] text-[14px] text-white text-center hover:bg-[#030213]/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Forgot Password */}
            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="font-['Arimo',_sans-serif] font-normal leading-[20px] text-[#030213] text-[14px] w-full text-center hover:underline"
            >
              Forgot your password?
            </button>

            {/* Divider */}
            <div className="bg-[rgba(0,0,0,0.1)] h-px w-full my-[16px]" />

            {/* Sign Up Link */}
            <div>
              <p className="font-['Arimo',_sans-serif] font-normal leading-[24px] text-[#717182] text-[16px] text-center mb-[8px]">
                Don&#39;t have an account?
              </p>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="bg-white h-[36px] w-full rounded-[8px] font-['Arimo',_sans-serif] font-normal leading-[20px] text-[14px] text-neutral-950 text-center border-[0.8px] border-[rgba(0,0,0,0.1)] hover:bg-[#f3f3f5] transition-colors"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="font-['Arimo',_sans-serif] font-normal leading-[24px] text-[16px] text-[rgba(255,255,255,0.8)] text-center w-full shadow-[0px_3px_6px_0px_rgba(0,0,0,0.12)]">
          © 2024 Waterways. All rights reserved.
        </p>
      </div>
    </div>
  );
}
