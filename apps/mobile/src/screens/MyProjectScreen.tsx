import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { leaveProject, createProject, joinProjectWithCode } from '../services/projectService';
import type { Project } from '../types/project.types';

import { useAuth } from '../hooks/useAuth';
import { useUserProjects } from '../hooks/useUserProjects';
import ProjectManagementModal from '../components/ProjectManagementModal';

const MyProjectsScreen: React.FC = () => {
  const router = useRouter();
  const { userId, loading: authLoading } = useAuth();
  const {
    projects,
    loading: projectsLoading,
    refreshing,
    loadProjects,
    handleRefresh: handleProjectsRefresh,
  } = useUserProjects();

  const [managingProject, setManagingProject] = useState<Project | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const loading = authLoading || projectsLoading;

  useEffect(() => {
    if (userId) {
      loadProjects(userId);
    }
  }, [userId, loadProjects]);

  const handleRefresh = async () => {
    if (userId) {
      await handleProjectsRefresh(userId);
    }
  };

  const handleCreateProject = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!newProjectName.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    setCreating(true);
    const { data, error } = await createProject(newProjectName.trim(), userId);
    setCreating(false);

    if (error) {
      Alert.alert('Error', 'Failed to create project');
    } else if (data) {
      Alert.alert('Success', `Project created!\nJoin Code: ${data.join_code}`);
      setNewProjectName('');
      setCreateModalVisible(false);
      loadProjects(userId);
    }
  };

  const handleJoinWithCode = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a join code');
      return;
    }

    setJoining(true);
    const { success, error } = await joinProjectWithCode(userId, joinCode.trim());
    setJoining(false);

    if (!success) {
      Alert.alert('Error', error || 'Failed to join project');
    } else {
      Alert.alert('Success', 'Joined project successfully!');
      setJoinCode('');
      setJoinModalVisible(false);
      loadProjects(userId);
    }
  };

  const handleShareCode = async (project: Project) => {
    try {
      await Share.share({
        message: `Join my project "${project.name}" on Waterways!\n\nJoin Code: ${project.join_code}`,
        title: 'Share Project Code',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLeaveProject = (project: Project) => {
    Alert.alert('Leave Project', `Are you sure you want to leave "${project.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          if (userId) {
            const { error } = await leaveProject(userId, project.id);
            if (error) {
              Alert.alert('Error', 'Failed to leave project');
            } else {
              Alert.alert('Success', 'Left project successfully');
              loadProjects(userId);
            }
          } else {
            Alert.alert('Error', 'User not authenticated.');
          }
        },
      },
    ]);
  };

  if (loading || !userId) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  const isCreator = (project: Project) => project.created_by === userId;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>‹ Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>My Projects</Text>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.createButton]}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>+ Create Project</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.joinButton]}
          onPress={() => setJoinModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Join with Code</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectName}>{item.name}</Text>
              {isCreator(item) && <Text style={styles.creatorBadge}>Creator</Text>}
            </View>

            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Join Code:</Text>
              <Text style={styles.code}>{item.join_code}</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.shareButton]}
                onPress={() => handleShareCode(item)}
              >
                <Text style={styles.shareButtonText}>Share Code</Text>
              </TouchableOpacity>
              {isCreator(item) ? (
                <TouchableOpacity
                  style={[styles.button, styles.manageButton]}
                  onPress={() => setManagingProject(item)}
                >
                  <Text style={styles.manageButtonText}>Manage</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.leaveButton]}
                  onPress={() => handleLeaveProject(item)}
                >
                  <Text style={styles.leaveButtonText}>Leave</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>Create or join a project to get started</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Create Project Modal */}
      <Modal
        visible={createModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContent}>
            <Text style={styles.modalTitle}>Create Project</Text>
            <TextInput
              style={styles.input}
              placeholder="Project Name"
              placeholderTextColor="#9CA3AF"
              value={newProjectName}
              onChangeText={setNewProjectName}
              maxLength={50}
              autoFocus
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewProjectName('');
                  setCreateModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreateProject}
                disabled={creating}
              >
                <Text style={styles.confirmButtonText}>{creating ? 'Creating...' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Project Modal */}
      <Modal
        visible={joinModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContent}>
            <Text style={styles.modalTitle}>Join Project</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 8-character code"
              placeholderTextColor="#9CA3AF"
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setJoinCode('');
                  setJoinModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleJoinWithCode}
                disabled={joining}
              >
                <Text style={styles.confirmButtonText}>{joining ? 'Joining...' : 'Join'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ProjectManagementModal
        visible={!!managingProject}
        project={managingProject}
        userId={userId}
        onClose={() => setManagingProject(null)}
        onProjectDisbanded={() => {
          setManagingProject(null);
          if (userId) loadProjects(userId);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: {
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 10,
  },
  backButtonText: {
    color: '#60A5FA',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#1D4ED8',
  },
  joinButton: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  actionButtonText: {
    color: '#E5F2FF',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: { paddingHorizontal: 24, paddingBottom: 24 },
  projectCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    backgroundColor: '#020617',
    padding: 16,
    marginBottom: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  creatorBadge: {
    fontSize: 10,
    color: '#60A5FA',
    fontWeight: '600',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  codeContainer: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeLabel: { fontSize: 12, color: '#9CA3AF' },
  code: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#60A5FA',
  },
  buttonRow: { flexDirection: 'row', gap: 8 },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#1D4ED8',
  },
  shareButtonText: { color: '#E5F2FF', fontWeight: '600', fontSize: 13 },
  manageButton: {
    backgroundColor: '#7C3AED',
  },
  manageButtonText: { color: '#E5F2FF', fontWeight: '600', fontSize: 13 },
  leaveButton: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  leaveButtonText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 64 },
  emptyText: { fontSize: 15, color: '#F9FAFB', marginBottom: 6 },
  emptySubtext: { fontSize: 12, color: '#9CA3AF' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallModalContent: {
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#1D4ED8',
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#F9FAFB',
    marginBottom: 16,
  },
  modalButtonRow: { flexDirection: 'row', gap: 8 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  cancelButtonText: { color: '#9CA3AF', fontWeight: '600', fontSize: 14 },
  confirmButton: { backgroundColor: '#1D4ED8' },
  confirmButtonText: { color: '#E5F2FF', fontWeight: '600', fontSize: 14 },
});

export default MyProjectsScreen;
