import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  isDefaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, isDefaultOpen = false }) => {
  const [isExpanded, setIsExpanded] = useState(isDefaultOpen);

  return (
    <View style={accordionStyles.section}>
      <TouchableOpacity 
        style={accordionStyles.header} 
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <Text style={accordionStyles.sectionTitle}>{title}</Text>
        <MaterialIcons 
          name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
          size={30} 
          color="#38bdf8" 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={accordionStyles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const accordionStyles = StyleSheet.create({
  section: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden', 
    backgroundColor: '#0f172a', 
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#1e293b', 
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#38bdf8',
  },
  content: {
    paddingTop: 15,
    paddingBottom: 5,
  }
});

export default Accordion;
