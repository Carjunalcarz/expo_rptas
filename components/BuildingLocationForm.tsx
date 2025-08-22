import { 
  View, 
  Text, 
  TextInput
} from 'react-native'
import React from 'react'
import { useForm, Controller } from 'react-hook-form'

interface LocationFormData {
  street: string;
  barangay: string;
  municipality: string;
  province: string;
}

interface BuildingLocationFormProps {
  defaultValues?: LocationFormData;
  onFormChange?: (data: LocationFormData) => void;
}

const BuildingLocationForm: React.FC<BuildingLocationFormProps> = ({
  defaultValues = {
    street: '',
    barangay: '',
    municipality: '',
    province: '',
  },
  onFormChange,
}) => {
  const { control, watch, reset, formState: { errors } } = useForm<LocationFormData>({
    defaultValues,
    mode: 'onChange'
  });

  // Watch all form values and call onFormChange when they change
  const watchedValues = watch();

  // Simple useEffect to call onFormChange when form values change
  React.useEffect(() => {
    if (onFormChange) {
      onFormChange(watchedValues);
    }
  }, [watchedValues, onFormChange]);
  const renderInput = (
    name: keyof LocationFormData,
    label: string,
    placeholder?: string,
    keyboardType: 'default' | 'numeric' | 'phone-pad' = 'default'
  ) => (
    <View className="mb-4">
      <Text className="text-base font-rubik-medium text-black-300 mb-2">
        {label} <Text className="text-red-500">*</Text>
      </Text>
      <Controller
        control={control}
        name={name}
        rules={{
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
            className={`border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white h-12 ${
              errors[name] ? 'border-red-500' : 'border-gray-300'
            }`}
            keyboardType={keyboardType}
            textAlignVertical="center"
          />
        )}
      />
      {errors[name] && (
        <Text className="text-red-500 text-sm font-rubik mt-1">
          {errors[name]?.message}
        </Text>
      )}
    </View>
  );

  return (
    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
      <Text className="text-lg font-rubik-bold text-black-300 mb-4">Building Location</Text>
      
      {renderInput('street', 'No. / Street', 'House/Building No. and Street')}
      
      {renderInput('barangay', 'Barangay', 'Barangay name')}
      
      {renderInput('municipality', 'Municipality', 'Municipality/City name')}
      
      {renderInput('province', 'Province', 'Province name')}
    </View>
  );
};

export default BuildingLocationForm;