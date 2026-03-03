// packages/shared/src/supabase/auth.ts
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

export const resetEmail = async (newEmail: string) => {
  return await supabase.auth.updateUser({ email: newEmail });
};

type ErrorContext = {
  status?: number;
  statusText?: string;
  clone?: () => {
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
  };
};

export const deleteAccount = async () => {
  const result = await supabase.functions.invoke('delete-account', {
    body: {},
  });

  if (!result.error) {
    return result;
  }

  const originalError = result.error as unknown;
  const context = (originalError as { context?: unknown })?.context as ErrorContext | undefined;

  let detailedMessage =
    typeof (originalError as { message?: unknown })?.message === 'string' &&
    (originalError as { message: string }).message.trim()
      ? (originalError as { message: string }).message.trim()
      : 'Unable to delete account.';

  if (context?.clone) {
    try {
      const jsonPayload = await context.clone().json?.();

      if (
        jsonPayload &&
        typeof jsonPayload === 'object' &&
        'error' in jsonPayload &&
        typeof (jsonPayload as { error?: unknown }).error === 'string' &&
        (jsonPayload as { error: string }).error.trim()
      ) {
        detailedMessage = (jsonPayload as { error: string }).error.trim();
      }
    } catch {
      try {
        const textPayload = await context.clone().text?.();
        if (typeof textPayload === 'string' && textPayload.trim()) {
          detailedMessage = textPayload.trim();
        }
      } catch {
        // keep fallback message
      }
    }
  }

  const statusPart =
    typeof context?.status === 'number'
      ? `HTTP ${context.status}${
          typeof context.statusText === 'string' && context.statusText.trim()
            ? ` ${context.statusText}`
            : ''
        }`
      : null;

  return {
    data: result.data,
    error: {
      name: (originalError as { name?: unknown })?.name,
      message: statusPart ? `${statusPart} • ${detailedMessage}` : detailedMessage,
    },
  };
};
