import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const VoiceCommandStructure = () => {
  const { colors } = useTheme();
  const structureStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: 15,
          paddingVertical: 5,
        },
        subtitle: {
          color: colors.textMuted,
          marginBottom: 15,
        },
        formatBar: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 15,
          backgroundColor: colors.primarySoft,
          borderRadius: 8,
          marginBottom: 20,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
        },
        formatText: {
          backgroundColor: colors.primary,
          color: colors.background,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 5,
          fontWeight: '600',
          fontSize: 13,
        },
        plus: {
          color: colors.textMuted,
          marginHorizontal: 7,
          fontSize: 16,
        },
        stepContainer: {
          marginBottom: 15,
        },
        stepTitle: {
          backgroundColor: colors.surface,
          color: colors.textPrimary,
          fontWeight: '700',
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 5,
          alignSelf: 'flex-start',
          marginBottom: 5,
        },
        stepDescription: {
          color: colors.textMuted,
          marginLeft: 10,
          fontSize: 16,
        },
      }),
    [colors]
  );

  return (
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
      <Step
        title="1. Wake Word"
        description='Start every command with "Hey WaDE start recording" to activate the system.'
        containerStyle={structureStyles.stepContainer}
        titleStyle={structureStyles.stepTitle}
        descriptionStyle={structureStyles.stepDescription}
      />
      <Step
        title="2. Category"
        description="State the type of observation (e.g., Bridge, Wildlife, Landmark, Hazard)."
        containerStyle={structureStyles.stepContainer}
        titleStyle={structureStyles.stepTitle}
        descriptionStyle={structureStyles.stepDescription}
      />
      <Step
        title="3. Description"
        description="Provide specific details about what you're observing."
        containerStyle={structureStyles.stepContainer}
        titleStyle={structureStyles.stepTitle}
        descriptionStyle={structureStyles.stepDescription}
      />
      <Step
        title="4. Stop Recording"
        description="Each observation ends after 15 seconds have passed."
        containerStyle={structureStyles.stepContainer}
        titleStyle={structureStyles.stepTitle}
        descriptionStyle={structureStyles.stepDescription}
      />
      <Step
        title="5. Add Media"
        description="Optionally, add photos or videos to your observation by pressing take photo or video button within 10 seconds of finishing your voice command."
        containerStyle={structureStyles.stepContainer}
        titleStyle={structureStyles.stepTitle}
        descriptionStyle={structureStyles.stepDescription}
      />
    </View>
  );
};

const Step = ({
  title,
  description,
  containerStyle,
  titleStyle,
  descriptionStyle,
}: {
  title: string;
  description: string;
  containerStyle: StyleProp<ViewStyle>;
  titleStyle: StyleProp<TextStyle>;
  descriptionStyle: StyleProp<TextStyle>;
}) => (
  <View style={containerStyle}>
    <Text style={titleStyle}>{title}</Text>
    <Text style={descriptionStyle}>{description}</Text>
  </View>
);

export default VoiceCommandStructure;
