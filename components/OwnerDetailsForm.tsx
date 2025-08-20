import { 
  View, 
  Text, 
  TextInput, 
  Switch
} from 'react-native'
import React from 'react'

interface AdministratorBeneficiary {
  name: string;
  address: string;
  tin: string;
  telNo: string;
}

interface OwnerDetailsFormProps {
  formData: {
    transactionCode: string;
    tdArp: string;
    pin: string;
    owner: string;
    address: string;
    tin: string;
    telNo: string;
  };
  administratorBeneficiary: AdministratorBeneficiary;
  hasAdministratorBeneficiary: boolean;
  onInputChange: (field: string, value: string) => void;
  onAdminBeneficiaryChange: (field: keyof AdministratorBeneficiary, value: string) => void;
  onToggleAdminBeneficiary: (value: boolean) => void;
}

const OwnerDetailsForm: React.FC<OwnerDetailsFormProps> = ({
  formData,
  administratorBeneficiary,
  hasAdministratorBeneficiary,
  onInputChange,
  onAdminBeneficiaryChange,
  onToggleAdminBeneficiary,
}) => {
  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    keyboardType: 'default' | 'numeric' | 'phone-pad' = 'default',
    multiline = false
  ) => (
    <View className="mb-4">
      <Text className="text-base font-rubik-medium text-black-300 mb-2">
        {label} <Text className="text-red-500">*</Text>
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        className={`border border-gray-300 rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white ${
          multiline ? 'h-20' : 'h-12'
        }`}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  return (
    <>
      {/* Property Information */}
      <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <Text className="text-lg font-rubik-bold text-black-300 mb-4">Property Information</Text>
        
        {renderInput('Transaction Code', formData.transactionCode, (text) => onInputChange('transactionCode', text))}
        
        {renderInput('TD/ARP', formData.tdArp, (text) => onInputChange('tdArp', text))}
        
        {renderInput('PIN', formData.pin, (text) => onInputChange('pin', text), 'Property Identification Number')}
      </View>

      {/* Owner Information */}
      <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <Text className="text-lg font-rubik-bold text-black-300 mb-4">Owner Information</Text>
        
        {renderInput('Owner Name', formData.owner, (text) => onInputChange('owner', text))}
        
        {renderInput('Address', formData.address, (text) => onInputChange('address', text), 'Complete address', 'default', true)}
        
        {renderInput('TIN', formData.tin, (text) => onInputChange('tin', text), 'Tax Identification Number', 'numeric')}
        
        {renderInput('Tel No', formData.telNo, (text) => onInputChange('telNo', text), 'Telephone/Mobile Number', 'phone-pad')}
      </View>

      {/* Administrator/Beneficiary Section */}
      <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <View className="flex flex-row items-center justify-between mb-4">
          <Text className="text-lg font-rubik-bold text-black-300">Administrator/Beneficiary</Text>
          <Switch
            value={hasAdministratorBeneficiary}
            onValueChange={onToggleAdminBeneficiary}
            trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
            thumbColor={hasAdministratorBeneficiary ? '#ffffff' : '#f3f4f6'}
          />
        </View>
        
        {hasAdministratorBeneficiary && (
          <>
            {renderInput('Administrator/Beneficiary Name', administratorBeneficiary.name, (text) => onAdminBeneficiaryChange('name', text))}
            
            {renderInput('Address', administratorBeneficiary.address, (text) => onAdminBeneficiaryChange('address', text), 'Complete address', 'default', true)}
            
            {renderInput('TIN', administratorBeneficiary.tin, (text) => onAdminBeneficiaryChange('tin', text), 'Tax Identification Number', 'numeric')}
            
            {renderInput('Tel No', administratorBeneficiary.telNo, (text) => onAdminBeneficiaryChange('telNo', text), 'Telephone/Mobile Number', 'phone-pad')}
          </>
        )}
      </View>
    </>
  );
};

export default OwnerDetailsForm;