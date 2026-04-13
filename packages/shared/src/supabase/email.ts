import { supabase } from './client';

type ErrorContext = {
  status?: number;
  statusText?: string;
  clone?: () => {
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
  };
};

export type EmailTemplate = 'welcome' | 'password-reset' | 'generic';

export type SendAppEmailInput = {
  template: EmailTemplate;
  to?: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
  data?: {
    firstName?: string;
    appUrl?: string;
    resetUrl?: string;
  };
};

export type SendAppEmailResult = {
  success: boolean;
  emailId: string | null;
  to: string[];
  template: EmailTemplate;
};

export const sendAppEmail = async (input: SendAppEmailInput) => {
  const result = await supabase.functions.invoke<SendAppEmailResult>('send-email', {
    body: input,
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
      : 'Unable to send email.';

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
