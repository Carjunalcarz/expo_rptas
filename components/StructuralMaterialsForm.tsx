// StructuralMaterialsFormAdapted.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView
} from 'react-native'
import React, { useState } from 'react'
import { useFormContext, Controller, useFieldArray } from 'react-hook-form'
import { PRIMARY_COLOR } from '../constants/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Define FloorMaterial type
type FloorMaterial = {
  id: string;
  floorName: string;
  material: string;
  otherSpecify: string;
};

// Define WallPartition type
type WallPartition = {
  id: string;
  wallName: string;
  material: string;
  otherSpecify: string;
};

const StructuralMaterialsFormAdapted: React.FC = () => {
  const { control, watch, setValue, formState: { errors } } = useFormContext();
  const { fields: flooringFields, append: appendFlooring, remove: removeFlooring } = useFieldArray({
    control,
    name: 'structural_materials.flooring'
  });

  const { fields: wallsFields, append: appendWall, remove: removeWall } = useFieldArray({
    control,
    name: 'structural_materials.wallsPartitions'
  });

  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    foundation: true,
    columns: false,
    beams: false,
    trussFraming: false,
    roof: false,
    flooring: false,
    walls: false,
    wallsPartitions: false,
  });

  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addFloorMaterial = () => {
    const newFloor: FloorMaterial = {
      id: Date.now().toString(),
      floorName: `Floor ${flooringFields.length + 1}`,
      material: '',
      otherSpecify: '',
    };
    appendFlooring(newFloor);
  };

  const addWallPartition = () => {
    const newWall: WallPartition = {
      id: Date.now().toString(),
      wallName: `Wall ${wallsFields.length + 1}`,
      material: '',
      otherSpecify: '',
    };
    appendWall(newWall);
  };

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

  const renderCheckbox = (
    name: string,
    label: string,
    checked: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex flex-row items-center mb-3"
    >
      <View
        className="w-5 h-5 border-2 rounded mr-3 flex items-center justify-center"
        style={{ backgroundColor: checked ? PRIMARY_COLOR : undefined, borderColor: checked ? PRIMARY_COLOR : '#9CA3AF' }}
      >
        {checked && <Text className="text-white text-xs font-bold">✓</Text>}
      </View>
      <Text className="text-sm font-rubik text-black-300 flex-1">{label}</Text>
    </TouchableOpacity>
  );

  const renderSection = (
    title: string,
    sectionKey: string,
    items: Array<{ key: string, label: string }>,
    hasOthers: boolean = true
  ) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <View className="mb-4">
        {/* Section Toggle Button */}
        <TouchableOpacity
          onPress={() => toggleSection(sectionKey)}
          className="flex flex-row items-center justify-between bg-gray-100 p-3 rounded-lg"
        >
          <Text className="text-base font-rubik-medium text-black-300">{title}</Text>
          <Text className="text-lg font-bold text-gray-600">
            {isExpanded ? '−' : '+'}
          </Text>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View className="bg-white p-4 rounded-lg mt-2 border border-gray-200">
            {items.map((item, index) => (
              <Controller
                key={`${sectionKey}-${item.key}-${index}`}
                control={control}
                name={`structural_materials.${sectionKey}.${item.key}` as any}
                render={({ field: { onChange, value } }) =>
                  renderCheckbox(
                    `structural_materials.${sectionKey}.${item.key}`,
                    item.label,
                    value,
                    () => onChange(!value)
                  )
                }
              />
            ))}

            {/* "Others (Specify)" */}
            {hasOthers && (
              <>
                <Controller
                  control={control}
                  name={`structural_materials.${sectionKey}.others` as any}
                  render={({ field: { onChange, value } }) =>
                    renderCheckbox(
                      `structural_materials.${sectionKey}.others`,
                      'Others (Specify)',
                      value,
                      () => onChange(!value)
                    )
                  }
                />

                <Controller
                  control={control}
                  name={`structural_materials.${sectionKey}.othersSpecify` as any}
                  render={({ field: { onChange, onBlur, value } }) => {
                    const othersChecked = watch(`structural_materials.${sectionKey}.others` as any)
                    return (
                      <View>
                        {othersChecked && (
                          <TextInput
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            placeholder="Please specify..."
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-rubik text-black-300 bg-gray-50 ml-8"
                          />
                        )}
                      </View>
                    )
                  }}
                />
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  const toggleDropdown = (id: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const selectOption = (option: string, id: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: false
    }));
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
    const isOpen = openDropdowns[dropdownId] || false;

    const handleSelectOption = (option: string) => {
      onValueChange(option);
      selectOption(option, dropdownId);
    };

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
                  onPress={() => handleSelectOption(option)}
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
      <View className="flex-row items-center justify-between mb-4 p-3 bg-blue-100 rounded-lg border-l-4" style={{ borderLeftColor: PRIMARY_COLOR }}>
        <Text className="text-lg font-bold" style={{ color: PRIMARY_COLOR }}>STRUCTURAL MATERIALS</Text>
        <Icon name="assessment" size={24} style={{ color: PRIMARY_COLOR }} />
      </View>

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
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="rounded-full w-6 h-6 flex items-center justify-center mr-2"
            >
              <Text className="text-white text-sm font-bold">+</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-600">{expandedSections.flooring ? '▼' : '▶'}</Text>
          </View>
        </TouchableOpacity>

        {expandedSections.flooring && (
          <View className="bg-white p-4 rounded-lg mt-2 border border-gray-200">
            {flooringFields.map((field, index) => (
              <View key={field.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <View className="flex flex-row items-center justify-between mb-2">
                  <Controller
                    control={control}
                    name={`structural_materials.flooring.${index}.floorName`}
                    rules={{ required: 'Floor name is required' }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Floor name"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-rubik text-black-300 bg-white mr-2"
                      />
                    )}
                  />
                  {flooringFields.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeFlooring(index)}
                      className="bg-red-500 rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <Text className="text-white text-sm font-bold">×</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View className="mb-2">
                  <Controller
                    control={control}
                    name={`structural_materials.flooring.${index}.material`}
                    rules={{ required: 'Material selection is required' }}
                    render={({ field: { onChange, value } }) => (
                      <MaterialDropdown
                        value={value}
                        onValueChange={onChange}
                        options={flooringOptions}
                        placeholder="Select flooring material"
                        dropdownId={`floor-${field.id}`}
                      />
                    )}
                  />
                </View>
                <Controller
                  control={control}
                  name={`structural_materials.flooring.${index}.otherSpecify`}
                  render={({ field: { onChange, onBlur, value } }) => {
                    const material = watch(`structural_materials.flooring.${index}.material`);
                    return (
                      <View>
                        {material === 'Others (Specify)' && (
                          <TextInput
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            placeholder="Please specify..."
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-rubik text-black-300 bg-white"
                          />
                        )}
                      </View>
                    );
                  }}
                />
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
              className="rounded-full w-6 h-6 flex items-center justify-center mr-2"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Text className="text-white text-sm font-bold">+</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-600">{expandedSections.walls ? '▼' : '▶'}</Text>
          </View>
        </TouchableOpacity>

        {expandedSections.walls && (
          <View className="bg-white p-4 rounded-lg mt-2 border border-gray-200">
            {wallsFields.map((field, index) => (
              <View key={field.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <View className="flex flex-row items-center justify-between mb-2">
                  <Controller
                    control={control}
                    name={`structural_materials.wallsPartitions.${index}.wallName`}
                    rules={{ required: 'Wall name is required' }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Wall/Partition name"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-rubik text-black-300 bg-white mr-2"
                      />
                    )}
                  />
                  {wallsFields.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeWall(index)}
                      className="bg-red-500 rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <Text className="text-white text-sm font-bold">×</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View className="mb-2">
                  <Controller
                    control={control}
                    name={`structural_materials.wallsPartitions.${index}.material`}
                    rules={{ required: 'Material selection is required' }}
                    render={({ field: { onChange, value } }) => (
                      <MaterialDropdown
                        value={value}
                        onValueChange={onChange}
                        options={wallsOptions}
                        placeholder="Select wall material"
                        dropdownId={`wall-${field.id}`}
                      />
                    )}
                  />
                </View>

                <Controller
                  control={control}
                  name={`structural_materials.wallsPartitions.${index}.otherSpecify`}
                  render={({ field: { onChange, onBlur, value } }) => {
                    const material = watch(`structural_materials.wallsPartitions.${index}.material`);
                    return (
                      <View>
                        {material === 'Others (Specify)' && (
                          <TextInput
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            placeholder="Please specify..."
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-rubik text-black-300 bg-white"
                          />
                        )}
                      </View>
                    );
                  }}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Error Messages */}
      {Object.keys(errors.structural_materials || {}).length > 0 && (
        <View className="mt-2 p-2 bg-red-50 rounded-lg">
          {Object.entries(errors.structural_materials || {}).map(([field, error]) => (
            <Text key={field} className="text-red-500 text-xs font-rubik">
              • {error?.message || `${field} has an error`}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default StructuralMaterialsFormAdapted;