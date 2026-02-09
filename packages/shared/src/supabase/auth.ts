import { supabase } from './client';

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const signUp = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });
};

export const getSession = async () => {
  return await supabase.auth.getSession();
};

export const sendResetPasswordEmail = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email);
};

export const verifyResetPasswordOtp = async (email: string, otp: string) => {
  return await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'recovery',
  });
};

export const resetPassword = async (newPassword: string) => {
  return await supabase.auth.updateUser({ password: newPassword });
};
