import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ClassifierTag from './ClassifierTag'; // Adjust path if necessary

const ExampleCommands = () => (
    <View style={exampleStyles.container}>
        <Text style={exampleStyles.subtitle}>
            Using observation classifiers in real scenarios
        </Text>
        
        {/* Examples */}
        <ExampleItem tagLabel="Bridge" tagColor="#bbf7d0" command='Hey WaDE. Bridge. I see the Interstate 80 bridge.' />
        <ExampleItem tagLabel="Dam" tagColor="#bbf7d0" command='Hey WaDE. Dam. Small hydroelectric dam at 2 o’clock.' />
        <ExampleItem tagLabel="Bird" tagColor="#e9d5ff" command='Hey WaDE. Bird. Great blue heron spotted on the left bank.' />
        <ExampleItem tagLabel="Mammal" tagColor="#e9d5ff" command='Hey WaDE. Mammal. River otter swimming at 10 o’clock.' />
        <ExampleItem tagLabel="Erosion" tagColor="#a5f3fc" command='Hey WaDE. Erosion. Significant bank erosion on right side.' />
        <ExampleItem tagLabel="Water Quality" tagColor="#a5f3fc" command='Hey WaDE. Water Quality. Water appears murky and brown.' />
        <ExampleItem tagLabel="Obstruction" tagColor="#fed7aa" command='Hey WaDE. Obstruction. Fallen tree blocking right channel.' />
        <ExampleItem tagLabel="Comment" tagColor="#bfdbfe" command='Hey WaDE. Comment. Beautiful day for paddling, calm waters.' />
        
    </View>
);

const ExampleItem = ({ tagLabel, tagColor, command }: { tagLabel: string, tagColor: string, command: string }) => (
    <View style={exampleStyles.itemContainer}>
        <ClassifierTag label={tagLabel} color={tagColor} />
        <Text style={exampleStyles.commandText}>"{command}"</Text>
    </View>
);

const exampleStyles = StyleSheet.create({
    container: {
        padding: 5,
    },
    subtitle: {
        color: '#cbd5e1',
        marginBottom: 15,
        fontSize: 16,
    },
    itemContainer: {
        marginBottom: 15,
        borderLeftWidth: 3,
        borderLeftColor: '#38bdf8',
        paddingLeft: 10,
    },
    commandText: {
        color: '#F9FAFB',
        fontSize: 16,
        marginTop: 5,
        lineHeight: 22,
    }
});

export default ExampleCommands;