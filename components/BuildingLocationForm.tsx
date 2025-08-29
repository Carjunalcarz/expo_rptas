import { View, Text, TextInput } from 'react-native';
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_COLOR } from '@/constants/colors';

const BuildingLocationForm: React.FC = () => {
  const { control, formState: { errors } } = useFormContext();

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
            }
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
        <Text className="text-lg font-bold text-gray-800">BUILDING LOCATION</Text>
        <Icon name="assessment" size={24} color="#2c3e50" />
      </View>

      {renderInput('building_location.street', 'No. / Street', 'House/Building No. and Street')}
      {renderInput('building_location.barangay', 'Barangay', 'Barangay name')}
      {renderInput('building_location.municipality', 'Municipality', 'Municipality/City name')}
      {renderInput('building_location.province', 'Province', 'Province name')}
    </View>
  );
};

export default BuildingLocationForm;