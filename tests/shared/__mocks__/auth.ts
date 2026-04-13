// tests/shared/__mocks__/auth.ts

export const mockSignInWithPassword = jest.fn();
export const mockSignOut = jest.fn();
export const mockSignUp = jest.fn();
export const mockGetSession = jest.fn();
export const mockResetPasswordForEmail = jest.fn();
export const mockVerifyOtp = jest.fn();
export const mockUpdateUser = jest.fn();
export const mockReauthenticate = jest.fn();
export const mockFunctionsInvoke = jest.fn();

// Mock version of the Supabase client expected by auth.ts
export const supabase = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signOut: mockSignOut,
    signUp: mockSignUp,
    getSession: mockGetSession,
    resetPasswordForEmail: mockResetPasswordForEmail,
    verifyOtp: mockVerifyOtp,
    updateUser: mockUpdateUser,
    reauthenticate: mockReauthenticate,
  },
  functions: {
    invoke: mockFunctionsInvoke,
  },
};

export default supabase;
