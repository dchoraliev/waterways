import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { getUserProjects, createProject, joinProjectWithCode } from '../services/projectService';
import type { Project } from '../types/project.types';
import { useTheme } from '../contexts/ThemeContext';
import { AppColors } from '../styles/colors';

interface Props {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  userId: string;
}

const ProjectSelector: React.FC<Props> = ({ selectedProjectId, onSelectProject, userId }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [modalVisible, setModalVisible] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const { data } = await getUserProjects(userId);
    setProjects(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (modalVisible) {
      (async () => {
        await loadProjects();
      })();
    }
  }, [modalVisible, loadProjects]);

  const selectedProject = useMemo<Project | null>(() => {
    if (selectedProjectId && projects.length > 0) {
      return projects.find((p) => p.id === selectedProjectId) || null;
    }
    return null;
  }, [selectedProjectId, projects]);

  const handleSelectProject = (project: Project) => {
    onSelectProject(project.id);
    setModalVisible(false);
  };

  const handleCreateProject = async () => {
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
      loadProjects();
      handleSelectProject(data);
    }
  };

  const handleJoinWithCode = async () => {
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
      loadProjects();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Project (Optional)</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
        <Text style={styles.selectorText}>
          {selectedProject ? selectedProject.name : 'Select a project'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Project</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setModalVisible(false);
                  setCreateModalVisible(true);
                }}
              >
                <Text style={styles.actionButtonText}>+ Create New</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.joinButton]}
                onPress={() => {
                  setModalVisible(false);
                  setJoinModalVisible(true);
                }}
              >
                <Text style={[styles.actionButtonText, styles.joinButtonText]}>Join with Code</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
              <FlatList
                data={projects}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.projectItem,
                      selectedProjectId === item.id && styles.selectedProjectItem,
                    ]}
                    onPress={() => handleSelectProject(item)}
                  >
                    <Text style={styles.projectName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    No projects yet. Create one or join with a code!
                  </Text>
                }
              />
            )}

            <TouchableOpacity
              style={styles.noneButton}
              onPress={() => {
                onSelectProject(null);
                setModalVisible(false);
              }}
            >
              <Text style={styles.noneButtonText}>No Project</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              value={newProjectName}
              onChangeText={setNewProjectName}
              maxLength={50}
              autoFocus
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setNewProjectName('');
                  setCreateModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleCreateProject}
                disabled={creating}
              >
                <Text style={styles.createButtonText}>{creating ? 'Creating...' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setJoinCode('');
                  setJoinModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleJoinWithCode}
                disabled={joining}
              >
                <Text style={styles.createButtonText}>{joining ? 'Joining...' : 'Join'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { marginVertical: 12 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8, color: colors.textMuted },
    selector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 12,
      padding: 12,
    },
    selectorText: { fontSize: 15, color: colors.textPrimary },
    arrow: { fontSize: 12, color: colors.textMuted },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary,
      width: '90%',
      maxHeight: '80%',
    },
    smallModalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.primary,
      padding: 20,
      width: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.primary,
    },
    modalTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 0 },
    closeButton: { fontSize: 24, color: colors.textMuted },
    actionButtons: { flexDirection: 'row', padding: 16, gap: 8 },
    actionButton: {
      flex: 1,
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    joinButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
    actionButtonText: { color: colors.background, fontWeight: '600', fontSize: 13 },
    joinButtonText: { color: colors.primary },
    loader: { marginVertical: 32 },
    projectItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.primary,
    },
    selectedProjectItem: { backgroundColor: colors.primarySoft },
    projectName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    emptyText: { textAlign: 'center', color: colors.textMuted, padding: 32, fontSize: 13 },
    noneButton: {
      margin: 16,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    noneButtonText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
    input: {
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 15,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    buttonRow: { flexDirection: 'row', gap: 8 },
    button: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
    createButton: { backgroundColor: colors.primary },
    createButtonText: { color: colors.background, fontWeight: '600', fontSize: 13 },
  });

export default ProjectSelector;
