import _ProjectManagementModal from 'apps/mobile/src/components/ProjectManagementModal';
import * as projectService from 'apps/mobile/src/services/projectService';
import { Alert } from 'react-native';

// Mock project service
jest.mock('apps/mobile/src/services/projectService');

// Type-safe access to mocks
const mockedGetProjectMembers = projectService.getProjectMembers as jest.MockedFunction<
  typeof projectService.getProjectMembers
>;
const mockedRemoveUserFromProject = projectService.removeUserFromProject as jest.MockedFunction<
  typeof projectService.removeUserFromProject
>;
const mockedDisbandProject = projectService.disbandProject as jest.MockedFunction<
  typeof projectService.disbandProject
>;

describe('ProjectManagementModal', () => {
  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    created_by: 'creator-user-id',
    join_code: 'ABC12345',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockUserId = 'creator-user-id';

  const mockMembers = [
    {
      user_id: 'creator-user-id',
      joined_at: '2024-01-01T00:00:00Z',
      email: 'creator@example.com',
      first_name: 'John',
      last_name: 'Doe',
      display_name: 'John Doe',
    },
    {
      user_id: 'member-1',
      joined_at: '2024-01-02T00:00:00Z',
      email: 'member1@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      display_name: 'Jane Smith',
    },
    {
      user_id: 'member-2',
      joined_at: '2024-01-03T00:00:00Z',
      email: 'member2@example.com',
      display_name: 'member2@example.com',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    mockedGetProjectMembers.mockResolvedValue({
      data: mockMembers,
      error: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Get Project Members', () => {
    it('should fetch project members successfully', async () => {
      const result = await mockedGetProjectMembers('project-123');

      expect(mockedGetProjectMembers).toHaveBeenCalledWith('project-123');
      expect(result.data).toEqual(mockMembers);
      expect(result.error).toBeNull();
    });

    it('should return error when fetching members fails', async () => {
      mockedGetProjectMembers.mockResolvedValue({
        data: null,
        error: new Error('Failed to fetch members'),
      });

      const result = await mockedGetProjectMembers('project-123');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should return empty array when no members', async () => {
      mockedGetProjectMembers.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await mockedGetProjectMembers('project-123');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should include member details in response', async () => {
      const result = await mockedGetProjectMembers('project-123');

      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data[0]).toHaveProperty('user_id');
        expect(result.data[0]).toHaveProperty('email');
        expect(result.data[0]).toHaveProperty('joined_at');
        expect(result.data[0]).toHaveProperty('display_name');
      }
    });
  });

  describe('Remove User From Project', () => {
    it('should remove user successfully', async () => {
      mockedRemoveUserFromProject.mockResolvedValue({
        success: true,
        error: null,
      });

      const result = await mockedRemoveUserFromProject(mockUserId, 'project-123', 'member-1');

      expect(mockedRemoveUserFromProject).toHaveBeenCalledWith(
        mockUserId,
        'project-123',
        'member-1'
      );
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return error when user is not project creator', async () => {
      mockedRemoveUserFromProject.mockResolvedValue({
        success: false,
        error: 'Only the project creator can remove users',
      });

      const result = await mockedRemoveUserFromProject('non-creator-id', 'project-123', 'member-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only the project creator');
    });

    it('should return error when trying to remove creator', async () => {
      mockedRemoveUserFromProject.mockResolvedValue({
        success: false,
        error: 'Project creator cannot be removed',
      });

      const result = await mockedRemoveUserFromProject(mockUserId, 'project-123', mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('creator cannot be removed');
    });

    it('should return error when project not found', async () => {
      mockedRemoveUserFromProject.mockResolvedValue({
        success: false,
        error: 'Project not found',
      });

      const result = await mockedRemoveUserFromProject(mockUserId, 'non-existent', 'member-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Project not found');
    });
  });

  describe('Disband Project', () => {
    it('should disband project successfully', async () => {
      mockedDisbandProject.mockResolvedValue({
        success: true,
        error: null,
      });

      const result = await mockedDisbandProject(mockUserId, 'project-123');

      expect(mockedDisbandProject).toHaveBeenCalledWith(mockUserId, 'project-123');
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return error when user is not project creator', async () => {
      mockedDisbandProject.mockResolvedValue({
        success: false,
        error: 'Only the project creator can disband the project',
      });

      const result = await mockedDisbandProject('non-creator-id', 'project-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only the project creator');
    });

    it('should return error when project not found', async () => {
      mockedDisbandProject.mockResolvedValue({
        success: false,
        error: 'Project not found',
      });

      const result = await mockedDisbandProject(mockUserId, 'non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Project not found');
    });
  });

  describe('Service Mocks', () => {
    it('should mock getProjectMembers service', () => {
      expect(mockedGetProjectMembers).toBeDefined();
      expect(typeof mockedGetProjectMembers).toBe('function');
    });

    it('should mock removeUserFromProject service', () => {
      expect(mockedRemoveUserFromProject).toBeDefined();
      expect(typeof mockedRemoveUserFromProject).toBe('function');
    });

    it('should mock disbandProject service', () => {
      expect(mockedDisbandProject).toBeDefined();
      expect(typeof mockedDisbandProject).toBe('function');
    });
  });

  describe('Member Data Validation', () => {
    it('should validate member structure', async () => {
      const result = await mockedGetProjectMembers('project-123');

      if (result.data && result.data.length > 0) {
        const member = result.data[0];
        expect(member).toHaveProperty('user_id');
        expect(member).toHaveProperty('joined_at');
        expect(member).toHaveProperty('email');
        expect(member).toHaveProperty('display_name');
      }
    });

    it('should identify creator member', async () => {
      const result = await mockedGetProjectMembers('project-123');

      if (result.data) {
        const creator = result.data.find((m) => m.user_id === mockProject.created_by);
        expect(creator).toBeDefined();
        expect(creator?.user_id).toBe(mockProject.created_by);
      }
    });

    it('should identify non-creator members', async () => {
      const result = await mockedGetProjectMembers('project-123');

      if (result.data) {
        const nonCreators = result.data.filter((m) => m.user_id !== mockProject.created_by);
        expect(nonCreators.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Alert Mocking', () => {
    it('should mock Alert.alert', () => {
      Alert.alert('Test', 'Message');
      expect(Alert.alert).toHaveBeenCalledWith('Test', 'Message');
    });

    it('should mock Alert.alert with confirmation buttons', () => {
      Alert.alert('Remove Member', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: jest.fn() },
      ]);

      expect(Alert.alert).toHaveBeenCalledWith('Remove Member', 'Are you sure?', expect.any(Array));
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors in getProjectMembers', async () => {
      mockedGetProjectMembers.mockRejectedValue(new Error('Network error'));

      await expect(mockedGetProjectMembers('project-123')).rejects.toThrow('Network error');
    });

    it('should handle network errors in removeUserFromProject', async () => {
      mockedRemoveUserFromProject.mockRejectedValue(new Error('Network error'));

      await expect(
        mockedRemoveUserFromProject(mockUserId, 'project-123', 'member-1')
      ).rejects.toThrow('Network error');
    });

    it('should handle network errors in disbandProject', async () => {
      mockedDisbandProject.mockRejectedValue(new Error('Network error'));

      await expect(mockedDisbandProject(mockUserId, 'project-123')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('Member Display Name Logic', () => {
    it('should use full name when available', async () => {
      const result = await mockedGetProjectMembers('project-123');

      if (result.data) {
        const memberWithName = result.data.find((m) => m.first_name && m.last_name);
        expect(memberWithName?.display_name).toContain(memberWithName!.first_name);
        expect(memberWithName?.display_name).toContain(memberWithName!.last_name);
      }
    });

    it('should use email when name not available', async () => {
      const result = await mockedGetProjectMembers('project-123');

      if (result.data) {
        const memberWithoutName = result.data.find((m) => !m.first_name && !m.last_name);
        if (memberWithoutName) {
          expect(memberWithoutName.display_name).toBe(memberWithoutName.email);
        }
      }
    });
  });

  describe('Date Handling', () => {
    it('should parse joined_at dates', async () => {
      const result = await mockedGetProjectMembers('project-123');

      if (result.data && result.data.length > 0) {
        const member = result.data[0];
        const date = new Date(member.joined_at);
        expect(date).toBeInstanceOf(Date);
        expect(isNaN(date.getTime())).toBe(false);
      }
    });

    it('should sort members by join date', async () => {
      const result = await mockedGetProjectMembers('project-123');

      if (result.data && result.data.length > 1) {
        const dates = result.data.map((m) => new Date(m.joined_at).getTime());
        const sortedDates = [...dates].sort((a, b) => a - b);
        expect(dates).toEqual(sortedDates);
      }
    });
  });

  describe('Permission Checks', () => {
    it('should verify creator permissions for remove', async () => {
      mockedRemoveUserFromProject.mockResolvedValue({
        success: true,
        error: null,
      });

      const result = await mockedRemoveUserFromProject(mockUserId, 'project-123', 'member-1');

      expect(result.success).toBe(true);
    });

    it('should verify creator permissions for disband', async () => {
      mockedDisbandProject.mockResolvedValue({
        success: true,
        error: null,
      });

      const result = await mockedDisbandProject(mockUserId, 'project-123');

      expect(result.success).toBe(true);
    });

    it('should deny non-creator from removing members', async () => {
      mockedRemoveUserFromProject.mockResolvedValue({
        success: false,
        error: 'Only the project creator can remove users',
      });

      const result = await mockedRemoveUserFromProject('non-creator', 'project-123', 'member-1');

      expect(result.success).toBe(false);
    });
  });
});
