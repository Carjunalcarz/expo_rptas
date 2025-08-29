import {
  View,
  Text,
  TextInput
} from 'react-native'
import React from 'react'
import { useForm, Controller, useFormContext } from 'react-hook-form'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_COLOR } from '@/constants/colors';

// Validation utility
const validationRules = {
  required: (label: string) => ({
    required: `${label} is required`,
    minLength: {
      value: 1,
      message: `${label} cannot be empty`
    }
  }),
  numeric: (label: string) => ({
    pattern: {
      value: /^[0-9-]+$/,
      message: `${label} must be a valid number`
    }
  }),
  phone: (label: string) => ({
    pattern: {
      value: /^[0-9+\-\s()]+$/,
      message: `${label} must be a valid phone number`
    }
  })
};

const LandReferenceForm: React.FC = () => {
  const { control, watch, formState: { errors } } = useFormContext();
  // Helper function to get nested errors
  const getError = (path: string) => {
    const pathParts = path.split('.');
    let current: any = errors;

    for (const part of pathParts) {
      if (!current) return undefined;
      current = current[part];
    }

    return current;
  };



  const renderInput = (
    name: string,
    label: string,
    placeholder?: string,
    keyboardType: 'default' | 'numeric' | 'phone-pad' = 'default',
    multiline = false,
    rules?: any
  ) => {
    const error = getError(name);

    return (
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">
          {label} <Text className="text-red-500">*</Text>
        </Text>
        <Controller
          control={control}
          name={name}
          rules={rules || {
            required: `${label} is required`,
            minLength: {
              value: 1,
              message: `${label} cannot be empty`
            },
            ...(keyboardType === 'numeric' && validationRules.numeric(label)),
            ...(keyboardType === 'phone-pad' && validationRules.phone(label))
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              className={`border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white ${multiline ? 'h-20' : 'h-12'
                } ${error ? 'border-red-500' : 'border-gray-300'}`}
              keyboardType={keyboardType}
              multiline={multiline}
              textAlignVertical={multiline ? 'top' : 'center'}
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
      <View className="flex-row items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg border-l-4" style={{ borderLeftColor: PRIMARY_COLOR }}>
        <Text className="text-lg font-bold text-gray-800">LAND REFERENCE</Text>
        <Icon name="assessment" size={24} color="#2c3e50" />
      </View>

      {renderInput('land_reference.owner', 'Owner', 'Land owner name')}

      {renderInput('land_reference.titleNumber', 'OCT/TCT/CLOA/CSC No.', 'Title number')}

      {renderInput('land_reference.lotNumber', 'Lot No.', 'Lot number', 'numeric')}

      {renderInput('land_reference.blockNumber', 'Block No.', 'Block number', 'numeric')}

      {renderInput('land_reference.surveyNumber', 'Survey No.', 'Survey number')}

      {renderInput('land_reference.tdnArpNumber', 'TDN/ARP No.', 'Tax Declaration/Assessment Roll Page number')}

      {renderInput('land_reference.area', 'Area', 'Area in square meters', 'numeric')}
    </View>
  );
};

export default LandReferenceForm;