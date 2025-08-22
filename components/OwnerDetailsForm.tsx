import { 
  View, 
  Text, 
  TextInput, 
  Switch
} from 'react-native'
import React from 'react'
import { useForm, Controller } from 'react-hook-form'

interface AdministratorBeneficiary {
  name: string;
  address: string;
  tin: string;
  telNo: string;
}

interface OwnerFormData {
  transactionCode: string;
  tdArp: string;
  pin: string;
  owner: string;
  address: string;
  tin: string;
  telNo: string;
  hasAdministratorBeneficiary: boolean;
  administratorBeneficiary: AdministratorBeneficiary;
}

interface OwnerDetailsFormProps {
  defaultValues?: OwnerFormData;
  onFormChange?: (data: OwnerFormData) => void;
}

const OwnerDetailsForm: React.FC<OwnerDetailsFormProps> = ({
  defaultValues = {
    transactionCode: '',
    tdArp: '',
    pin: '',
    owner: '',
    address: '',
    tin: '',
    telNo: '',
    hasAdministratorBeneficiary: false,
    administratorBeneficiary: {
      name: '',
      address: '',
      tin: '',
      telNo: '',
    },
  },
  onFormChange,
}) => {
  const { control, watch, reset, formState: { errors } } = useForm<OwnerFormData>({
    defaultValues,
    mode: 'onChange'
  });

  // Watch all form values and call onFormChange when they change
  const watchedValues = watch();
  const hasAdministratorBeneficiary = watch('hasAdministratorBeneficiary');

  // Reset form when defaultValues change (safe approach with ref to prevent loops)
  const prevDefaultValues = React.useRef(defaultValues);
  React.useEffect(() => {
    if (JSON.stringify(prevDefaultValues.current) !== JSON.stringify(defaultValues)) {
      reset(defaultValues);
      prevDefaultValues.current = defaultValues;
    }
  }, [defaultValues, reset]);

  // Simple useEffect to call onFormChange when form values change
  React.useEffect(() => {
    if (onFormChange) {
      onFormChange(watchedValues);
    }
  }, [watchedValues, onFormChange]);

  const renderInput = (
    name: keyof OwnerFormData | `administratorBeneficiary.${keyof AdministratorBeneficiary}`,
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
        name={name as any}
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
            className={`border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white ${
              multiline ? 'h-20' : 'h-12'
            } ${
              errors[name as keyof typeof errors] ? 'border-red-500' : 'border-gray-300'
            }`}
            keyboardType={keyboardType}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
          />
        )}
      />
      {errors[name as keyof typeof errors] && (
        <Text className="text-red-500 text-sm font-rubik mt-1">
          {errors[name as keyof typeof errors]?.message}
        </Text>
      )}
    </View>
  );

  return (
    <>
      {/* Property Information */}
      <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <Text className="text-lg font-rubik-bold text-black-300 mb-4">Property Information</Text>
        
        {renderInput('transactionCode', 'Transaction Code')}
        
        {renderInput('tdArp', 'TD/ARP')}
        
        {renderInput('pin', 'PIN', 'Property Identification Number')}
      </View>

      {/* Owner Information */}
      <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <Text className="text-lg font-rubik-bold text-black-300 mb-4">Owner Information</Text>
        
        {renderInput('owner', 'Owner Name')}
        
        {renderInput('address', 'Address', 'Complete address', 'default', true)}
        
        {renderInput('tin', 'TIN', 'Tax Identification Number', 'numeric')}
        
        {renderInput('telNo', 'Tel No', 'Telephone/Mobile Number', 'phone-pad')}
      </View>

      {/* Administrator/Beneficiary Section */}
      <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <View className="flex flex-row items-center justify-between mb-4">
          <Text className="text-lg font-rubik-bold text-black-300">Administrator/Beneficiary</Text>
          <Controller
            control={control}
            name="hasAdministratorBeneficiary"
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
            {renderInput('administratorBeneficiary.name', 'Administrator/Beneficiary Name', undefined, 'default', false, {
              required: hasAdministratorBeneficiary ? 'Administrator/Beneficiary Name is required' : false
            })}
            
            {renderInput('administratorBeneficiary.address', 'Address', 'Complete address', 'default', true, {
              required: hasAdministratorBeneficiary ? 'Administrator/Beneficiary Address is required' : false
            })}
            
            {renderInput('administratorBeneficiary.tin', 'TIN', 'Tax Identification Number', 'numeric', false, {
              required: hasAdministratorBeneficiary ? 'Administrator/Beneficiary TIN is required' : false,
              pattern: {
                value: /^[0-9-]+$/,
                message: 'TIN must be a valid number'
              }
            })}
            
            {renderInput('administratorBeneficiary.telNo', 'Tel No', 'Telephone/Mobile Number', 'phone-pad', false, {
              required: hasAdministratorBeneficiary ? 'Administrator/Beneficiary Tel No is required' : false,
              pattern: {
                value: /^[0-9+\-\s()]+$/,
                message: 'Tel No must be a valid phone number'
              }
            })}
          </>
        )}
      </View>
    </>
  );
};

export default OwnerDetailsForm;