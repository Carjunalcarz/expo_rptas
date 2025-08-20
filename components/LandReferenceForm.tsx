import { 
  View, 
  Text, 
  TextInput
} from 'react-native'
import React from 'react'

interface LandReferenceFormProps {
  landData: {
    owner: string;
    titleNumber: string;
    lotNumber: string;
    blockNumber: string;
    surveyNumber: string;
    tdnArpNumber: string;
    area: string;
  };
  onLandChange: (field: string, value: string) => void;
}

const LandReferenceForm: React.FC<LandReferenceFormProps> = ({
  landData,
  onLandChange,
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
      <Text className="text-lg font-rubik-bold text-black-300 mb-4">Land Reference</Text>
      
      {renderInput('Owner', landData.owner, (text) => onLandChange('owner', text), 'Land owner name')}
      
      {renderInput('OCT/TCT/CLOA/CSC No.', landData.titleNumber, (text) => onLandChange('titleNumber', text), 'Title number')}
      
      {renderInput('Lot No.', landData.lotNumber, (text) => onLandChange('lotNumber', text), 'Lot number', 'numeric')}
      
      {renderInput('Block No.', landData.blockNumber, (text) => onLandChange('blockNumber', text), 'Block number', 'numeric')}
      
      {renderInput('Survey No.', landData.surveyNumber, (text) => onLandChange('surveyNumber', text), 'Survey number')}
      
      {renderInput('TDN/ARP No.', landData.tdnArpNumber, (text) => onLandChange('tdnArpNumber', text), 'Tax Declaration/Assessment Roll Page number')}
      
      {renderInput('Area', landData.area, (text) => onLandChange('area', text), 'Area in square meters', 'numeric')}
    </View>
  );
};

export default LandReferenceForm;