import {
  View,
  Text,
  TextInput,
  Switch
} from 'react-native'
import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'

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

const OwnerDetailsForm: React.FC = () => {
  const { control, watch, formState: { errors } } = useFormContext();

  // Watch toggle for conditional rendering
  const hasAdministratorBeneficiary = watch('owner_details.hasAdministratorBeneficiary');

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
              validationRules.required('Administrator/Beneficiary Name')
            )}

            {renderInput(
              'owner_details.administratorBeneficiary.address',
              'Address',
              'Complete address',
              'default',
              true,
              validationRules.required('Administrator/Beneficiary Address')
            )}

            {renderInput(
              'owner_details.administratorBeneficiary.tin',
              'TIN',
              'Tax Identification Number',
              'numeric',
              false,
              {
                ...validationRules.required('Administrator/Beneficiary TIN'),
                ...validationRules.numeric('TIN')
              }
            )}

            {renderInput(
              'owner_details.administratorBeneficiary.telNo',
              'Tel No',
              'Telephone/Mobile Number',
              'phone-pad',
              false,
              {
                ...validationRules.required('Administrator/Beneficiary Tel No'),
                ...validationRules.phone('Tel No')
              }
            )}
          </>
        )}
      </View>
    </>
  );
};

export default OwnerDetailsForm;