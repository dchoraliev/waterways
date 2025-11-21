import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share
} from 'react-native';
// Note: Ensure projectService and project.types are correctly imported
import { getUserProjects, leaveProject } from '../services/projectService'; 
import type { Project } from '../types/project.types';

interface Props {
  userId: string; // Pass this from your auth context or navigation params
}

const MyProjectsScreen: React.FC<Props> = ({ userId }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 💡 FIX: Use useCallback to stabilize the loadProjects function
  const loadProjects = useCallback(async () => {
    console.log('loadProjects called');
    setLoading(true);
    try {
      console.log('Fetching projects for userId:', userId);
      const { data, error } = await getUserProjects(userId);
      console.log('Projects fetched:', { data, error });
      
      if (error) {
        console.error('Error loading projects:', error);
      }
      setProjects(data || []);
    } catch (err) {
      console.error('Exception loading projects:', err);
    } finally {
      setLoading(false);
      console.log('Loading set to false');
    }
  }, [userId]); // Dependency: loadProjects only changes when userId changes

  useEffect(() => {
    // 💡 FIX: This is now safe because loadProjects is wrapped in useCallback
    if (userId) {
      loadProjects();
    } else {
      setLoading(false);
    }
  }, [loadProjects, userId]);


  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
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
    Alert.alert(
      'Leave Project',
      `Are you sure you want to leave "${project.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const { error } = await leaveProject(userId, project.id);
            if (error) {
              Alert.alert('Error', 'Failed to leave project');
            } else {
              Alert.alert('Success', 'Left project successfully');
              loadProjects();
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Projects</Text>
      
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectName}>{item.name}</Text>
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
              <TouchableOpacity
                style={[styles.button, styles.leaveButton]}
                onPress={() => handleLeaveProject(item)}
              >
                <Text style={styles.leaveButtonText}>Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>
              Create or join a project to get started
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9FAFB',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    textAlign: 'center',
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
  projectHeader: { marginBottom: 12 },
  projectName: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#F9FAFB',
    marginBottom: 8,
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
  leaveButton: { 
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  leaveButtonText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 64 },
  emptyText: { fontSize: 15, color: '#F9FAFB', marginBottom: 6 },
  emptySubtext: { fontSize: 12, color: '#9CA3AF' },
});

export default MyProjectsScreen;
