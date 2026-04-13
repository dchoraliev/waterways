jest.mock('@waterways/shared/supabase/client', () => {
  const mockedInvoke = jest.fn();

  return {
    supabase: {
      functions: {
        invoke: mockedInvoke,
      },
    },
    __mocks__: {
      mockedInvoke,
    },
  };
});

const {
  __mocks__: { mockedInvoke },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('@waterways/shared/supabase/client');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const email = require('@waterways/shared/supabase/email');

describe('Supabase Email Wrapper (shared package)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sendAppEmail delegates to supabase.functions.invoke', async () => {
    const mockRes = {
      data: {
        success: true,
        emailId: 'email_123',
        to: ['user@example.com'],
        template: 'welcome',
      },
      error: null,
    };

    mockedInvoke.mockResolvedValueOnce(mockRes);

    const res = await email.sendAppEmail({
      template: 'welcome',
      to: 'user@example.com',
      data: { firstName: 'Alex', appUrl: 'https://app.example.com' },
    });

    expect(mockedInvoke).toHaveBeenCalledWith('send-email', {
      body: {
        template: 'welcome',
        to: 'user@example.com',
        data: { firstName: 'Alex', appUrl: 'https://app.example.com' },
      },
    });

    expect(res).toBe(mockRes);
  });
});
