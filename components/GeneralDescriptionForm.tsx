// GeneralDescriptionFormAdapted.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Modal,
  Dimensions,
  ScrollView,
  Platform,
  StatusBar
} from 'react-native'
import React, { useState } from 'react'
import { useFormContext, Controller, useFieldArray, useWatch } from 'react-hook-form'
import * as ImagePicker from 'expo-image-picker'
import { FloorArea } from '@/types';
import { PRIMARY_COLOR } from '@/constants/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FloorPlanDrawing from './FloorPlanDrawing';
import DrawingPreview from './DrawingPreview';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Keep your constructionCosts object here...
export const constructionCosts: Record<string, Record<string, number | null>> = {
  'I-A': {
    Residential: 1700,
    Accessoria: 0,
    Apartment: 0,
    Garage: 2370,
    School: 2540,
    Hotel: 3670,
    Theatre: 3730,
    Restaurant: 2470,
    Factory: 1730,
    Gym: 2470,
    Bowling_Lanes: 3260,
    Mills: 2710,
    Swimming_Pools: null,
    Gas_Station: null,
    Animal_Shed: 990
  },
  'I-B': {
    Residential: 4500,
    Accessoria: 2940,
    Apartment: 2940,
    Garage: 2370,
    School: 2540,
    Hotel: 3960,
    Theatre: 3970,
    Restaurant: 2670,
    Factory: 1930,
    Gym: 2670,
    Bowling_Lanes: 3080,
    Mills: 1760,
    Swimming_Pools: null,
    Gas_Station: null,
    Animal_Shed: 1300
  },
  'II-A': {
    Residential: 3400,
    Accessoria: 2640,
    Apartment: 2700,
    Garage: 2150,
    School: 2070,
    Hotel: 3350,
    Theatre: 3410,
    Restaurant: 2370,
    Factory: 1530,
    Gym: 2370,
    Bowling_Lanes: 3190,
    Mills: 3110,
    Swimming_Pools: 2680,
    Gas_Station: null,
    Animal_Shed: 1160
  },
  'II-B': {
    Residential: 4300,
    Accessoria: 3580,
    Apartment: 3700,
    Garage: 3160,
    School: 3020,
    Hotel: 4260,
    Theatre: 4320,
    Restaurant: 3270,
    Factory: 2430,
    Gym: 3270,
    Bowling_Lanes: 4190,
    Mills: 3710,
    Swimming_Pools: null,
    Gas_Station: null,
    Animal_Shed: null
  },
  'III-A': {
    Residential: 3800,
    Accessoria: 3280,
    Apartment: 3300,
    Garage: 2700,
    School: 2800,
    Hotel: 3870,
    Theatre: 3930,
    Restaurant: 2870,
    Factory: 2030,
    Gym: 2870,
    Bowling_Lanes: 5300,
    Mills: 4280,
    Swimming_Pools: null,
    Gas_Station: null,
    Animal_Shed: null
  },
  'III-B': {
    Residential: 5300,
    Accessoria: 4910,
    Apartment: 4600,
    Garage: 4200,
    School: 3980,
    Hotel: 5290,
    Theatre: 5350,
    Restaurant: 4290,
    Factory: 3450,
    Gym: 4290,
    Bowling_Lanes: null,
    Mills: null,
    Swimming_Pools: null,
    Gas_Station: null,
    Animal_Shed: null
  },
  'IV-A': {
    Residential: 4900,
    Accessoria: 4200,
    Apartment: 3900,
    Garage: 3730,
    School: 3490,
    Hotel: 4800,
    Theatre: 4860,
    Restaurant: 3800,
    Factory: 2960,
    Gym: 3800,
    Bowling_Lanes: null,
    Mills: null,
    Swimming_Pools: null,
    Gas_Station: null,
    Animal_Shed: null
  },
  'IV-B': {
    Residential: 5500,
    Accessoria: 5910,
    Apartment: 6500,
    Garage: 5170,
    School: 4970,
    Hotel: 5820,
    Theatre: 5880,
    Restaurant: 4820,
    Factory: 3980,
    Gym: 4820,
    Bowling_Lanes: null,
    Mills: null,
    Swimming_Pools: null,
    Gas_Station: 5000,
    Animal_Shed: null
  },
  'V-A': {
    Residential: 5400,
    Accessoria: 5600,
    Apartment: 6000,
    Garage: 4910,
    School: 5920,
    Hotel: null,
    Theatre: null,
    Restaurant: null,
    Factory: null,
    Gym: null,
    Bowling_Lanes: 8670,
    Mills: 6150,
    Swimming_Pools: 3590,
    Gas_Station: 5000,
    Animal_Shed: null
  },
  'V-B': {
    Residential: null,
    Accessoria: null,
    Apartment: null,
    Garage: null,
    School: null,
    Hotel: null,
    Theatre: 7660,
    Restaurant: 5190,
    Factory: 4160,
    Gym: 4800,
    Bowling_Lanes: 7560,
    Mills: 5600,
    Swimming_Pools: 3350,
    Gas_Station: 3850,
    Animal_Shed: null
  }
};

const GeneralDescriptionFormAdapted: React.FC = () => {
  const { control, watch, setValue, formState: { errors } } = useFormContext();
  const { fields: floorFields, append: appendFloor, remove: removeFloor } = useFieldArray({
    control,
    name: 'general_description.floorAreas'
  });

  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [availableBuildingTypes, setAvailableBuildingTypes] = useState<string[]>([]);
  const [isDrawingVisible, setIsDrawingVisible] = useState(false);
  const [floorPlanDrawings, setFloorPlanDrawings] = useState<string[]>([]);
  const [isDrawingGalleryVisible, setIsDrawingGalleryVisible] = useState(false);
  const [selectedDrawingIndex, setSelectedDrawingIndex] = useState(0);
  const [editingDrawingIndex, setEditingDrawingIndex] = useState<number | null>(null);

  // Watch form values
  const structuralType = watch('general_description.structuralType');
  const kindOfBuilding = watch('general_description.kindOfBuilding');
  const floorAreas = useWatch({ control, name: 'general_description.floorAreas' });
  const floorPlanImages = watch('general_description.floorPlanImages');
  const formFloorPlanDrawings = watch('general_description.floorPlanDrawings');

  // Sync local state with form data for drawings
  React.useEffect(() => {
    if (formFloorPlanDrawings && Array.isArray(formFloorPlanDrawings)) {
      setFloorPlanDrawings(formFloorPlanDrawings);
    } else {
      // Initialize empty array if not set
      setValue('general_description.floorPlanDrawings', []);
      setFloorPlanDrawings([]);
    }
  }, [formFloorPlanDrawings, setValue]);

  // Update available building types when structural type changes
  React.useEffect(() => {
    if (structuralType) {
      const buildingTypes = Object.keys(constructionCosts[structuralType] || {})
        .filter(buildingType => constructionCosts[structuralType][buildingType] !== null);
      setAvailableBuildingTypes(buildingTypes);

      // Reset kind of building when structural type changes
      if (kindOfBuilding && !buildingTypes.includes(kindOfBuilding)) {
        setValue('general_description.kindOfBuilding', '');
      }
    }
  }, [structuralType, kindOfBuilding, setValue]);

  // When structural type and kind of building are selected, populate the
  // derived unit cost into general_description.unit_value so other components
  // (e.g., AdditionalItems) can read a single canonical field.
  React.useEffect(() => {
    if (structuralType && kindOfBuilding) {
      const cost = constructionCosts[structuralType]?.[kindOfBuilding];
      const costStr = cost != null ? String(cost) : '';
      const current = watch('general_description.unit_value') || '';
      if (current !== costStr) {
        setValue('general_description.unit_value', costStr);
      }
    } else {
      // Clear unit_value when selection is incomplete
      const current = watch('general_description.unit_value') || '';
      if (current !== '') setValue('general_description.unit_value', '');
    }
  }, [structuralType, kindOfBuilding, setValue, watch]);

  // Calculate total floor area
  React.useEffect(() => {
    const total = floorAreas?.reduce((sum: number, floor: FloorArea) => {
      const area = parseFloat(floor.area) || 0;
      return sum + area;
    }, 0) || 0;
    setValue('general_description.totalFloorArea', total.toString(), { shouldDirty: true });
  }, [floorAreas, setValue]);

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
            // required: `${label} is required`,
            // minLength: {
            //   value: 1,
            //   message: `${label} cannot be empty`
            // },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              className={`border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white h-12 ${error ? 'border-red-500' : 'border-gray-300'
                }`}
              keyboardType={keyboardType}
              textAlignVertical="center"
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

  // Date picker field (uses dynamic require of @react-native-community/datetimepicker)
  let DateTimePicker: any = null;
  const DatePickerField: React.FC<{ name: string; label: string; placeholder?: string }> = ({ name, label, placeholder }) => {
    const error = getError(name);
    const [show, setShow] = useState(false);

    return (
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">
          {label} <Text className="text-red-500">*</Text>
        </Text>
        <Controller
          control={control}
          name={name}
          render={({ field: { onChange, value } }) => {
            const openPicker = () => {
              try {
                // @ts-ignore
                DateTimePicker = require('@react-native-community/datetimepicker').default;
                setShow(true);
              } catch (e) {
                Alert.alert('Install dependency', 'Please run: expo install @react-native-community/datetimepicker');
              }
            };

            const onChangeNative = (event: any, selectedDate?: Date) => {
              setShow(Platform.OS === 'ios');
              if (selectedDate) {
                // store ISO date string (date only)
                const iso = selectedDate.toISOString();
                onChange(iso);
              }
            };

            const displayValue = value ? new Date(value).toLocaleDateString() : (placeholder || 'Select date');

            return (
              <>
                <TouchableOpacity onPress={openPicker} className={`border rounded-lg px-4 py-3 bg-white ${error ? 'border-red-500' : 'border-gray-300'}`}>
                  <Text style={{ color: value ? '#000' : '#9ca3af' }}>{displayValue}</Text>
                </TouchableOpacity>
                {show && DateTimePicker ? (
                  <DateTimePicker
                    value={value ? new Date(value) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                    onChange={onChangeNative}
                  />
                ) : null}
              </>
            );
          }}
        />
        {error && (
          <Text className="text-red-500 text-sm font-rubik mt-1">{error.message as string}</Text>
        )}
      </View>
    );
  };

  const addFloorArea = () => {
    const newFloor: FloorArea = {
      id: Date.now().toString(),
      floorNumber: `Floor ${floorFields.length + 1}`,
      area: '',
    };
    appendFloor(newFloor);
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Floor Plan Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const currentImages = watch('general_description.floorPlanImages') || [];
        const newImages = [...currentImages, result.assets[0].uri];
        setValue('general_description.floorPlanImages', newImages);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const currentImages = watch('general_description.floorPlanImages') || [];
        const newImageUris = result.assets.map(asset => asset.uri);
        const updatedImages = [...currentImages, ...newImageUris];
        setValue('general_description.floorPlanImages', updatedImages);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (index: number) => {
    const currentImages = watch('general_description.floorPlanImages') || [];
    const updatedImages = currentImages.filter((_: string, i: number) => i !== index);
    setValue('general_description.floorPlanImages', updatedImages);
  };

  const openGallery = (index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryVisible(true);
  };

  const handleSaveDrawing = (drawingData: string, imageBase64?: string) => {
    console.log('Saving drawing data:', drawingData);
    const currentDrawings = [...floorPlanDrawings];

    if (editingDrawingIndex !== null) {
      // Update existing drawing
      currentDrawings[editingDrawingIndex] = drawingData;
      setEditingDrawingIndex(null);
      console.log('Updated existing drawing at index:', editingDrawingIndex);
    } else {
      // Add new drawing
      currentDrawings.push(drawingData);
      console.log('Added new drawing, total drawings:', currentDrawings.length);
    }

    setFloorPlanDrawings(currentDrawings);
    setValue('general_description.floorPlanDrawings', currentDrawings);

    // Add the converted image to floor plan images if provided
    if (imageBase64) {
      const currentImages = watch('general_description.floorPlanImages') || [];
      const newImages = [...currentImages, imageBase64];
      setValue('general_description.floorPlanImages', newImages);
      console.log('Added drawing as image to floor plan images, total images:', newImages.length);
    }

    console.log('Floor plan drawings state updated:', currentDrawings.length);
  };

  const removeDrawing = (index: number) => {
    const updatedDrawings = floorPlanDrawings.filter((_, i) => i !== index);
    setFloorPlanDrawings(updatedDrawings);
    setValue('general_description.floorPlanDrawings', updatedDrawings);
  };

  const showFloorPlanOptions = () => {
    Alert.alert(
      'Add Floor Plan',
      'Choose how to create your floor plan',
      [
        { text: 'Draw Floor Plan', onPress: () => setIsDrawingVisible(true) },
        { text: 'Upload Image', onPress: showImageOptions },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openDrawingGallery = (index: number) => {
    setSelectedDrawingIndex(index);
    setIsDrawingGalleryVisible(true);
  };

  const editDrawing = (index: number) => {
    setEditingDrawingIndex(index);
    setIsDrawingVisible(true);
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => (
    <View className="relative mr-3">
      <TouchableOpacity onPress={() => openGallery(index)}>
        <Image
          source={{ uri: item }}
          className="w-24 h-24 rounded-lg"
          resizeMode="cover"
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => removeImage(index)}
        className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center"
      >
        <Text className="text-white text-sm font-bold">×</Text>
      </TouchableOpacity>
    </View>
  );

  // Dropdown field using Modal for better z-index handling
  const DropdownField: React.FC<{
    name: string;
    options: string[];
    placeholder?: string;
    rules?: any;
  }> = ({ name, options, placeholder = 'Select option', rules }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { control: formControl, formState } = useFormContext();

    const getNested = (obj: any, path: string) =>
      path.split('.').reduce((acc: any, key: string) => (acc ? acc[key] : undefined), obj);

    const fieldError = getNested(formState.errors, name);

    return (
      <Controller
        control={formControl}
        name={name}
        rules={rules}
        render={({ field: { onChange, value } }) => (
          <View>
            <TouchableOpacity
              onPress={() => setIsOpen(true)}
              className={`border rounded-lg px-4 py-3 bg-white flex flex-row items-center justify-between ${fieldError ? 'border-red-500' : 'border-gray-300'}`}
            >
              <Text className={`text-base font-rubik ${value ? 'text-black-300' : 'text-gray-400'}`}>
                {value || placeholder}
              </Text>
              <Text className="text-gray-600">▼</Text>
            </TouchableOpacity>

            <Modal
              visible={isOpen}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setIsOpen(false)}
            >
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
                activeOpacity={1}
                onPress={() => setIsOpen(false)}
              >
                <View style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 20
                }}>
                  <TouchableOpacity
                    activeOpacity={1}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 12,
                      maxHeight: screenHeight * 0.6,
                      width: '100%',
                      maxWidth: 400,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 10,
                    }}
                  >
                    <View style={{
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      borderBottomWidth: 1,
                      borderBottomColor: '#e5e7eb'
                    }}>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: '#374151',
                        textAlign: 'center'
                      }}>
                        {placeholder}
                      </Text>
                    </View>

                    <ScrollView
                      style={{ maxHeight: screenHeight * 0.4 }}
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                    >
                      {options.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            onChange(option);
                            setIsOpen(false);
                          }}
                          style={{
                            paddingVertical: 16,
                            paddingHorizontal: 20,
                            borderBottomWidth: index < options.length - 1 ? 1 : 0,
                            borderBottomColor: '#f3f4f6',
                            backgroundColor: value === option ? '#f0f9ff' : 'transparent'
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={{
                            fontSize: 16,
                            color: value === option ? '#0369a1' : '#374151',
                            fontWeight: value === option ? '600' : '400'
                          }}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )}
      />
    );
  };

  const renderFullscreenImage = ({ item }: { item: string }) => (
    <View style={{ width: screenWidth, height: screenHeight, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={{ uri: item }}
        style={{ width: screenWidth, height: screenWidth * 0.75 }}
        resizeMode="contain"
      />
    </View>
  );

  return (
    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
      <View className="flex-row items-center justify-between mb-4 p-3 bg-blue-100 rounded-lg border-l-4" style={{ borderLeftColor: PRIMARY_COLOR }}>
        <Text className="text-lg font-bold" style={{ color: PRIMARY_COLOR }}>GENERAL DESCRIPTION</Text>
        <Icon name="assessment" size={24} style={{ color: PRIMARY_COLOR }} />
      </View>

      {/* Structural Type Dropdown */}
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">
          Structural Type <Text className="text-red-500">*</Text>
        </Text>
        <DropdownField
          name={'general_description.structuralType'}
          options={Object.keys(constructionCosts)}
          placeholder="Select structural type"
        // rules={{ required: 'Structural Type is required' }}
        />
        {getError('general_description.structuralType') && (
          <Text className="text-red-500 text-sm font-rubik mt-1">
            {getError('general_description.structuralType')?.message as string}
          </Text>
        )}
      </View>

      {/* Kind of Building Dropdown */}
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">
          Kind of Building <Text className="text-red-500">*</Text>
        </Text>
        <DropdownField
          name={'general_description.kindOfBuilding'}
          options={availableBuildingTypes}
          placeholder={structuralType ? 'Select kind of building' : 'Select structural type first'}
        // rules={{ required: 'Kind of Building is required' }}
        />
        {getError('general_description.kindOfBuilding') && (
          <Text className="text-red-500 text-sm font-rubik mt-1">
            {getError('general_description.kindOfBuilding')?.message as string}
          </Text>
        )}
        {structuralType && kindOfBuilding && (
          <View className="mt-2 p-3 bg-blue-50 rounded-lg">
            <Text className="text-sm font-rubik text-blue-800">
              Unit Cost: ₱{constructionCosts[structuralType]?.[kindOfBuilding]?.toLocaleString() || 'N/A'} per sq.m
            </Text>
          </View>
        )}
      </View>

      {renderInput('general_description.buildingPermitNo', 'Bldg. Permit No.', 'Building permit number')}
      {renderInput('general_description.condominiumCCT', 'Condominium Certificate of Title (CCT)', 'CCT number if applicable')}
      <DatePickerField name={'general_description.completionCertificateDate'} label={'Certificate of Completion Issued On'} placeholder={'MM/DD/YYYY'} />
      <DatePickerField name={'general_description.occupancyCertificateDate'} label={'Certificate of Occupancy Issued On'} placeholder={'MM/DD/YYYY'} />
      <DatePickerField name={'general_description.dateConstructed'} label={'Date Constructed / Completed'} placeholder={'MM/DD/YYYY'} />
      <DatePickerField name={'general_description.dateOccupied'} label={'Date Occupied'} placeholder={'MM/DD/YYYY'} />
      {renderInput('general_description.buildingAge', 'Building Age', 'Age in years', 'numeric')}
      {renderInput('general_description.numberOfStoreys', 'No of Storeys', 'Number of floors', 'numeric')}

      {/* Dynamic Floor Areas */}
      <View className="mb-4">
        <View className="flex flex-row items-center justify-between mb-3">
          <Text className="text-base font-rubik-medium text-black-300">
            Floor Areas <Text className="text-red-500">*</Text>
          </Text>
          <TouchableOpacity
            onPress={addFloorArea}
            style={{ backgroundColor: PRIMARY_COLOR }}
            className="rounded-full w-8 h-8 flex items-center justify-center"
          >
            <Text className="text-white text-lg font-bold">+</Text>
          </TouchableOpacity>
        </View>

        {floorFields.map((field, index) => (
          <View key={field.id} className="flex flex-row items-center mb-3 bg-gray-50 p-3 rounded-lg">
            <View className="flex-1 mr-3">
              <Controller
                control={control}
                name={`general_description.floorAreas.${index}.floorNumber`}
                // rules={{ required: 'Floor name is required' }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Floor name"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-rubik text-black-300 bg-white h-10 mb-2"
                  />
                )}
              />
              <Controller
                control={control}
                name={`general_description.floorAreas.${index}.area`}
                rules={{
                  // required: 'Area is required',
                  pattern: {
                    value: /^[0-9.]+$/,
                    message: 'Area must be a valid number'
                  }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Area (sq.m)"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-rubik text-black-300 bg-white h-10"
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
            {floorFields.length > 1 && (
              <TouchableOpacity
                onPress={() => removeFloor(index)}
                className="bg-red-500 rounded-full w-6 h-6 flex items-center justify-center"
              >
                <Text className="text-white text-sm font-bold">×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Total Floor Area */}
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">
          Total Floor Area <Text className="text-gray-500">(Auto-calculated)</Text>
        </Text>
        <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-100">
          <Text className="text-base font-rubik text-black-300">
            {watch('general_description.totalFloorArea') || '0'} sq.m
          </Text>
        </View>
      </View>

      {/* Floor Plan Section */}
      <View className="mb-4">
        <View className="flex flex-row items-center justify-between mb-3">
          <Text className="text-base font-rubik-medium text-black-300">
            Floor Plans
          </Text>
          <TouchableOpacity
            onPress={showFloorPlanOptions}
            className="rounded-full w-8 h-8 flex items-center justify-center"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Text className="text-white text-lg font-bold">+</Text>
          </TouchableOpacity>
        </View>

        {/* Drawings Section */}
        {floorPlanDrawings.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-rubik-medium text-gray-600 mb-2">Drawings</Text>
            <FlatList
              data={floorPlanDrawings}
              renderItem={({ item, index }) => (
                <View className="relative mr-3">
                  <DrawingPreview
                    drawingData={item}
                    width={96}
                    height={96}
                    onPress={() => openDrawingGallery(index)}
                    style={{ borderWidth: 1, borderColor: '#e5e7eb' }}
                  />
                  {/* Edit Button */}
                  <TouchableOpacity
                    onPress={() => editDrawing(index)}
                    className="absolute top-1 left-1 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <Icon name="edit" size={12} color="white" />
                  </TouchableOpacity>
                  {/* Delete Button */}
                  <TouchableOpacity
                    onPress={() => removeDrawing(index)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <Text className="text-white text-sm font-bold">×</Text>
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
          </View>
        )}

        {/* Images Section */}
        {floorPlanImages && floorPlanImages.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-rubik-medium text-gray-600 mb-2">Images</Text>
            <FlatList
              data={floorPlanImages}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
          </View>
        )}

        {/* Empty State */}
        {(!floorPlanImages || floorPlanImages.length === 0) && floorPlanDrawings.length === 0 && (
          <TouchableOpacity
            onPress={showFloorPlanOptions}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center"
          >
            <Text className="text-4xl mb-2">🏗️</Text>
            <Text className="text-base font-rubik-medium text-gray-600">Create or Upload Floor Plans</Text>
            <Text className="text-sm font-rubik text-gray-400">Draw • Camera • Gallery</Text>
          </TouchableOpacity>
        )}

        {/* Summary */}
        {(floorPlanImages?.length > 0 || floorPlanDrawings.length > 0) && (
          <Text className="text-sm font-rubik text-gray-500 mt-2">
            {floorPlanDrawings.length} drawing(s) • {floorPlanImages?.length || 0} image(s)
          </Text>
        )}
      </View>

      {/* FloorPlanDrawing Component */}
      <FloorPlanDrawing
        visible={isDrawingVisible}
        onClose={() => {
          setIsDrawingVisible(false);
          setEditingDrawingIndex(null);
        }}
        onSave={handleSaveDrawing}
        initialDrawing={editingDrawingIndex !== null ? floorPlanDrawings[editingDrawingIndex] : undefined}
        floorPlanImages={floorPlanImages}
      />

      {/* Drawing Gallery Modal */}
      <Modal
        visible={isDrawingGalleryVisible}
        animationType="fade"
        onRequestClose={() => setIsDrawingGalleryVisible(false)}
      >
        <View className="flex-1 bg-black">
          {/* Header */}
          <View className="absolute top-12 left-0 right-0 z-10 flex flex-row items-center justify-between px-5">
            <TouchableOpacity
              onPress={() => setIsDrawingGalleryVisible(false)}
              className="bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              <Text className="text-white text-lg font-bold">×</Text>
            </TouchableOpacity>
            <Text className="text-white text-base font-rubik-medium">
              Drawing {selectedDrawingIndex + 1} of {floorPlanDrawings.length}
            </Text>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  editDrawing(selectedDrawingIndex);
                  setIsDrawingGalleryVisible(false);
                }}
                className="bg-blue-500/80 rounded-full w-10 h-10 flex items-center justify-center mr-2"
              >
                <Icon name="edit" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  removeDrawing(selectedDrawingIndex);
                  if (floorPlanDrawings.length === 1) {
                    setIsDrawingGalleryVisible(false);
                  } else if (selectedDrawingIndex >= floorPlanDrawings.length - 1) {
                    setSelectedDrawingIndex(Math.max(0, selectedDrawingIndex - 1));
                  }
                }}
                className="bg-red-500/80 rounded-full w-10 h-10 flex items-center justify-center"
              >
                <Text className="text-white text-lg font-bold">🗑</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Drawing Gallery */}
          <FlatList
            data={floorPlanDrawings}
            renderItem={({ item }) => (
              <View style={{ width: screenWidth, height: screenHeight, justifyContent: 'center', alignItems: 'center' }}>
                <DrawingPreview
                  drawingData={item}
                  width={screenWidth - 40}
                  height={screenHeight * 0.7}
                  style={{ backgroundColor: 'white' }}
                />
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedDrawingIndex}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setSelectedDrawingIndex(index);
            }}
            getItemLayout={(data, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />

          {/* Drawing Indicators */}
          {floorPlanDrawings.length > 1 && (
            <View className="absolute bottom-12 left-0 right-0 flex flex-row justify-center">
              {floorPlanDrawings.map((_, index) => (
                <View
                  key={index}
                  className={`w-2 h-2 rounded-full mx-1 ${index === selectedDrawingIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>

      {/* Fullscreen Gallery Modal */}
      <Modal
        visible={isGalleryVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsGalleryVisible(false)}
      >
        <View className="flex-1 bg-black">
          {/* Header */}
          <View className="absolute top-12 left-0 right-0 z-10 flex flex-row items-center justify-between px-5">
            <TouchableOpacity
              onPress={() => setIsGalleryVisible(false)}
              className="bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              <Text className="text-white text-lg font-bold">×</Text>
            </TouchableOpacity>
            <Text className="text-white text-base font-rubik-medium">
              {selectedImageIndex + 1} of {floorPlanImages?.length || 0}
            </Text>
            <TouchableOpacity
              onPress={() => {
                removeImage(selectedImageIndex);
                if (floorPlanImages.length === 1) {
                  setIsGalleryVisible(false);
                } else if (selectedImageIndex >= floorPlanImages.length - 1) {
                  setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
                }
              }}
              className="bg-red-500/80 rounded-full w-10 h-10 flex items-center justify-center"
            >
              <Text className="text-white text-lg font-bold">🗑</Text>
            </TouchableOpacity>
          </View>

          {/* Image Gallery */}
          <FlatList
            data={floorPlanImages}
            renderItem={renderFullscreenImage}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedImageIndex}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setSelectedImageIndex(index);
            }}
            getItemLayout={(data, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />

          {/* Image Indicators */}
          {floorPlanImages && floorPlanImages.length > 1 && (
            <View className="absolute bottom-12 left-0 right-0 flex flex-row justify-center">
              {floorPlanImages.map((image: string, index: number) => (
                <View
                  key={index}
                  className={`w-2 h-2 rounded-full mx-1 ${index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default GeneralDescriptionFormAdapted;