import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_COLOR } from '../constants/colors';

export interface MemorandaData {
  memoranda: string;
}

const MemorandaForm: React.FC = () => {
  const { control, formState: { errors }, setValue } = useFormContext();

  const DEFAULT_MEMORANDA_TEXT = 'APPRAISED AND ASSESSED PURSUANT TO SECTION 201 OF R.A. 7160-6TH GENERAL REVISION, AND PER ACTUAL INSPECTION (CARAVAN). NOTE: THIS BUILDING IS CONSTRUCTED ON THE LOT OF .';

  const fillDefaultMemorandum = () => {
    setValue('memoranda.memoranda', DEFAULT_MEMORANDA_TEXT);
  };

  const renderInput = (
    name: string,
    label: string,
    placeholder?: string,
    keyboardType: 'default' | 'numeric' | 'phone-pad' = 'default',
    multiline = false
  ) => {
    const error = (errors as any)?.memoranda?.memoranda;

    return (
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">
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
              className={`border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white ${multiline ? 'h-32' : 'h-12'
                } ${error ? 'border-red-500' : 'border-gray-300'}`}
              keyboardType={keyboardType}
              multiline={multiline}
              textAlignVertical={multiline ? 'top' : 'center'}
              placeholderTextColor="#999"
              numberOfLines={multiline ? 6 : 1}
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
      <View className="flex-row items-center justify-between mb-4 p-3 bg-yellow-100 rounded-lg border-l-4" style={{ borderLeftColor: PRIMARY_COLOR }}>
        <Text className="text-lg font-bold" style={{ color: PRIMARY_COLOR }}>MEMORANDA</Text>
        <Icon name="description" size={24} style={{ color: PRIMARY_COLOR }} />
      </View>

      <View className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-rubik-medium text-black-300">MEMORANDA:</Text>
          <TouchableOpacity
            onPress={fillDefaultMemorandum}
            className="bg-blue-500 px-3 py-2 rounded-lg flex-row items-center"
            activeOpacity={0.7}
          >
            <Icon name="auto-fix-high" size={16} color="#ffffff" style={{ marginRight: 4 }} />
            <Text className="text-white text-xs font-rubik-medium">Fill Default</Text>
          </TouchableOpacity>
        </View>

        {renderInput(
          'memoranda.memoranda',
          'Memoranda',
          'Enter memoranda or use Fill Default button...',
          'default',
          true
        )}
      </View>
    </View>
  );
};

export default MemorandaForm;
