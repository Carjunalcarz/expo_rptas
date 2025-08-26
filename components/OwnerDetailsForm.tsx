import {
  View,
  Text,
  TextInput,
  Switch
} from 'react-native'
import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'

const OwnerDetailsForm: React.FC = () => {
  const { control, watch, formState: { errors } } = useFormContext();

  // Watch toggle for conditional rendering
  const hasAdministratorBeneficiary = watch('owner_details.hasAdministratorBeneficiary');

  const renderInput = (
    name: string,
    label: string,
    placeholder?: string,
    keyboardType: 'default' | 'numeric' | 'phone-pad' = 'default',
    multiline = false,
    rules?: any
  ) => (
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
          ...(keyboardType === 'numeric' && {
            pattern: {
              value: /^[0-9-]+$/,
              message: `${label} must be a valid number`
            }
          }),
          ...(keyboardType === 'phone-pad' && {
            pattern: {
              value: /^[0-9+\-\s()]+$/,
              message: `${label} must be a valid phone number`
            }
          })
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            className={`border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white ${multiline ? 'h-20' : 'h-12'
              } ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
            keyboardType={keyboardType}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
          />
        )}
      />
      {errors[name] && (
        <Text className="text-red-500 text-sm font-rubik mt-1">
          {errors[name]?.message as string}
        </Text>
      )}
    </View>
  );

  return (
    <>
      {/* Property Information */}
      <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <Text className="text-lg font-rubik-bold text-black-300 mb-4">
          Property Information
        </Text>

        {renderInput('owner_details.transactionCode', 'Transaction Code')}
        {renderInput('owner_details.tdArp', 'TD/ARP')}
        {renderInput('owner_details.pin', 'PIN', 'Property Identification Number')}
      </View>

      {/* Owner Information */}
      <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <Text className="text-lg font-rubik-bold text-black-300 mb-4">
          Owner Information
        </Text>

        {renderInput('owner_details.owner', 'Owner Name')}
        {renderInput('owner_details.address', 'Address', 'Complete address', 'default', true)}
        {renderInput('owner_details.tin', 'TIN', 'Tax Identification Number', 'numeric')}
        {renderInput('owner_details.telNo', 'Tel No', 'Telephone/Mobile Number', 'phone-pad')}
      </View>

      {/* Administrator/Beneficiary Section */}
      <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <View className="flex flex-row items-center justify-between mb-4">
          <Text className="text-lg font-rubik-bold text-black-300">
            Administrator/Beneficiary
          </Text>
          <Controller
            control={control}
            name="owner_details.hasAdministratorBeneficiary"
            render={({ field: { onChange, value } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                thumbColor={value ? '#ffffff' : '#f3f4f6'}
              />
            )}
          />
        </View>

        {hasAdministratorBeneficiary && (
          <>
            {renderInput(
              'owner_details.administratorBeneficiary.name',
              'Administrator/Beneficiary Name',
              undefined,
              'default',
              false,
              { required: 'Administrator/Beneficiary Name is required' }
            )}

            {renderInput(
              'owner_details.administratorBeneficiary.address',
              'Address',
              'Complete address',
              'default',
              true,
              { required: 'Administrator/Beneficiary Address is required' }
            )}

            {renderInput(
              'owner_details.administratorBeneficiary.tin',
              'TIN',
              'Tax Identification Number',
              'numeric',
              false,
              {
                required: 'Administrator/Beneficiary TIN is required',
                pattern: { value: /^[0-9-]+$/, message: 'TIN must be a valid number' }
              }
            )}

            {renderInput(
              'owner_details.administratorBeneficiary.telNo',
              'Tel No',
              'Telephone/Mobile Number',
              'phone-pad',
              false,
              {
                required: 'Administrator/Beneficiary Tel No is required',
                pattern: { value: /^[0-9+\-\s()]+$/, message: 'Tel No must be a valid phone number' }
              }
            )}
          </>
        )}
      </View>
    </>
  );
};

export default OwnerDetailsForm;
