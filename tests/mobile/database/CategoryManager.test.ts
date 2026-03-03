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

// IMPORTANT: must match the module path that CategoryManager resolves './db' to
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

  beforeEach(() => {
    jest.clearAllMocks();

    const db: DbLike = {
      runAsync: mockRunAsync,
      getAllAsync: mockGetAllAsync,
    };

    // getDatabase() likely has a specific return type (expo-sqlite database)
    // so we cast our DbLike to that return type without using `any`.
    mockGetDatabase.mockResolvedValue(
      db as unknown as Awaited<ReturnType<typeof dbModule.getDatabase>>
    );

    // default supabase mock
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(),
    });
  });

  describe('syncCategoriesFromSupabase', () => {
    test('logs error and returns early when Supabase returns an error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const selectMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'boom' },
      });

      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      await syncCategoriesFromSupabase();

      expect(supabase.from).toHaveBeenCalledWith('observation_categories');
      expect(selectMock).toHaveBeenCalledWith('*');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockGetDatabase).not.toHaveBeenCalled();
      expect(mockRunAsync).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('does nothing to DB if Supabase returns null/undefined data and no error', async () => {
      const selectMock = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

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

      const selectMock = jest.fn().mockResolvedValue({
        data: supabaseData,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      await syncCategoriesFromSupabase();

      // DB should be opened
      expect(mockGetDatabase).toHaveBeenCalledTimes(1);

      // First call: delete all existing categories
      expect(mockRunAsync).toHaveBeenNthCalledWith(1, 'DELETE FROM categories');

      // Next calls: insert/replace for each row (2 rows => 2 inserts)
      expect(mockRunAsync).toHaveBeenNthCalledWith(
        2,
        `INSERT OR REPLACE INTO categories (id, name, is_fallback, color, keywords) VALUES (?, ?, ?, ?, ?)`,
        ['1', 'ENVIRONMENTAL', false, '#00FF00', 'algae,foam'] // keywords array -> "algae,foam"
      );

      expect(mockRunAsync).toHaveBeenNthCalledWith(
        3,
        `INSERT OR REPLACE INTO categories (id, name, is_fallback, color, keywords) VALUES (?, ?, ?, ?, ?)`,
        ['2', 'OTHERS', true, '#999999', null] // keywords null -> null
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
          // keywords intentionally missing
        },
      ];

      const selectMock = jest.fn().mockResolvedValue({
        data: supabaseData,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      await syncCategoriesFromSupabase();

      expect(mockRunAsync).toHaveBeenNthCalledWith(1, 'DELETE FROM categories');
      expect(mockRunAsync).toHaveBeenNthCalledWith(
        2,
        `INSERT OR REPLACE INTO categories (id, name, is_fallback, color, keywords) VALUES (?, ?, ?, ?, ?)`,
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
