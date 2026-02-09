// tests/shared/auth.test.ts

// 1️⃣ Mock the client module imported by auth.ts
jest.mock('@waterways/shared/supabase/client', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockClient = require('./__mocks__/auth');
  return { supabase: mockClient.supabase, __mocks__: mockClient };
});

// 2️⃣ Pull mock functions out of the mocked client

const {
  __mocks__: {
    mockSignInWithPassword,
    mockSignOut,
    mockSignUp,
    mockGetSession,
    mockResetPasswordForEmail,
    mockVerifyOtp,
    mockUpdateUser,
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('@waterways/shared/supabase/client');

// 3️⃣ Require the auth wrapper (avoids TypeScript path issues)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const auth = require('@waterways/shared/supabase/auth');

describe('Supabase Auth Wrapper (shared package)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('signIn delegates to supabase.auth.signInWithPassword', async () => {
    const mockRes = { data: { session: { id: 's1' } }, error: null };
    mockSignInWithPassword.mockResolvedValueOnce(mockRes);

    const res = await auth.signIn('user@example.com', 'pass123');

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'pass123',
    });
    expect(res).toBe(mockRes);
  });

  test('signOut delegates to supabase.auth.signOut', async () => {
    const mockRes = { error: null };
    mockSignOut.mockResolvedValueOnce(mockRes);

    const res = await auth.signOut();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(res).toBe(mockRes);
  });

  test('signUp delegates to supabase.auth.signUp', async () => {
    const mockRes = { data: { user: { id: 'u1' } }, error: null };
    mockSignUp.mockResolvedValueOnce(mockRes);

    const res = await auth.signUp('new@example.com', 'password', 'John', 'Doe');

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password',
      options: {
        data: {
          first_name: 'John',
          last_name: 'Doe',
        },
      },
    });
    expect(res).toBe(mockRes);
  });

  test('getSession delegates to supabase.auth.getSession', async () => {
    const mockRes = { data: { session: { id: 's2' } }, error: null };
    mockGetSession.mockResolvedValueOnce(mockRes);

    const res = await auth.getSession();

    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(res).toBe(mockRes);
  });

  test('sendResetPasswordEmail delegates to supabase.auth.resetPasswordForEmail', async () => {
    const mockRes = { data: {}, error: null };
    mockResetPasswordForEmail.mockResolvedValueOnce(mockRes);

    const res = await auth.sendResetPasswordEmail('reset@example.com');

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('reset@example.com');
    expect(res).toBe(mockRes);
  });

  test('verifyResetPasswordOtp delegates to supabase.auth.verifyOtp', async () => {
    const mockRes = { data: {}, error: null };
    mockVerifyOtp.mockResolvedValueOnce(mockRes);

    const res = await auth.verifyResetPasswordOtp('user@example.com', '123456');

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: '123456',
      type: 'recovery',
    });
    expect(res).toBe(mockRes);
  });

  test('resetPassword delegates to supabase.auth.updateUser', async () => {
    const mockRes = { data: { user: { id: 'u2' } }, error: null };
    mockUpdateUser.mockResolvedValueOnce(mockRes);

    const res = await auth.resetPassword('new-pass');

    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'new-pass' });
    expect(res).toBe(mockRes);
  });
});
