import {
  getAllCategories,
  syncCategoriesFromSupabase,
} from '@waterways/mobile/src/database/CategoryManager';
import { supabase } from '@shared/supabase/client';

// --------------------
// Mocks
// --------------------
jest.mock('@shared/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@waterways/mobile/src/database/db', () => ({
  getDatabase: jest.fn(),
}));

import * as dbModule from '@waterways/mobile/src/database/db';
const mockGetDatabase = dbModule.getDatabase as jest.MockedFunction<typeof dbModule.getDatabase>;

describe('CategoryManager', () => {
  const mockRunAsync = jest.fn();
  const mockGetAllAsync = jest.fn();

  type DbLike = {
    runAsync: jest.Mock;
    getAllAsync: jest.Mock;
  };

  const buildSupabaseChain = (finalResult: { data: unknown; error: unknown }) => {
    const orderMock = jest.fn().mockResolvedValue(finalResult);
    const eqMock = jest.fn().mockReturnValue({
      order: orderMock,
    });
    const selectMock = jest.fn().mockReturnValue({
      eq: eqMock,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      select: selectMock,
    });

    return { selectMock, eqMock, orderMock };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const db: DbLike = {
      runAsync: mockRunAsync,
      getAllAsync: mockGetAllAsync,
    };

    mockGetDatabase.mockResolvedValue(
      db as unknown as Awaited<ReturnType<typeof dbModule.getDatabase>>
    );
  });

  describe('syncCategoriesFromSupabase', () => {
    test('logs error and returns early when Supabase returns an error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { selectMock, eqMock, orderMock } = buildSupabaseChain({
        data: null,
        error: { message: 'boom' },
      });

      await syncCategoriesFromSupabase();

      expect(supabase.from).toHaveBeenCalledWith('observation_categories');
      expect(selectMock).toHaveBeenCalledWith('id, type, color, keywords, is_fallback');
      expect(eqMock).toHaveBeenCalledWith('is_active', true);
      expect(orderMock).toHaveBeenCalledWith('is_fallback', { ascending: true });

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockGetDatabase).not.toHaveBeenCalled();
      expect(mockRunAsync).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('does nothing to DB if Supabase returns null/undefined data and no error', async () => {
      buildSupabaseChain({
        data: null,
        error: null,
      });

      await syncCategoriesFromSupabase();

      expect(mockGetDatabase).not.toHaveBeenCalled();
      expect(mockRunAsync).not.toHaveBeenCalled();
    });

    test('clears local categories then inserts each fetched category', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const supabaseData = [
        {
          id: '1',
          type: 'ENVIRONMENTAL',
          is_fallback: false,
          color: '#00FF00',
          keywords: ['algae', 'foam'],
        },
        {
          id: '2',
          type: 'OTHERS',
          is_fallback: true,
          color: '#999999',
          keywords: null,
        },
      ];

      buildSupabaseChain({
        data: supabaseData,
        error: null,
      });

      await syncCategoriesFromSupabase();

      expect(mockGetDatabase).toHaveBeenCalledTimes(1);

      expect(mockRunAsync).toHaveBeenNthCalledWith(1, 'DELETE FROM categories');

      expect(mockRunAsync).toHaveBeenNthCalledWith(
        2,
        'INSERT OR REPLACE INTO categories (id, name, is_fallback, color, keywords) VALUES (?, ?, ?, ?, ?)',
        ['1', 'ENVIRONMENTAL', false, '#00FF00', 'algae,foam']
      );

      expect(mockRunAsync).toHaveBeenNthCalledWith(
        3,
        'INSERT OR REPLACE INTO categories (id, name, is_fallback, color, keywords) VALUES (?, ?, ?, ?, ?)',
        ['2', 'OTHERS', true, '#999999', null]
      );

      consoleLogSpy.mockRestore();
    });

    test('keywords missing/undefined becomes null', async () => {
      const supabaseData = [
        {
          id: '3',
          type: 'INFRASTRUCTURE',
          is_fallback: false,
          color: '#123456',
        },
      ];

      buildSupabaseChain({
        data: supabaseData,
        error: null,
      });

      await syncCategoriesFromSupabase();

      expect(mockRunAsync).toHaveBeenNthCalledWith(1, 'DELETE FROM categories');
      expect(mockRunAsync).toHaveBeenNthCalledWith(
        2,
        'INSERT OR REPLACE INTO categories (id, name, is_fallback, color, keywords) VALUES (?, ?, ?, ?, ?)',
        ['3', 'INFRASTRUCTURE', false, '#123456', null]
      );
    });
  });

  describe('getAllCategories', () => {
    test('returns categories from local DB', async () => {
      const rows = [
        { id: '1', name: 'ENVIRONMENTAL', is_fallback: 0, color: '#00FF00', keywords: 'algae' },
      ];

      mockGetAllAsync.mockResolvedValue(rows);

      const result = await getAllCategories();

      expect(mockGetDatabase).toHaveBeenCalledTimes(1);
      expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM categories');
      expect(result).toEqual(rows);
    });

    test('returns [] when DB returns null/undefined', async () => {
      mockGetAllAsync.mockResolvedValue(null as unknown as unknown[]);

      const result = await getAllCategories();

      expect(result).toEqual([]);
    });
  });
});
