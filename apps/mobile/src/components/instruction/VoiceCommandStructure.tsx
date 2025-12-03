import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VoiceCommandStructure = () => (
    <View style={structureStyles.container}>
        <Text style={structureStyles.subtitle}>
            All WaDE observation commands follow a simple format:
        </Text>
        
        {/* Command Format Bar */}
        <View style={structureStyles.formatBar}>
            <Text style={structureStyles.formatText}>Wake Word</Text>
            <Text style={structureStyles.plus}>+</Text>
            <Text style={structureStyles.formatText}>Category</Text>
            <Text style={structureStyles.plus}>+</Text>
            <Text style={structureStyles.formatText}>Description</Text>
        </View>

        {/* Steps */}
        <Step title="1. Wake Word" description='Start every command with "Hey WaDE" to activate the system.' />
        <Step title="2. Category" description="State the type of observation (e.g., Bridge, Wildlife, Landmark, Hazard)." />
        <Step title="3. Description" description="Provide specific details about what you're observing." />
        <Step title="4. Stop Recording" description='When you are finished recording an observation, say "Stop recording".' />
    </View>
);

const Step = ({ title, description }: { title: string, description: string }) => (
    <View style={structureStyles.stepContainer}>
        <Text style={structureStyles.stepTitle}>{title}</Text>
        <Text style={structureStyles.stepDescription}>{description}</Text>
    </View>
);

const structureStyles = StyleSheet.create({
    container: {
        paddingHorizontal: 5,
        paddingVertical: 5,
    },
    subtitle: {
        color: '#cbd5e1',
        marginBottom: 15,
    },
    formatBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#38bdf81a',
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#38bdf8',
    },
    formatText: {
        backgroundColor: '#3b82f6',
        color: '#F9FAFB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        fontWeight: '600',
        fontSize: 14,
    },
    plus: {
        color: '#cbd5e1',
        marginHorizontal: 10,
        fontSize: 18,
    },
    stepContainer: {
        marginBottom: 15,
    },
    stepTitle: {
        backgroundColor: '#1e293b',
        color: '#F9FAFB',
        fontWeight: '700',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        alignSelf: 'flex-start',
        marginBottom: 5,
    },
    stepDescription: {
        color: '#cbd5e1',
        marginLeft: 10,
        fontSize: 16,
    }
});

export default VoiceCommandStructure;
