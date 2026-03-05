import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  isDefaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, isDefaultOpen = false }) => {
  const [isExpanded, setIsExpanded] = useState(isDefaultOpen);
  const { colors } = useTheme();
  const accordionStyles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginBottom: 20,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 15,
          paddingHorizontal: 15,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: 'transparent',
        },
        sectionTitle: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.primary,
        },
        content: {
          paddingTop: 15,
          paddingBottom: 5,
        },
      }),
    [colors]
  );

  return (
    <View style={accordionStyles.section}>
      <TouchableOpacity
        style={accordionStyles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <Text style={accordionStyles.sectionTitle}>{title}</Text>
        <MaterialIcons
          name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={30}
          color={colors.primary}
        />
      </TouchableOpacity>

      {isExpanded && <View style={accordionStyles.content}>{children}</View>}
    </View>
  );
};

export default Accordion;
