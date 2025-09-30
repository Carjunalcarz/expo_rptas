import { View, Text, TextInput, Image, TouchableOpacity, Alert, ScrollView, Platform, Modal, Dimensions, Linking, ActivityIndicator, Clipboard } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { PRIMARY_COLOR } from '@/constants/colors';

const BuildingLocationForm: React.FC = () => {
  const { control, formState: { errors }, setValue, watch } = useFormContext();
  const windowWidth = Dimensions.get('window').width;
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [coordinateString, setCoordinateString] = useState('');
  const [isGeneratingLocation, setIsGeneratingLocation] = useState(false);

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

  // Image picker helpers
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

  // Fixed location generation function
  const generateLocation = async () => {
    if (isGeneratingLocation) return;

    setIsGeneratingLocation(true);

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Location permission is required to generate coordinates. You can enter them manually instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Enter Manually', onPress: () => setManualModalVisible(true) }
          ]
        );
        return;
      }

      // Get current position with timeout
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });

      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Location request timed out')), 15000)
      );

      const position = await Promise.race([locationPromise, timeoutPromise]) as any;

      if (position && position.coords) {
        const { latitude, longitude } = position.coords;

        // Set the values in the form
        setValue('building_location.latitude', latitude.toString());
        setValue('building_location.longitude', longitude.toString());

        Alert.alert(
          'Location Generated',
          `Latitude: ${latitude.toFixed(6)}\nLongitude: ${longitude.toFixed(6)}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Location error:', error);

      let errorMessage = 'Failed to get your location.';
      if (error.message === 'Location request timed out') {
        errorMessage = 'Location request timed out. Please try again or enter coordinates manually.';
      } else if (error.code === 'CANCELLED') {
        errorMessage = 'Location request was cancelled.';
      }

      Alert.alert(
        'Location Error',
        errorMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enter Manually', onPress: () => setManualModalVisible(true) }
        ]
      );
    } finally {
      setIsGeneratingLocation(false);
    }
  };

  const viewOnMap = () => {
    const lat = watch('building_location.latitude');
    const lon = watch('building_location.longitude');

    if (!lat || !lon) {
      Alert.alert('No Coordinates', 'Please generate or enter coordinates first.');
      return;
    }

    // Format the URL based on platform
    let url;
    if (Platform.OS === 'ios') {
      url = `http://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent('Building Location')}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps application.');
    });
  };

  // Enhanced coordinate parsing functions
  const parseCoordinateString = (coordStr: string) => {
    // Remove extra whitespace and normalize
    const cleaned = coordStr.trim().replace(/\s+/g, ' ');
    
    // Try different coordinate formats
    const patterns = [
      // Google Maps format: "14.5995, 120.9842"
      /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/,
      // Google Maps format with spaces: "14.5995 120.9842"
      /^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/,
      // DMS format: "14°35'58.2"N 120°59'03.1"E"
      /^(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])$/,
      // Decimal with N/S E/W: "14.5995°N, 120.9842°E"
      /^(-?\d+\.?\d*)°?([NS])?,?\s*(-?\d+\.?\d*)°?([EW])?$/,
      // URL format: "@14.5995,120.9842"
      /^@?(-?\d+\.?\d*),(-?\d+\.?\d*)$/,
      // Parentheses format: "(14.5995, 120.9842)"
      /^\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)$/
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        if (pattern.source.includes('°')) {
          // Handle DMS format
          if (match.length === 9) {
            const latDeg = parseInt(match[1]);
            const latMin = parseInt(match[2]);
            const latSec = parseFloat(match[3]);
            const latDir = match[4];
            const lonDeg = parseInt(match[5]);
            const lonMin = parseInt(match[6]);
            const lonSec = parseFloat(match[7]);
            const lonDir = match[8];

            let lat = latDeg + latMin/60 + latSec/3600;
            let lon = lonDeg + lonMin/60 + lonSec/3600;

            if (latDir === 'S') lat = -lat;
            if (lonDir === 'W') lon = -lon;

            return { latitude: lat.toFixed(6), longitude: lon.toFixed(6) };
          } else {
            // Handle decimal with direction
            let lat = parseFloat(match[1]);
            let lon = parseFloat(match[3]);
            
            if (match[2] === 'S') lat = -lat;
            if (match[4] === 'W') lon = -lon;
            
            return { latitude: lat.toFixed(6), longitude: lon.toFixed(6) };
          }
        } else {
          // Handle decimal formats
          const lat = parseFloat(match[1]);
          const lon = parseFloat(match[2]);
          
          if (!isNaN(lat) && !isNaN(lon)) {
            return { latitude: lat.toFixed(6), longitude: lon.toFixed(6) };
          }
        }
      }
    }
    
    return null;
  };

  const pasteFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      if (clipboardContent) {
        const parsed = parseCoordinateString(clipboardContent);
        if (parsed) {
          setManualLat(parsed.latitude);
          setManualLon(parsed.longitude);
          setCoordinateString(clipboardContent);
          Alert.alert('Success', 'Coordinates pasted and parsed successfully!');
        } else {
          // If parsing fails, just put the content in the coordinate string field
          setCoordinateString(clipboardContent);
          Alert.alert('Pasted', 'Content pasted. Please check the format and parse manually.');
        }
      } else {
        Alert.alert('Empty Clipboard', 'No content found in clipboard.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access clipboard.');
    }
  };

  const parseCoordinateInput = () => {
    if (!coordinateString.trim()) {
      Alert.alert('Empty Input', 'Please enter or paste coordinates first.');
      return;
    }

    const parsed = parseCoordinateString(coordinateString);
    if (parsed) {
      setManualLat(parsed.latitude);
      setManualLon(parsed.longitude);
      Alert.alert('Success', 'Coordinates parsed successfully!');
    } else {
      Alert.alert('Parse Error', 'Unable to parse coordinates. Please check the format.\n\nSupported formats:\n• 14.5995, 120.9842\n• 14.5995 120.9842\n• @14.5995,120.9842\n• (14.5995, 120.9842)');
    }
  };

  const saveManualCoords = () => {
    // Validate coordinates
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Invalid Input', 'Please enter valid numeric values for latitude and longitude.');
      return;
    }

    if (lat < -90 || lat > 90) {
      Alert.alert('Invalid Latitude', 'Latitude must be between -90 and 90 degrees.');
      return;
    }

    if (lon < -180 || lon > 180) {
      Alert.alert('Invalid Longitude', 'Longitude must be between -180 and 180 degrees.');
      return;
    }

    // Set the values and close the modal
    setValue('building_location.latitude', manualLat);
    setValue('building_location.longitude', manualLon);
    setManualModalVisible(false);

    Alert.alert(
      'Coordinates Saved',
      `Latitude: ${manualLat}\nLongitude: ${manualLon}`,
      [{ text: 'OK' }]
    );
  };

  // Pre-fill manual inputs with current values when modal opens
  useEffect(() => {
    if (manualModalVisible) {
      setManualLat(watch('building_location.latitude') || '');
      setManualLon(watch('building_location.longitude') || '');
    }
  }, [manualModalVisible]);

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

      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">Coordinates</Text>
        <View className="flex-row">
          <View className="flex-1 mr-2">
            <Controller
              control={control}
              name="building_location.latitude"
              render={({ field: { value } }) => (
                <TextInput
                  value={value}
                  placeholder="Latitude"
                  editable={false}
                  className="border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-gray-100 h-12 border-gray-300"
                />
              )}
            />
          </View>
          <View className="flex-1 ml-2">
            <Controller
              control={control}
              name="building_location.longitude"
              render={({ field: { value } }) => (
                <TextInput
                  value={value}
                  placeholder="Longitude"
                  editable={false}
                  className="border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-gray-100 h-12 border-gray-300"
                />
              )}
            />
          </View>
        </View>
      </View>

      {/* Location Action Buttons - Compact Modern Design */}
      <View className="mb-4">
        {/* Generate Location Button - Primary Action */}
        <TouchableOpacity
          onPress={generateLocation}
          disabled={isGeneratingLocation}
          style={{
            backgroundColor: isGeneratingLocation ? '#10b981' : '#059669',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            marginBottom: 12,
            minHeight: 44,
            shadowColor: '#059669',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }}
          className="items-center flex-row justify-center"
        >
          {isGeneratingLocation ? (
            <>
              <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
              <Text className="text-white font-rubik-bold text-base">Getting Location...</Text>
            </>
          ) : (
            <>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 8,
                padding: 4,
                marginRight: 8
              }}>
                <Icon name="my-location" size={18} color="#fff" />
              </View>
              <Text className="text-white font-rubik-bold text-base">Generate Location</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Secondary Action Buttons */}
        <View className="flex-row" style={{ gap: 8 }}>
          <TouchableOpacity
            onPress={viewOnMap}
            style={{
              flex: 1,
              backgroundColor: '#3b82f6',
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              minHeight: 40,
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
            className="items-center flex-row justify-center"
          >
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 6,
              padding: 3,
              marginRight: 6
            }}>
              <Icon name="map" size={16} color="#fff" />
            </View>
            <Text className="text-white font-rubik-semibold text-sm">View Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setManualModalVisible(true)}
            style={{
              flex: 1,
              backgroundColor: '#6366f1',
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              minHeight: 40,
              shadowColor: '#6366f1',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
            className="items-center flex-row justify-center"
          >
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 6,
              padding: 3,
              marginRight: 6
            }}>
              <Icon name="edit" size={16} color="#fff" />
            </View>
            <Text className="text-white font-rubik-semibold text-sm">Manual Entry</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderImageUploader()}

      <Modal visible={manualModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-xl p-6 w-5/6 max-h-5/6">
            <Text className="text-xl font-rubik-bold text-gray-800 mb-4">Enter Coordinates</Text>

            {/* Quick Paste Section */}
            <View className="mb-4 p-4 bg-blue-50 rounded-lg">
              <Text className="text-base font-rubik-medium text-gray-800 mb-2">📋 Paste from Google Maps</Text>
              <View className="mb-3">
                <TextInput
                  value={coordinateString}
                  onChangeText={setCoordinateString}
                  placeholder="Paste coordinates here (e.g., 14.5995, 120.9842)"
                  multiline
                  className="border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white min-h-12"
                />
              </View>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={pasteFromClipboard}
                  className="bg-blue-500 py-2 px-4 rounded-lg mr-2 flex-row items-center"
                >
                  <Icon name="content-paste" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <Text className="text-white font-rubik-medium text-sm">Paste</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={parseCoordinateInput}
                  className="bg-green-500 py-2 px-4 rounded-lg flex-row items-center"
                >
                  <Icon name="transform" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <Text className="text-white font-rubik-medium text-sm">Parse</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-gray-600 mt-2">
                Supports: "14.5995, 120.9842", "@14.5995,120.9842", "(14.5995, 120.9842)"
              </Text>
            </View>

            {/* Manual Entry Section */}
            <Text className="text-base font-rubik-medium text-gray-800 mb-3">✏️ Or Enter Manually</Text>
            
            <View className="mb-4">
              <Text className="text-base font-rubik-medium text-gray-700 mb-1">Latitude</Text>
              <TextInput
                value={manualLat}
                onChangeText={setManualLat}
                placeholder="e.g., 14.5995"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
              <Text className="text-xs text-gray-500 mt-1">Between -90 and 90</Text>
            </View>

            <View className="mb-6">
              <Text className="text-base font-rubik-medium text-gray-700 mb-1">Longitude</Text>
              <TextInput
                value={manualLon}
                onChangeText={setManualLon}
                placeholder="e.g., 120.9842"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
              <Text className="text-xs text-gray-500 mt-1">Between -180 and 180</Text>
            </View>

            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setManualModalVisible(false)}
                className="px-4 py-2 mr-2"
              >
                <Text className="text-gray-600 font-rubik-medium">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveManualCoords}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-rubik-bold">Save Coordinates</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BuildingLocationForm;