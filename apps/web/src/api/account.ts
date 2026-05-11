import { supabase } from '../services/supabase';

type ErrorContext = {
  status?: number;
  statusText?: string;
  clone?: () => {
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
  };
};

export type DeleteAccountAction = 'confirm-delete';

export type DeleteAccountInput = {
  action: DeleteAccountAction;
  currentPassword: string;
};

export type AccountActionResult = {
  success: boolean;
  error?: string;
};

export type AnonymizeObservationsInput = {
  action: 'confirm-anonymize';
};

export const anonymizeOwnObservations = async (
  input: AnonymizeObservationsInput
): Promise<AccountActionResult> => {
  const result = await supabase.functions.invoke('anonymize-observations', {
    body: input,
  });

  if (!result.error) {
    return { success: true };
  }

  const originalError = result.error as unknown;
  const context = (originalError as { context?: unknown })?.context as ErrorContext | undefined;

  let detailedMessage =
    typeof (originalError as { message?: unknown })?.message === 'string' &&
    (originalError as { message: string }).message.trim()
      ? (originalError as { message: string }).message.trim()
      : 'Unable to anonymize observations.';

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
        // Keep fallback message.
      }
    }
  }

  let statusPart: string | null = null;
  if (typeof context?.status === 'number') {
    const statusTextSuffix =
      typeof context.statusText === 'string' && context.statusText.trim()
        ? ` ${context.statusText}`
        : '';
    statusPart = `HTTP ${context.status}${statusTextSuffix}`;
  }

  return {
    success: false,
    error: statusPart ? `${statusPart} - ${detailedMessage}` : detailedMessage,
  };
};

export type DeleteUserAudiosInput = {
  action: 'confirm-delete-user-audio';
};

export const deleteUserAudios = async (
  input: DeleteUserAudiosInput
): Promise<AccountActionResult> => {
  const result = await supabase.functions.invoke('delete-user-audios', {
    method: 'POST',
    body: input,
  });

  if (!result.error) {
    return { success: true };
  }

  const originalError = result.error as unknown;
  const context = (originalError as { context?: unknown })?.context as ErrorContext | undefined;

  let detailedMessage =
    typeof (originalError as { message?: unknown })?.message === 'string' &&
    (originalError as { message: string }).message.trim()
      ? (originalError as { message: string }).message.trim()
      : 'Unable to delete user audio files.';

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
        // Keep fallback message.
      }
    }
  }

  let statusPart: string | null = null;

  if (typeof context?.status === 'number') {
    const statusTextSuffix =
      typeof context.statusText === 'string' && context.statusText.trim()
        ? ` ${context.statusText}`
        : '';

    statusPart = `HTTP ${context.status}${statusTextSuffix}`;
  }

  return {
    success: false,
    error: statusPart ? `${statusPart} - ${detailedMessage}` : detailedMessage,
  };
};

export const deleteAccount = async (input: DeleteAccountInput): Promise<AccountActionResult> => {
  const result = await supabase.functions.invoke('delete-account', {
    method: 'POST',
    body: input,
  });

  if (!result.error) {
    return { success: true };
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
        // Keep fallback message.
      }
    }
  }

  let statusPart: string | null = null;
  if (typeof context?.status === 'number') {
    const statusTextSuffix =
      typeof context.statusText === 'string' && context.statusText.trim()
        ? ` ${context.statusText}`
        : '';
    statusPart = `HTTP ${context.status}${statusTextSuffix}`;
  }

  return {
    success: false,
    error: statusPart ? `${statusPart} - ${detailedMessage}` : detailedMessage,
  };
};
