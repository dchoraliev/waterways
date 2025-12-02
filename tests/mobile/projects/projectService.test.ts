import {
  createProject,
  getUserProjects,
  joinProjectWithCode,
  leaveProject,
} from '../../../apps/mobile/src/services/projectService';
import { supabase } from '@waterways/shared/src/supabase/client';

// Mock Supabase
jest.mock('@waterways/shared/src/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('projectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        created_by: 'user-123',
        join_code: 'ABC12345',
        created_at: new Date().toISOString(),
      };

      // Mock the join code check (returns null, meaning code doesn't exist)
      const selectMockForCheck = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (selectMockForCheck.eq as jest.Mock).mockReturnValue(selectMockForCheck);

      // Mock the project creation
      const insertMock = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProject, error: null }),
      };
      (insertMock.select as jest.Mock).mockReturnValue(insertMock);

      // Mock project_membership insert
      const membershipInsertMock = jest.fn().mockResolvedValue({ data: {}, error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue(selectMockForCheck) })
        .mockReturnValueOnce({ insert: jest.fn().mockReturnValue(insertMock) })
        .mockReturnValueOnce({ insert: membershipInsertMock });

      const { data, error } = await createProject('Test Project', 'user-123');

      expect(data).toEqual(mockProject);
      expect(error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('projects');
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Database error');

      // Mock the join code check
      const selectMockForCheck = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (selectMockForCheck.eq as jest.Mock).mockReturnValue(selectMockForCheck);

      // Mock failed insert
      const insertMock = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(mockError),
      };
      (insertMock.select as jest.Mock).mockReturnValue(insertMock);

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue(selectMockForCheck) })
        .mockReturnValueOnce({ insert: jest.fn().mockReturnValue(insertMock) });

      const { data, error } = await createProject('Test Project', 'user-123');

      expect(data).toBeNull();
      expect(error).toEqual(mockError);
    });

    it('should generate unique join codes', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test',
        created_by: 'user-123',
        join_code: 'TESTCODE',
        created_at: new Date().toISOString(),
      };

      // Mock the join code check
      const selectMockForCheck = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      (selectMockForCheck.eq as jest.Mock).mockReturnValue(selectMockForCheck);

      // Mock project creation
      const insertMock = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProject, error: null }),
      };
      (insertMock.select as jest.Mock).mockReturnValue(insertMock);

      // Mock membership insert
      const membershipInsertMock = jest.fn().mockResolvedValue({ data: {}, error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue(selectMockForCheck) })
        .mockReturnValueOnce({ insert: jest.fn().mockReturnValue(insertMock) })
        .mockReturnValueOnce({ insert: membershipInsertMock });

      const { data } = await createProject('Test', 'user-123');

      expect(data?.join_code).toBeDefined();
      expect(data?.join_code.length).toBe(8);
    });
  });

  describe('getUserProjects', () => {
    it('should fetch user projects successfully', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Project 1',
          description: null,
          join_code: 'CODE1234',
          created_by: 'user-123',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Project 2',
          description: null,
          join_code: 'CODE5678',
          created_by: 'user-123',
          created_at: new Date().toISOString(),
        },
      ];

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockProjects.map((p) => ({ project: p })),
          error: null,
        }),
      };
      (mockFrom.select as jest.Mock).mockReturnValue(mockFrom);
      (mockFrom.eq as jest.Mock).mockReturnValue(mockFrom);

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { data, error } = await getUserProjects('user-123');

      expect(data).toEqual(mockProjects);
      expect(error).toBeNull();
      expect(mockFrom.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should return empty array when no projects found', async () => {
      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      (mockFrom.select as jest.Mock).mockReturnValue(mockFrom);
      (mockFrom.eq as jest.Mock).mockReturnValue(mockFrom);

      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { data, error } = await getUserProjects('user-123');

      expect(data).toEqual([]);
      expect(error).toBeNull();
    });
  });

  describe('joinProjectWithCode', () => {
    it('should join project successfully', async () => {
      const mockProject = { id: 'project-123' };

      // Mock finding the project
      const projectSelectMock = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProject, error: null }),
      };
      (projectSelectMock.eq as jest.Mock).mockReturnValue(projectSelectMock);

      // Mock checking existing membership (returns null)
      const membershipSelectMock = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      (membershipSelectMock.eq as jest.Mock).mockReturnValue(membershipSelectMock);

      // Mock inserting membership
      const insertMock = jest.fn().mockResolvedValue({ data: {}, error: null });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue(projectSelectMock) })
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue(membershipSelectMock) })
        .mockReturnValueOnce({ insert: insertMock });

      const { success, error } = await joinProjectWithCode('user-123', 'TESTCODE');

      expect(success).toBe(true);
      expect(error).toBeNull();
    });

    it('should fail with invalid join code', async () => {
      const selectMock = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      (selectMock.eq as jest.Mock).mockReturnValue(selectMock);

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(selectMock),
      });

      const { success, error } = await joinProjectWithCode('user-123', 'INVALID');

      expect(success).toBe(false);
      expect(error).toBe('Invalid join code');
    });
  });

  describe('leaveProject', () => {
    it('should leave project successfully', async () => {
      const eqChain = {
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      const deleteMock = {
        eq: jest.fn().mockReturnValue(eqChain),
      };

      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue(deleteMock),
      });

      const { error } = await leaveProject('user-123', 'project-123');

      expect(error).toBeNull();
    });
  });
});
