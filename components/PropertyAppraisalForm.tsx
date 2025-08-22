import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView
} from 'react-native'
import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { AppraisalItem } from '@/types'

interface PropertyAppraisalFormProps {
  defaultValues?: AppraisalItem;
  onFormChange?: (data: AppraisalItem) => void;
}

const PropertyAppraisalForm: React.FC<PropertyAppraisalFormProps> = ({
  defaultValues = {
    id: '1',
    description: '',
    buildingCore: '',
    type: '',
    areaInSqm: '',
    unitValue: '',
    percentOfBUCC: '',
    baseMarketValue: '',
    percentDepreciation: '',
    depreciationCost: '',
    marketValue: '',
  },
  onFormChange,
}) => {
  const { control, watch, setValue, reset, formState: { errors } } = useForm<AppraisalItem>({
    defaultValues,
    mode: 'onChange'
  });

  // Watch all form values and call onFormChange when they change
  const watchedValues = watch();
  const areaInSqm = watch('areaInSqm');
  const unitValue = watch('unitValue');
  const percentOfBUCC = watch('percentOfBUCC');
  const baseMarketValue = watch('baseMarketValue');
  const percentDepreciation = watch('percentDepreciation');

  // Simple useEffect to call onFormChange when form values change
  React.useEffect(() => {
    if (onFormChange) {
      onFormChange(watchedValues);
    }
  }, [watchedValues, onFormChange]);

  // Auto-calculate dependent fields
  React.useEffect(() => {
    const area = parseFloat(areaInSqm) || 0;
    const unitVal = parseFloat(unitValue) || 0;
    const percentBUCC = parseFloat(percentOfBUCC) || 0;
    
    // Calculate Base Market Value = Area × Unit Value × (% of BUCC / 100)
    const baseMarketVal = area * unitVal * (percentBUCC / 100);
    const newBaseMarketValue = baseMarketVal.toFixed(2);
    
    if (newBaseMarketValue !== baseMarketValue) {
      setValue('baseMarketValue', newBaseMarketValue);
    }
  }, [areaInSqm, unitValue, percentOfBUCC, baseMarketValue, setValue]);

  React.useEffect(() => {
    const baseMarketVal = parseFloat(baseMarketValue) || 0;
    const percentDepn = parseFloat(percentDepreciation) || 0;
    
    // Calculate Depreciation Cost = Base Market Value × (% Depreciation / 100)
    const depnCost = baseMarketVal * (percentDepn / 100);
    const newDepreciationCost = depnCost.toFixed(2);
    
    // Calculate Market Value = Base Market Value - Depreciation Cost
    const marketVal = baseMarketVal - depnCost;
    const newMarketValue = marketVal.toFixed(2);
    
    setValue('depreciationCost', newDepreciationCost);
    setValue('marketValue', newMarketValue);
  }, [baseMarketValue, percentDepreciation, setValue]);

  const renderInput = (
    name: keyof AppraisalItem,
    placeholder: string,
    className: string,
    keyboardType: 'default' | 'numeric' = 'default',
    rules?: any
  ) => (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextInput
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`${className} ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
          keyboardType={keyboardType}
        />
      )}
    />
  );

  const renderReadOnlyField = (value: string, className: string, bgColor: string = 'bg-gray-100') => (
    <View className={`${className} ${bgColor} rounded px-2 py-2 mr-1 border border-gray-300`}>
      <Text className="text-xs font-rubik text-center">{value || '0.00'}</Text>
    </View>
  );

  return (
    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
      <Text className="text-lg font-rubik-bold text-black-300 mb-4">Property Appraisal</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={{ minWidth: 800 }}
      >
        <View style={{ minWidth: 800 }}>
          {/* Parent Header Row */}
          <View className="flex flex-row bg-primary-300 rounded-t-lg">
            <Text className="text-white text-xs font-rubik-bold w-60 text-center p-2 border-r border-white/20">Description</Text>
            <Text className="text-white text-xs font-rubik-bold w-24 text-center p-2 border-r border-white/20">Area (SQM)</Text>
            <Text className="text-white text-xs font-rubik-bold w-24 text-center p-2 border-r border-white/20">Unit Value</Text>
            <Text className="text-white text-xs font-rubik-bold w-24 text-center p-2 border-r border-white/20">% of BUCC</Text>
            <Text className="text-white text-xs font-rubik-bold w-28 text-center p-2 border-r border-white/20">Base Market Value</Text>
            <Text className="text-white text-xs font-rubik-bold w-20 text-center p-2 border-r border-white/20">% Depn</Text>
            <Text className="text-white text-xs font-rubik-bold w-28 text-center p-2 border-r border-white/20">Depreciation Cost</Text>
            <Text className="text-white text-xs font-rubik-bold w-24 text-center p-2">Market Value</Text>
          </View>
          
          {/* Single Data Row */}
          <View className="flex flex-row items-center border border-gray-300 border-t-0 p-2 bg-white">
            {renderInput(
              'buildingCore',
              'Building Core',
              'w-60 border border-gray-300 rounded px-2 py-2 text-xs font-rubik mr-1 bg-white',
              'default',
              {
                required: 'Building Core is required',
                minLength: { value: 1, message: 'Building Core cannot be empty' }
              }
            )}

            {renderInput(
              'type',
              'Type',
              'w-16 border border-gray-300 rounded px-2 py-2 text-xs font-rubik mr-1 bg-white'
            )}

            {renderInput(
              'areaInSqm',
              '0.00',
              'w-24 border border-gray-300 rounded px-2 py-2 text-xs font-rubik mr-1 bg-white',
              'numeric',
              {
                required: 'Area is required',
                pattern: {
                  value: /^[0-9.]+$/,
                  message: 'Area must be a valid number'
                },
                min: { value: 0.01, message: 'Area must be greater than 0' }
              }
            )}

            {renderInput(
              'unitValue',
              '0.00',
              'w-24 border border-gray-300 rounded px-2 py-2 text-xs font-rubik mr-1 bg-white',
              'numeric',
              {
                required: 'Unit Value is required',
                pattern: {
                  value: /^[0-9.]+$/,
                  message: 'Unit Value must be a valid number'
                },
                min: { value: 0.01, message: 'Unit Value must be greater than 0' }
              }
            )}

            {renderInput(
              'percentOfBUCC',
              '0.00',
              'w-24 border border-gray-300 rounded px-2 py-2 text-xs font-rubik mr-1 bg-white',
              'numeric',
              {
                pattern: {
                  value: /^[0-9.]+$/,
                  message: '% of BUCC must be a valid number'
                },
                max: { value: 100, message: '% of BUCC cannot exceed 100' }
              }
            )}

            {renderReadOnlyField(watchedValues.baseMarketValue, 'w-28')}

            {renderInput(
              'percentDepreciation',
              '0.00',
              'w-20 border border-gray-300 rounded px-2 py-2 text-xs font-rubik mr-1 bg-white',
              'numeric',
              {
                pattern: {
                  value: /^[0-9.]+$/,
                  message: '% Depreciation must be a valid number'
                },
                max: { value: 100, message: '% Depreciation cannot exceed 100' }
              }
            )}

            {renderReadOnlyField(watchedValues.depreciationCost, 'w-28')}

            {renderReadOnlyField(watchedValues.marketValue, 'w-24', 'bg-green-100 border-green-300')}
          </View>
        </View>
      </ScrollView>

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <View className="mt-2 p-2 bg-red-50 rounded-lg">
          {Object.entries(errors).map(([field, error]) => (
            <Text key={field} className="text-red-500 text-xs font-rubik">
              • {error?.message}
            </Text>
          ))}
        </View>
      )}

      <View className="mt-4 p-3 bg-blue-50 rounded-lg">
        <Text className="text-sm font-rubik-bold text-blue-800 mb-2">Calculation Notes:</Text>
        <Text className="text-xs font-rubik text-blue-700">• Base Market Value = Area × Unit Value × (% of BUCC ÷ 100)</Text>
        <Text className="text-xs font-rubik text-blue-700">• Depreciation Cost = Base Market Value × (% Depreciation ÷ 100)</Text>
        <Text className="text-xs font-rubik text-blue-700">• Market Value = Base Market Value - Depreciation Cost</Text>
      </View>
    </View>
  );
};

export default PropertyAppraisalForm;