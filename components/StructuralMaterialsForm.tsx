import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity,
  ScrollView
} from 'react-native'
import React, { useState } from 'react'

interface FloorMaterial {
  id: string;
  floorName: string;
  material: string;
  otherSpecify: string;
}

interface WallPartition {
  id: string;
  wallName: string;
  material: string;
  otherSpecify: string;
}

interface StructuralMaterialsFormProps {
  structuralData: {
    foundation: {
      reinforceConcrete: boolean;
      plainConcrete: boolean;
      others: boolean;
      othersSpecify: string;
    };
    columns: {
      steel: boolean;
      reinforceConcrete: boolean;
      wood: boolean;
      others: boolean;
      othersSpecify: string;
    };
    beams: {
      steel: boolean;
      reinforceConcrete: boolean;
      others: boolean;
      othersSpecify: string;
    };
    trussFraming: {
      steel: boolean;
      wood: boolean;
      others: boolean;
      othersSpecify: string;
    };
    roof: {
      reinforceConcrete: boolean;
      tiles: boolean;
      giSheet: boolean;
      aluminum: boolean;
      asbestos: boolean;
      longSpan: boolean;
      concreteDesk: boolean;
      nipaAnahawCogon: boolean;
      others: boolean;
      othersSpecify: string;
    };
    flooring: FloorMaterial[];
    wallsPartitions: WallPartition[];
  };
  onStructuralChange: (field: string, value: any) => void;
}

const StructuralMaterialsForm: React.FC<StructuralMaterialsFormProps> = ({
  structuralData,
  onStructuralChange,
}) => {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    foundation: true,
    columns: false,
    beams: false,
    trussFraming: false,
    roof: false,
    flooring: false,
    walls: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCheckboxChange = (section: string, field: string, value: boolean) => {
    const updatedSection = {
      ...structuralData[section as keyof typeof structuralData],
      [field]: value
    };
    onStructuralChange(section, updatedSection);
  };

  const handleOthersSpecifyChange = (section: string, value: string) => {
    const updatedSection = {
      ...structuralData[section as keyof typeof structuralData],
      othersSpecify: value
    };
    onStructuralChange(section, updatedSection);
  };

  const addFloorMaterial = () => {
    const newFloor: FloorMaterial = {
      id: Date.now().toString(),
      floorName: `Floor ${structuralData.flooring.length + 1}`,
      material: '',
      otherSpecify: '',
    };
    const updatedFlooring = [...structuralData.flooring, newFloor];
    onStructuralChange('flooring', updatedFlooring);
  };

  const removeFloorMaterial = (id: string) => {
    const updatedFlooring = structuralData.flooring.filter(floor => floor.id !== id);
    onStructuralChange('flooring', updatedFlooring);
  };

  const updateFloorMaterial = (id: string, field: keyof FloorMaterial, value: string) => {
    const updatedFlooring = structuralData.flooring.map(floor =>
      floor.id === id ? { ...floor, [field]: value } : floor
    );
    onStructuralChange('flooring', updatedFlooring);
  };

  const addWallPartition = () => {
    const newWall: WallPartition = {
      id: Date.now().toString(),
      wallName: `Wall ${structuralData.wallsPartitions.length + 1}`,
      material: '',
      otherSpecify: '',
    };
    const updatedWalls = [...structuralData.wallsPartitions, newWall];
    onStructuralChange('wallsPartitions', updatedWalls);
  };

  const removeWallPartition = (id: string) => {
    const updatedWalls = structuralData.wallsPartitions.filter(wall => wall.id !== id);
    onStructuralChange('wallsPartitions', updatedWalls);
  };

  const updateWallPartition = (id: string, field: keyof WallPartition, value: string) => {
    const updatedWalls = structuralData.wallsPartitions.map(wall =>
      wall.id === id ? { ...wall, [field]: value } : wall
    );
    onStructuralChange('wallsPartitions', updatedWalls);
  };

  const renderCheckbox = (label: string, checked: boolean, onPress: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex flex-row items-center mb-3"
    >
      <View className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center ${
        checked ? 'bg-primary-300 border-primary-300' : 'border-gray-400'
      }`}>
        {checked && <Text className="text-white text-xs font-bold">✓</Text>}
      </View>
      <Text className="text-sm font-rubik text-black-300 flex-1">{label}</Text>
    </TouchableOpacity>
  );

  const renderSection = (
    title: string,
    sectionKey: string,
    items: Array<{key: string, label: string}>,
    hasOthers: boolean = true
  ) => {
    const section = structuralData[sectionKey as keyof typeof structuralData] as any;
    const isExpanded = expandedSections[sectionKey];

    return (
      <View className="mb-4">
        <TouchableOpacity
          onPress={() => toggleSection(sectionKey)}
          className="flex flex-row items-center justify-between bg-gray-100 p-3 rounded-lg"
        >
          <Text className="text-base font-rubik-medium text-black-300">{title}</Text>
          <Text className="text-lg font-bold text-gray-600">{isExpanded ? '−' : '+'}</Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View className="bg-white p-4 rounded-lg mt-2 border border-gray-200">
            {items.map((item, index) =>
              <View key={`${sectionKey}-${item.key}-${index}`}>
                {renderCheckbox(
                  item.label,
                  section[item.key],
                  () => handleCheckboxChange(sectionKey, item.key, !section[item.key])
                )}
              </View>
            )}
            
            {hasOthers && (
              <>
                {renderCheckbox(
                  'Others (Specify)',
                  section.others,
                  () => handleCheckboxChange(sectionKey, 'others', !section.others)
                )}
                
                {section.others && (
                  <TextInput
                    value={section.othersSpecify}
                    onChangeText={(text) => handleOthersSpecifyChange(sectionKey, text)}
                    placeholder="Please specify..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-rubik text-black-300 bg-gray-50 ml-8"
                  />
                )}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  // Separate dropdown component to avoid hooks issues
  const MaterialDropdown = ({
    value,
    onValueChange,
    options,
    placeholder = "Select material",
    dropdownId
  }: {
    value: string;
    onValueChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    dropdownId: string;
  }) => {
    const [openDropdowns, setOpenDropdowns] = useState<{[key: string]: boolean}>({});

    const toggleDropdown = (id: string) => {
      setOpenDropdowns(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    };

    const selectOption = (option: string, id: string) => {
      onValueChange(option);
      setOpenDropdowns(prev => ({
        ...prev,
        [id]: false
      }));
    };

    const isOpen = openDropdowns[dropdownId] || false;

    return (
      <View className="relative">
        <TouchableOpacity
          onPress={() => toggleDropdown(dropdownId)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white flex flex-row items-center justify-between"
        >
          <Text className={`text-sm font-rubik ${value ? 'text-black-300' : 'text-gray-400'}`}>
            {value || placeholder}
          </Text>
          <Text className="text-gray-600">{isOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {isOpen && (
          <View className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 z-10 max-h-40">
            <ScrollView nestedScrollEnabled={true}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => selectOption(option, dropdownId)}
                  className="px-3 py-2 border-b border-gray-100"
                >
                  <Text className="text-sm font-rubik text-black-300">{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const flooringOptions = [
    'Reinforce Concrete',
    'Plain Cement',
    'Marble',
    'Wood',
    'Tiles',
    'Others (Specify)'
  ];

  const wallsOptions = [
    'Reinforce Concrete',
    'Plain Concrete',
    'Wood',
    'CHB',
    'G.I Sheet',
    'Build a Wall',
    'Sawal',
    'Bamboo',
    'Others (Specify)'
  ];

  return (
    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
      <Text className="text-lg font-rubik-bold text-black-300 mb-4">Structural Materials</Text>
      
      {/* Foundation */}
      {renderSection('Foundation', 'foundation', [
        { key: 'reinforceConcrete', label: 'Reinforce Concrete' },
        { key: 'plainConcrete', label: 'Plain Concrete' }
      ])}

      {/* Columns */}
      {renderSection('Columns', 'columns', [
        { key: 'steel', label: 'Steel' },
        { key: 'reinforceConcrete', label: 'Reinforce Concrete' },
        { key: 'wood', label: 'Wood' }
      ])}

      {/* Beams */}
      {renderSection('Beams', 'beams', [
        { key: 'steel', label: 'Steel' },
        { key: 'reinforceConcrete', label: 'Reinforce Concrete' }
      ])}

      {/* Truss Framing */}
      {renderSection('Truss Framing', 'trussFraming', [
        { key: 'steel', label: 'Steel' },
        { key: 'wood', label: 'Wood' }
      ])}

      {/* Roof */}
      {renderSection('Roof', 'roof', [
        { key: 'reinforceConcrete', label: 'Reinforce Concrete' },
        { key: 'tiles', label: 'Tiles' },
        { key: 'giSheet', label: 'G.I Sheet' },
        { key: 'aluminum', label: 'Aluminum' },
        { key: 'asbestos', label: 'Asbestos' },
        { key: 'longSpan', label: 'Long Span' },
        { key: 'concreteDesk', label: 'Concrete Desk' },
        { key: 'nipaAnahawCogon', label: 'Nipa/Anahaw/Cogon' }
      ])}

      {/* Dynamic Flooring */}
      <View className="mb-4">
        <TouchableOpacity
          onPress={() => toggleSection('flooring')}
          className="flex flex-row items-center justify-between bg-gray-100 p-3 rounded-lg"
        >
          <Text className="text-base font-rubik-medium text-black-300">Flooring</Text>
          <View className="flex flex-row items-center">
            <TouchableOpacity
              onPress={addFloorMaterial}
              className="bg-primary-300 rounded-full w-6 h-6 flex items-center justify-center mr-2"
            >
              <Text className="text-white text-sm font-bold">+</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-600">{expandedSections.flooring ? '▼' : '▶'}</Text>
          </View>
        </TouchableOpacity>
        
        {expandedSections.flooring && (
          <View className="bg-white p-4 rounded-lg mt-2 border border-gray-200">
            {structuralData.flooring.map((floor, index) => (
              <View key={floor.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <View className="flex flex-row items-center justify-between mb-2">
                  <TextInput
                    value={floor.floorName}
                    onChangeText={(text) => updateFloorMaterial(floor.id, 'floorName', text)}
                    placeholder="Floor name"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-rubik text-black-300 bg-white mr-2"
                  />
                  {structuralData.flooring.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeFloorMaterial(floor.id)}
                      className="bg-red-500 rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <Text className="text-white text-sm font-bold">×</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View className="mb-2">
                  <MaterialDropdown
                    value={floor.material}
                    onValueChange={(value) => updateFloorMaterial(floor.id, 'material', value)}
                    options={flooringOptions}
                    placeholder="Select flooring material"
                    dropdownId={`floor-${floor.id}`}
                  />
                </View>
                
                {floor.material === 'Others (Specify)' && (
                  <TextInput
                    value={floor.otherSpecify}
                    onChangeText={(text) => updateFloorMaterial(floor.id, 'otherSpecify', text)}
                    placeholder="Please specify..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-rubik text-black-300 bg-white"
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Dynamic Walls & Partitions */}
      <View className="mb-4">
        <TouchableOpacity
          onPress={() => toggleSection('walls')}
          className="flex flex-row items-center justify-between bg-gray-100 p-3 rounded-lg"
        >
          <Text className="text-base font-rubik-medium text-black-300">Walls & Partitions</Text>
          <View className="flex flex-row items-center">
            <TouchableOpacity
              onPress={addWallPartition}
              className="bg-primary-300 rounded-full w-6 h-6 flex items-center justify-center mr-2"
            >
              <Text className="text-white text-sm font-bold">+</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-600">{expandedSections.walls ? '▼' : '▶'}</Text>
          </View>
        </TouchableOpacity>
        
        {expandedSections.walls && (
          <View className="bg-white p-4 rounded-lg mt-2 border border-gray-200">
            {structuralData.wallsPartitions.map((wall, index) => (
              <View key={wall.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <View className="flex flex-row items-center justify-between mb-2">
                  <TextInput
                    value={wall.wallName}
                    onChangeText={(text) => updateWallPartition(wall.id, 'wallName', text)}
                    placeholder="Wall/Partition name"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-rubik text-black-300 bg-white mr-2"
                  />
                  {structuralData.wallsPartitions.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeWallPartition(wall.id)}
                      className="bg-red-500 rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <Text className="text-white text-sm font-bold">×</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View className="mb-2">
                  <MaterialDropdown
                    value={wall.material}
                    onValueChange={(value) => updateWallPartition(wall.id, 'material', value)}
                    options={wallsOptions}
                    placeholder="Select wall material"
                    dropdownId={`wall-${wall.id}`}
                  />
                </View>
                
                {wall.material === 'Others (Specify)' && (
                  <TextInput
                    value={wall.otherSpecify}
                    onChangeText={(text) => updateWallPartition(wall.id, 'otherSpecify', text)}
                    placeholder="Please specify..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-rubik text-black-300 bg-white"
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default StructuralMaterialsForm;