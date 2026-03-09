const mockCreateClient = jest.fn(() => ({ auth: {} }));

jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

describe('web supabase auth persistence', () => {
  beforeEach(() => {
    jest.resetModules();
    mockCreateClient.mockClear();
  });

  it('uses localStorage for persisted auth sessions when available', async () => {
    await import('../../../apps/web/src/services/supabase');

    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        auth: expect.objectContaining({
          persistSession: true,
          autoRefreshToken: true,
          storage: window.localStorage,
        }),
      })
    );
  });
});
