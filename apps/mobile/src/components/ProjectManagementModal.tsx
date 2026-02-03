import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  getProjectMembers,
  removeUserFromProject,
  disbandProject,
} from '../services/projectService';
import type { Project } from '../types/project.types';

interface Props {
  visible: boolean;
  project: Project | null;
  userId: string;
  onClose: () => void;
  onProjectDisbanded: () => void;
}

interface ProjectMember {
  user_id: string;
  joined_at: string;
  first_name?: string;
  last_name?: string;
  email: string;
  display_name: string;
}

const ProjectManagementModal: React.FC<Props> = ({
  visible,
  project,
  userId,
  onClose,
  onProjectDisbanded,
}) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [disbanding, setDisbanding] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!project) return;

    setLoadingMembers(true);
    try {
      const { data } = await getProjectMembers(project.id);

      const membersWithDetails = (data || []).map((member) => ({
        ...member,
        email: member.email || '',
        display_name: member.display_name || '',
        first_name: member.first_name,
        last_name: member.last_name,
      }));

      setMembers(membersWithDetails);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, [project]);

  useEffect(() => {
    let isMounted = true;

    const syncMembers = async () => {
      if (visible && project && isMounted) {
        await loadMembers();
      }
    };

    syncMembers();

    return () => {
      isMounted = false;
    };
  }, [visible, project, loadMembers]);

  const handleRemoveMember = async (member: ProjectMember) => {
    if (!project) return;

    const displayText = member.email || member.user_id.substring(0, 8) + '...';

    Alert.alert('Remove Member', `Remove ${displayText} from this project?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemovingUserId(member.user_id);
          const { success, error } = await removeUserFromProject(
            userId,
            project.id,
            member.user_id
          );
          setRemovingUserId(null);

          if (success) {
            Alert.alert('Success', 'Member removed from project');
            loadMembers();
          } else {
            Alert.alert('Error', error || 'Failed to remove member');
          }
        },
      },
    ]);
  };

  const handleDisbandProject = () => {
    if (!project) return;

    Alert.alert(
      'Disband Project',
      'Are you sure you want to disband this project? All members will be removed and the project will be deleted. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disband',
          style: 'destructive',
          onPress: async () => {
            setDisbanding(true);
            const { success, error } = await disbandProject(userId, project.id);
            setDisbanding(false);

            if (success) {
              Alert.alert('Success', 'Project disbanded successfully');
              onClose();
              onProjectDisbanded();
            } else {
              Alert.alert('Error', error || 'Failed to disband project');
            }
          },
        },
      ]
    );
  };

  if (!project) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage: {project.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.headerCloseArea}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Members ({members.length})</Text>
            {loadingMembers ? (
              <ActivityIndicator size="large" color="#1D4ED8" style={styles.loader} />
            ) : (
              <FlatList
                data={members}
                keyExtractor={(item) => item.user_id}
                renderItem={({ item }) => {
                  const isCreator = item.user_id === project.created_by;
                  const isRemoving = removingUserId === item.user_id;

                  return (
                    <View style={styles.memberItem}>
                      <View style={styles.memberInfo}>
                        {item.email ? (
                          <Text style={styles.memberEmail}>{item.email}</Text>
                        ) : (
                          <Text style={styles.memberEmail}>{item.user_id.substring(0, 16)}...</Text>
                        )}
                        <Text style={styles.memberDate}>
                          Joined: {new Date(item.joined_at).toLocaleDateString()}
                        </Text>
                        {isCreator && <Text style={styles.memberCreatorBadge}>Creator</Text>}
                      </View>
                      {!isCreator && (
                        <TouchableOpacity
                          style={styles.removeIconButton}
                          onPress={() => handleRemoveMember(item)}
                          disabled={isRemoving}
                        >
                          <Text style={styles.removeIcon}>{isRemoving ? '⏳' : '✕'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No members in this project</Text>
                }
              />
            )}
          </View>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity
              style={styles.disbandButton}
              onPress={handleDisbandProject}
              disabled={disbanding}
            >
              <Text style={styles.disbandButtonText}>
                {disbanding ? 'Disbanding...' : 'Disband Project'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.dangerWarning}>
              This will remove all members and delete the project. This action cannot be undone.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1D4ED8',
  },
  headerCloseArea: {
    padding: 8,
    marginRight: -8,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#F9FAFB' },
  closeButton: { fontSize: 24, color: '#9CA3AF' },
  section: { padding: 16, maxHeight: 300 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#F9FAFB', marginBottom: 12 },
  loader: { marginVertical: 20 },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#111827',
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: { flex: 1 },
  memberEmail: {
    fontSize: 13,
    color: '#60A5FA',
    fontWeight: '500',
    marginBottom: 4,
  },
  memberDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  memberCreatorBadge: {
    fontSize: 10,
    color: '#60A5FA',
    fontWeight: '600',
    marginTop: 6,
  },
  removeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 18,
    color: '#FEE2E2',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginBottom: 6,
    textAlign: 'center',
    padding: 20,
  },
  dangerZone: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#DC2626',
    backgroundColor: '#1A0A0A',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  dangerTitle: { fontSize: 14, fontWeight: '600', color: '#DC2626', marginBottom: 8 },
  disbandButton: {
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  disbandButtonText: { color: '#FEE2E2', fontWeight: '600', fontSize: 14 },
  dangerWarning: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
});

export default ProjectManagementModal;
