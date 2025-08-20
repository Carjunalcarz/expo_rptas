import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity,
  ScrollView
} from 'react-native'
import React from 'react'

interface AppraisalItem {
  id: string;
  description: string;
  buildingCore: string;
  type: string;
  areaInSqm: string;
  unitValue: string;
  percentOfBUCC: string;
  baseMarketValue: string;
  percentDepreciation: string;
  depreciationCost: string;
  marketValue: string;
}

interface PropertyAppraisalFormProps {
  appraisalData: AppraisalItem;
  onAppraisalChange: (field: keyof AppraisalItem, value: string) => void;
}

const PropertyAppraisalForm: React.FC<PropertyAppraisalFormProps> = ({
  appraisalData,
  onAppraisalChange,
}) => {

  const handleInputChange = (field: keyof AppraisalItem, value: string) => {
    let updatedData = { ...appraisalData, [field]: value };
    
    // Auto-calculate dependent fields
    if (field === 'areaInSqm' || field === 'unitValue' || field === 'percentOfBUCC') {
      const area = parseFloat(field === 'areaInSqm' ? value : updatedData.areaInSqm) || 0;
      const unitVal = parseFloat(field === 'unitValue' ? value : updatedData.unitValue) || 0;
      const percentBUCC = parseFloat(field === 'percentOfBUCC' ? value : updatedData.percentOfBUCC) || 0;
      
      // Calculate Base Market Value = Area × Unit Value × (% of BUCC / 100)
      const baseMarketVal = area * unitVal * (percentBUCC / 100);
      updatedData.baseMarketValue = baseMarketVal.toFixed(2);
    }
    
    if (field === 'baseMarketValue' || field === 'percentDepreciation') {
      const baseMarketVal = parseFloat(field === 'baseMarketValue' ? value : updatedData.baseMarketValue) || 0;
      const percentDepn = parseFloat(field === 'percentDepreciation' ? value : updatedData.percentDepreciation) || 0;
      
      // Calculate Depreciation Cost = Base Market Value × (% Depreciation / 100)
      const depnCost = baseMarketVal * (percentDepn / 100);
      updatedData.depreciationCost = depnCost.toFixed(2);
      
      // Calculate Market Value = Base Market Value - Depreciation Cost
      const marketVal = baseMarketVal - depnCost;
      updatedData.marketValue = marketVal.toFixed(2);
    }
    
    // Update each field individually
    Object.keys(updatedData).forEach(key => {
      onAppraisalChange(key as keyof AppraisalItem, updatedData[key as keyof AppraisalItem]);
    });
  };

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
            <Text className="text-white text-xs font-rubik-bold w-60 text-center p-2 border-r border-white/20">Description
            </Text>
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
             
            <TextInput
              value={appraisalData.buildingCore}
              onChangeText={(text) => handleInputChange('buildingCore', text)}
              placeholder="Building Core"
              className="w-60 border border-gray-300 rounded px-2 py-2 text-xs font-rubik mr-1 bg-white"
              />

            <TextInput
              value={appraisalData.type}
              onChangeText={(text) => handleInputChange('type', text)}
              placeholder="Type"
              className="w-16 border border-gray-300 rounded px-2 py-2 text-xs font-rubik mr-1 bg-white"
            />

            <TextInput
              value={appraisalData.areaInSqm}
              onChangeText={(text) => handleInputChange('areaInSqm', text)}
              placeholder="0.00"
              className="w-24 border border-gray-300 rounded px-2 py-2 text-xs font-rubik mr-1 bg-white"
              keyboardType="numeric"
            />
            <TextInput
              value={appraisalData.unitValue}
              onChangeText={(text) => handleInputChange('unitValue', text)}
              placeholder="0.00"
              className="w-24 border border-gray-300 rounded px-2 py-2 text-xs font-rubik mr-1 bg-white"
              keyboardType="numeric"
            />
            <TextInput
              value={appraisalData.percentOfBUCC}
              onChangeText={(text) => handleInputChange('percentOfBUCC', text)}
              placeholder="0.00"
              className="w-24 border border-gray-300 rounded px-2 py-2 text-xs font-rubik mr-1 bg-white"
              keyboardType="numeric"
            />
            <View className="w-28 bg-gray-100 rounded px-2 py-2 mr-1 border border-gray-300">
              <Text className="text-xs font-rubik text-center">{appraisalData.baseMarketValue || '0.00'}</Text>
            </View>
            <TextInput
              value={appraisalData.percentDepreciation}
              onChangeText={(text) => handleInputChange('percentDepreciation', text)}
              placeholder="0.00"
              className="w-20 border border-gray-300 rounded px-2 py-2 text-xs font-rubik mr-1 bg-white"
              keyboardType="numeric"
            />
            <View className="w-28 bg-gray-100 rounded px-2 py-2 mr-1 border border-gray-300">
              <Text className="text-xs font-rubik text-center">{appraisalData.depreciationCost || '0.00'}</Text>
            </View>
            <View className="w-24 bg-green-100 rounded px-2 py-2 border border-green-300">
              <Text className="text-xs font-rubik-bold text-center text-green-800">{appraisalData.marketValue || '0.00'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

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