import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ClassifierTag from './ClassifierTag'; 

const ObservationClassifiers = () => (
    <View style={classifierStyles.container}>
        <Text style={classifierStyles.subtitle}>Available tags to classify your observations</Text>
        
        {/* Infrastructure */}
        <View style={classifierStyles.category}>
            <Text style={classifierStyles.categoryTitle}>Infrastructure</Text>
            <View style={classifierStyles.tagList}>
                {['Bridge', 'Power Line', 'Boat Launch', 'Dam', 'Water Withdrawal', 'Pipe', 'Inlet', 'Shoreline', 'Old Infrastructure'].map(tag => (
                    <ClassifierTag key={tag} label={tag} color="#bbf7d0" /> 
                ))}
            </View>
        </View>

        {/* Environmental */}
        <View style={classifierStyles.category}>
            <Text style={classifierStyles.categoryTitle}>Environmental</Text>
            <View style={classifierStyles.tagList}>
                {['Erosion', 'Algae', 'Aquatic Invasive', 'Terrestrial Invasive', 'Water Quality', 'Foam', 'Bottom', 'Odor', 'Trash', 'Junk'].map(tag => (
                    <ClassifierTag key={tag} label={tag} color="#a5f3fc" />
                ))}
            </View>
        </View>

        {/* Wildlife */}
        <View style={classifierStyles.category}>
            <Text style={classifierStyles.categoryTitle}>Wildlife</Text>
            <View style={classifierStyles.tagList}>
                {['Bird', 'Bird Call', 'Sound', 'Fish', 'Mammal', 'Wetland'].map(tag => (
                    <ClassifierTag key={tag} label={tag} color="#e9d5ff" />
                ))}
            </View>
        </View>

        {/* Hazards */}
        <View style={classifierStyles.category}>
            <Text style={classifierStyles.categoryTitle}>Hazards</Text>
            <View style={classifierStyles.tagList}>
                {['Obstruction'].map(tag => (
                    <ClassifierTag key={tag} label={tag} color="#fed7aa" /> 
                ))}
            </View>
        </View>

        {/* General */}
        <View style={classifierStyles.category}>
            <Text style={classifierStyles.categoryTitle}>General</Text>
            <View style={classifierStyles.tagList}>
                {['Time', 'Comment'].map(tag => (
                    <ClassifierTag key={tag} label={tag} color="#bfdbfe" /> 
                ))}
            </View>
        </View>

        <View style={classifierStyles.noteBox}>
            <Text style={classifierStyles.noteText}>
                Simply say the classifier name after your wake word to tag your observation. Multiple classifiers can be added to a single observation.
            </Text>
        </View>
    </View>
);

const classifierStyles = StyleSheet.create({
    container: {
        paddingTop: 10,
        paddingBottom: 5,
    },
    subtitle: {
        color: '#cbd5e1',
        marginBottom: 15,
        fontSize: 16,
    },
    category: {
        marginBottom: 15,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F9FAFB',
        marginBottom: 8,
    },
    tagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    noteBox: {
        marginTop: 15,
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#3b82f6', 
    },
    noteText: {
        color: '#F9FAFB',
        fontSize: 14,
        lineHeight: 20,
    }
});

export default ObservationClassifiers;