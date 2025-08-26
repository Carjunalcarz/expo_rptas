import { View, Text, TextInput } from 'react-native'
import React from 'react'
import { useForm, Controller } from 'react-hook-form'

interface LocationFormData {
  street: string;
  barangay: string;
  municipality: string;
  province: string;
}

const BuildingLocationForm: React.FC = () => {
  const { control, formState: { errors } } = useForm<LocationFormData>({
    defaultValues: {
      street: '',
      barangay: '',
      municipality: '',
      province: '',
    },
    mode: 'onChange',
  });

  return (
    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
      <Text className="text-lg font-rubik-bold text-black-300 mb-4">
        Building Location
      </Text>

      {/* Street */}
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">
          No. / Street <Text className="text-red-500">*</Text>
        </Text>
        <Controller
          control={control}
          name="street"
          rules={{ required: 'Street is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="House/Building No. and Street"
              className={`border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white h-12 ${
                errors.street ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          )}
        />
        {errors.street && (
          <Text className="text-red-500 text-sm font-rubik mt-1">
            {errors.street.message}
          </Text>
        )}
      </View>

      {/* Barangay */}
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">
          Barangay <Text className="text-red-500">*</Text>
        </Text>
        <Controller
          control={control}
          name="barangay"
          rules={{ required: 'Barangay is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Barangay name"
              className={`border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white h-12 ${
                errors.barangay ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          )}
        />
        {errors.barangay && (
          <Text className="text-red-500 text-sm font-rubik mt-1">
            {errors.barangay.message}
          </Text>
        )}
      </View>

      {/* Municipality */}
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">
          Municipality <Text className="text-red-500">*</Text>
        </Text>
        <Controller
          control={control}
          name="municipality"
          rules={{ required: 'Municipality is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Municipality/City name"
              className={`border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white h-12 ${
                errors.municipality ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          )}
        />
        {errors.municipality && (
          <Text className="text-red-500 text-sm font-rubik mt-1">
            {errors.municipality.message}
          </Text>
        )}
      </View>

      {/* Province */}
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">
          Province <Text className="text-red-500">*</Text>
        </Text>
        <Controller
          control={control}
          name="province"
          rules={{ required: 'Province is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Province name"
              className={`border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white h-12 ${
                errors.province ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          )}
        />
        {errors.province && (
          <Text className="text-red-500 text-sm font-rubik mt-1">
            {errors.province.message}
          </Text>
        )}
      </View>
    </View>
  );
};

export default BuildingLocationForm;
