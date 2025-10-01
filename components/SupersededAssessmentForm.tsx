import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import { MaterialIcons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_COLOR } from '../constants/colors';

export interface SupersededAssessmentData {
  // Header information
  dateOfEntry: string;
  
  // Record of Superseded Assessment section
  pin: string;
  tdArpNo: string;
  newValue: string; // "NEW" field
  totalAssessedValue: string;
  previousOwner: string;
  effectivityOfAssessment: string;
  date: string;
  recordingPersonnel: string;
  
  // Table sections
  assessment: string;
  taxMapping: string;
  records: string;
}

const SupersededAssessmentForm: React.FC = () => {
  const { control, formState: { errors } } = useFormContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const renderInput = (
    name: string,
    label: string,
    placeholder?: string,
    keyboardType: 'default' | 'numeric' | 'phone-pad' = 'default',
    multiline = false
  ) => {
    const error = (errors as any)?.superseded_assessment?.[name.split('.').pop() || ''];

    return (
      <View className="mb-4">
        <Text className="text-sm font-rubik-medium text-black-300 mb-2">
          {label}
        </Text>
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              className={`border rounded-lg px-4 py-3 text-sm font-rubik text-black-300 bg-white ${multiline ? 'h-20' : 'h-12'
                } ${error ? 'border-red-500' : 'border-gray-300'}`}
              keyboardType={keyboardType}
              multiline={multiline}
              textAlignVertical={multiline ? 'top' : 'center'}
              placeholderTextColor="#999"
            />
          )}
        />
        {error && (
          <Text className="text-red-500 text-sm font-rubik mt-1">
            {error.message as string}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
      <TouchableOpacity 
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
        className="mb-4"
      >
        <View className="flex-row items-center justify-between p-3 bg-blue-100 rounded-lg border-l-4" style={{ borderLeftColor: PRIMARY_COLOR }}>
          <View className="flex-row items-center">
            <Text className="text-lg font-bold mr-2" style={{ color: PRIMARY_COLOR }}>
              RECORD OF SUPERSEDED ASSESSMENT
            </Text>
            <Text className="text-sm text-gray-500 italic">(Optional)</Text>
          </View>
          <View className="flex-row items-center">
            <Icon name="assessment" size={24} style={{ color: PRIMARY_COLOR }} />
            <MaterialIcons 
              name={isExpanded ? "expand-less" : "expand-more"} 
              size={24} 
              color={PRIMARY_COLOR} 
              style={{ marginLeft: 8 }}
            />
          </View>
        </View>
        {!isExpanded && (
          <Text className="text-center text-gray-500 text-sm mt-2 italic">
            Tap to add superseded assessment record
          </Text>
        )}
      </TouchableOpacity>
      
      {isExpanded && (
        <View>
          {/* Record of Superseded Assessment Section */}
          <View className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Text className="text-lg font-rubik-bold text-black-300 mb-4 text-center">RECORD OF SUPERSEDED ASSESSMENT</Text>
            
            {renderInput('superseded_assessment.dateOfEntry', 'Date of Entry in the Record of Assessment', 'Enter date')}
            
            {renderInput('superseded_assessment.pin', 'PIN')}
            
            {renderInput('superseded_assessment.tdArpNo', 'TD / ARP No.')}

            {renderInput('superseded_assessment.newValue', 'NEW', 'NEW')}
            
            {renderInput('superseded_assessment.totalAssessedValue', 'Total Assessed Value', '0.00', 'numeric')}

            {renderInput('superseded_assessment.previousOwner', 'Previous Owner')}

            {renderInput('superseded_assessment.effectivityOfAssessment', 'Effectivity of Assessment')}
            
            {renderInput('superseded_assessment.date', 'Date')}

            {renderInput('superseded_assessment.recordingPersonnel', 'Recording Personnel')}
          </View>

          {/* Table Section */}
          <View className="mt-4">
            <View className="flex-row bg-gray-100 border border-gray-300">
              <View className="flex-1 p-3 border-r border-gray-300">
                <Text className="text-sm font-rubik-medium text-center text-black-300">Assessment</Text>
              </View>
              <View className="flex-1 p-3 border-r border-gray-300">
                <Text className="text-sm font-rubik-medium text-center text-black-300">Tax Mapping</Text>
              </View>
              <View className="flex-1 p-3">
                <Text className="text-sm font-rubik-medium text-center text-black-300">Records</Text>
              </View>
            </View>

            <View className="flex-row border-l border-r border-b border-gray-300 min-h-24">
              <View className="flex-1 border-r border-gray-300 p-2">
                <Controller
                  control={control}
                  name="superseded_assessment.assessment"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value || ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Enter assessment details"
                      className="text-sm font-rubik text-black-300 h-20"
                      multiline
                      textAlignVertical="top"
                      placeholderTextColor="#999"
                    />
                  )}
                />
              </View>
              <View className="flex-1 border-r border-gray-300 p-2">
                <Controller
                  control={control}
                  name="superseded_assessment.taxMapping"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value || ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Enter tax mapping details"
                      className="text-sm font-rubik text-black-300 h-20"
                      multiline
                      textAlignVertical="top"
                      placeholderTextColor="#999"
                    />
                  )}
                />
              </View>
              <View className="flex-1 p-2">
                <Controller
                  control={control}
                  name="superseded_assessment.records"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value || ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Enter record details"
                      className="text-sm font-rubik text-black-300 h-20"
                      multiline
                      textAlignVertical="top"
                      placeholderTextColor="#999"
                    />
                  )}
                />
              </View>
            </View>
          </View>

        </View>
      )}
    </View>
  );
};

export default SupersededAssessmentForm;
