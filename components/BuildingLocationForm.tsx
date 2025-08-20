import { 
  View, 
  Text, 
  TextInput
} from 'react-native'
import React from 'react'

interface BuildingLocationFormProps {
  locationData: {
    street: string;
    barangay: string;
    municipality: string;
    province: string;
  };
  onLocationChange: (field: string, value: string) => void;
}

const BuildingLocationForm: React.FC<BuildingLocationFormProps> = ({
  locationData,
  onLocationChange,
}) => {
  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    keyboardType: 'default' | 'numeric' | 'phone-pad' = 'default'
  ) => (
    <View className="mb-4">
      <Text className="text-base font-rubik-medium text-black-300 mb-2">
        {label} <Text className="text-red-500">*</Text>
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className="border border-gray-300 rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white h-12"
        keyboardType={keyboardType}
        textAlignVertical="center"
      />
    </View>
  );

  return (
    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
      <Text className="text-lg font-rubik-bold text-black-300 mb-4">Building Location</Text>
      
      {renderInput('No. / Street', locationData.street, (text) => onLocationChange('street', text), 'House/Building No. and Street')}
      
      {renderInput('Barangay', locationData.barangay, (text) => onLocationChange('barangay', text), 'Barangay name')}
      
      {renderInput('Municipality', locationData.municipality, (text) => onLocationChange('municipality', text), 'Municipality/City name')}
      
      {renderInput('Province', locationData.province, (text) => onLocationChange('province', text), 'Province name')}
    </View>
  );
};

export default BuildingLocationForm;