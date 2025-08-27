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
  ScrollView
} from 'react-native'
import React, { useState } from 'react'
import { useFormContext, Controller, useFieldArray } from 'react-hook-form'
import * as ImagePicker from 'expo-image-picker'
import { FloorArea } from '@/types';

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

  // Watch form values
  const structuralType = watch('general_description.structuralType');
  const kindOfBuilding = watch('general_description.kindOfBuilding');
  const floorAreas = watch('general_description.floorAreas');
  const floorPlanImages = watch('general_description.floorPlanImages');

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

  // Calculate total floor area
  React.useEffect(() => {
    const total = floorAreas?.reduce((sum: number, floor: FloorArea) => {
      const area = parseFloat(floor.area) || 0;
      return sum + area;
    }, 0) || 0;
    setValue('general_description.totalFloorArea', total.toString());
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const renderDropdown = (
    name: string,
    options: string[],
    placeholder: string = "Select option",
    rules?: any
  ) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, value } }) => (
          <View className="relative">
            <TouchableOpacity
              onPress={() => setIsOpen(!isOpen)}
              className={`border rounded-lg px-4 py-3 bg-white flex flex-row items-center justify-between ${getError(name) ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <Text
                className={`text-base font-rubik ${value ? 'text-black-300' : 'text-gray-400'}`}
              >
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
                      onPress={() => {
                        onChange(option);
                        setIsOpen(false);
                      }}
                      className="px-3 py-2 border-b border-gray-100"
                    >
                      <Text className="text-base font-rubik text-black-300">{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
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
      <Text className="text-lg font-rubik-bold text-black-300 mb-4">General Description</Text>

      {/* Structural Type Dropdown */}
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">
          Structural Type <Text className="text-red-500">*</Text>
        </Text>
        {renderDropdown(
          'general_description.structuralType',
          Object.keys(constructionCosts),
          "Select structural type",
          { required: 'Structural Type is required' }
        )}
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
        {renderDropdown(
          'general_description.kindOfBuilding',
          availableBuildingTypes,
          structuralType ? "Select kind of building" : "Select structural type first",
          { required: 'Kind of Building is required' }
        )}
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
      {renderInput('general_description.completionCertificateDate', 'Certificate of Completion Issued On', 'MM/DD/YYYY')}
      {renderInput('general_description.occupancyCertificateDate', 'Certificate of Occupancy Issued On', 'MM/DD/YYYY')}
      {renderInput('general_description.dateConstructed', 'Date Constructed / Completed', 'MM/DD/YYYY')}
      {renderInput('general_description.dateOccupied', 'Date Occupied', 'MM/DD/YYYY')}
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
            className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center"
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
                rules={{ required: 'Floor name is required' }}
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
                  required: 'Area is required',
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

      {/* Floor Plan Images Upload */}
      <View className="mb-4">
        <View className="flex flex-row items-center justify-between mb-3">
          <Text className="text-base font-rubik-medium text-black-300">
            Floor Plan Images
          </Text>
          <TouchableOpacity
            onPress={showImageOptions}
            className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center"
          >
            <Text className="text-white text-lg font-bold">+</Text>
          </TouchableOpacity>
        </View>

        {floorPlanImages && floorPlanImages.length > 0 ? (
          <View>
            <FlatList
              data={floorPlanImages}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
            <Text className="text-sm font-rubik text-gray-500 mt-2">
              {floorPlanImages.length} image(s) • Tap image to view fullscreen
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={showImageOptions}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center"
          >
            <Text className="text-4xl mb-2">📋</Text>
            <Text className="text-base font-rubik-medium text-gray-600">Tap to add floor plan images</Text>
            <Text className="text-sm font-rubik text-gray-400">Camera • Gallery • Multiple selection</Text>
          </TouchableOpacity>
        )}
      </View>

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