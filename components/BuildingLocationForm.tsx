import { View, Text, TextInput, Image, TouchableOpacity, Alert, ScrollView, Platform, Modal, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { PRIMARY_COLOR } from '@/constants/colors';

const BuildingLocationForm: React.FC = () => {
  const { control, formState: { errors } } = useFormContext();

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
            }
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

  // Image picker helpers (mirror GeneralDescriptionForm behavior)
  const windowWidth = Dimensions.get('window').width;
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { setValue, watch } = useFormContext() as any;

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Permission to access photos is required to upload building images.');
        }
      }
    })();
  }, []);

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

      if (!result.canceled && result.assets && result.assets[0]) {
        const currentImages = watch('building_location.buildingImages') || [];
        const newImages = [...currentImages, result.assets[0].uri];
        setValue('building_location.buildingImages', newImages);
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

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const currentImages = watch('building_location.buildingImages') || [];
        const newImageUris = result.assets.map((asset: any) => asset.uri);
        const updatedImages = [...currentImages, ...newImageUris];
        setValue('building_location.buildingImages', updatedImages);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (index: number) => {
    const currentImages = watch('building_location.buildingImages') || [];
    const updatedImages = currentImages.filter((_: string, i: number) => i !== index);
    setValue('building_location.buildingImages', updatedImages);
  };

  const openGallery = (index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryVisible(true);
  };

  const renderImageUploader = () => {
    const images: string[] = watch('building_location.buildingImages') || [];

    return (
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">Building Images</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {images.map((uri, idx) => (
            <View key={uri + idx} style={{ marginRight: 8, position: 'relative' }}>
              <TouchableOpacity onPress={() => openGallery(idx)}>
                <Image source={{ uri }} style={{ width: 96, height: 72, borderRadius: 8 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeImage(idx)} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 12, padding: 2, elevation: 4 }}>
                <Icon name="close" size={16} color="#333" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={showImageOptions} style={{ width: 96, height: 72, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="add-a-photo" size={22} color={PRIMARY_COLOR} />
            <Text style={{ fontSize: 11, color: PRIMARY_COLOR }}>Add</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={isGalleryVisible} animationType="slide" onRequestClose={() => setIsGalleryVisible(false)} transparent={false}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <View style={{ position: 'absolute', top: 40, right: 16, zIndex: 20 }}>
              <TouchableOpacity onPress={() => setIsGalleryVisible(false)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 }}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              contentOffset={{ x: selectedImageIndex * windowWidth, y: 0 }}
              showsHorizontalScrollIndicator={false}
            >
              {images.map((uri, i) => (
                <View key={uri + i} style={{ width: windowWidth, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={{ uri }} style={{ width: windowWidth, height: windowWidth * 0.75, resizeMode: 'contain' }} />
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
      <View className="flex-row items-center justify-between mb-4 p-3 bg-blue-100 rounded-lg border-l-4" style={{ borderLeftColor: PRIMARY_COLOR }}>
        <Text className="text-lg font-bold" style={{ color: PRIMARY_COLOR }}>BUILDING LOCATION</Text>
        <Icon name="assessment" size={24} style={{ color: PRIMARY_COLOR }} />
      </View>

      {renderInput('building_location.street', 'No. / Street', 'House/Building No. and Street')}
      {renderInput('building_location.barangay', 'Barangay', 'Barangay name')}
      {renderInput('building_location.municipality', 'Municipality', 'Municipality/City name')}
      {renderInput('building_location.province', 'Province', 'Province name')}
      {renderImageUploader()}
    </View>
  );
};

export default BuildingLocationForm;