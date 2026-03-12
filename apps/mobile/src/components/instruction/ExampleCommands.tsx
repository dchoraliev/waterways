import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, TextStyle, ViewStyle } from 'react-native';
import ClassifierTag from './ClassifierTag'; // Adjust path if necessary
import { useTheme } from '../../contexts/ThemeContext';

// 1. Define the props interface explicitly
interface ExampleItemProps {
  tagLabel: string;
  tagColor: string;
  command: string;
  itemContainerStyle: StyleProp<ViewStyle>;
  commandTextStyle: StyleProp<TextStyle>;
}

// 2. Refactor ExampleItem to use the new interface
const ExampleItem: React.FC<ExampleItemProps> = ({
  tagLabel,
  tagColor,
  command,
  itemContainerStyle,
  commandTextStyle,
}) => (
  <View style={itemContainerStyle}>
    <ClassifierTag label={tagLabel} color={tagColor} />
    <Text style={commandTextStyle}>&quot;{command}&quot;</Text>
  </View>
);

const ExampleCommands = () => {
  const { colors } = useTheme();
  const exampleStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: 15,
          paddingVertical: 5,
        },
        subtitle: {
          color: colors.textMuted,
          marginBottom: 15,
          fontSize: 16,
        },
        itemContainer: {
          marginBottom: 15,
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
          paddingLeft: 10,
        },
        commandText: {
          color: colors.textPrimary,
          fontSize: 16,
          marginTop: 5,
          lineHeight: 22,
        },
      }),
    [colors]
  );

  return (
    <View style={exampleStyles.container}>
      <Text style={exampleStyles.subtitle}>Using observation classifiers in real scenarios</Text>

      {/* Examples */}
      <ExampleItem
        tagLabel="Bridge"
        tagColor="#bbf7d0"
        command="Hey WaDE, start recording. Bridge. I see the Interstate 80 bridge."
        itemContainerStyle={exampleStyles.itemContainer}
        commandTextStyle={exampleStyles.commandText}
      />
      <ExampleItem
        tagLabel="Dam"
        tagColor="#bbf7d0"
        command="Hey WaDE, start recording. Dam. Small hydroelectric dam at 2 o&rsquo;clock."
        itemContainerStyle={exampleStyles.itemContainer}
        commandTextStyle={exampleStyles.commandText}
      />
      <ExampleItem
        tagLabel="Bird"
        tagColor="#e9d5ff"
        command="Hey WaDE, start recording. Bird. Great blue heron spotted on the left bank."
        itemContainerStyle={exampleStyles.itemContainer}
        commandTextStyle={exampleStyles.commandText}
      />
      <ExampleItem
        tagLabel="Mammal"
        tagColor="#e9d5ff"
        command="Hey WaDE, start recording. Mammal. River otter swimming at 10 o&rsquo;clock."
        itemContainerStyle={exampleStyles.itemContainer}
        commandTextStyle={exampleStyles.commandText}
      />
      <ExampleItem
        tagLabel="Erosion"
        tagColor="#a5f3fc"
        command="Hey WaDE, start recording. Erosion. Significant bank erosion on right side."
        itemContainerStyle={exampleStyles.itemContainer}
        commandTextStyle={exampleStyles.commandText}
      />
      <ExampleItem
        tagLabel="Water Quality"
        tagColor="#a5f3fc"
        command="Hey WaDE, start recording. Water Quality. Water appears murky and brown."
        itemContainerStyle={exampleStyles.itemContainer}
        commandTextStyle={exampleStyles.commandText}
      />
      <ExampleItem
        tagLabel="Obstruction"
        tagColor="#fed7aa"
        command="Hey WaDE, start recording. Obstruction. Fallen tree blocking right channel."
        itemContainerStyle={exampleStyles.itemContainer}
        commandTextStyle={exampleStyles.commandText}
      />
      <ExampleItem
        tagLabel="Comment"
        tagColor="#bfdbfe"
        command="Hey WaDE, start recording. Comment. Beautiful day for paddling, calm waters."
        itemContainerStyle={exampleStyles.itemContainer}
        commandTextStyle={exampleStyles.commandText}
      />
    </View>
  );
};

export default ExampleCommands;
