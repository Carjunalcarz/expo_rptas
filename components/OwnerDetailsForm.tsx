import {
  View,
  Text,
  TextInput,
  Switch,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  Dimensions,
  Platform
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_COLOR } from '@/constants/colors';

// Validation utility
const validationRules = {
  required: (label: string) => ({
    required: `${label} is required`,
    minLength: {
      value: 1,
      message: `${label} cannot be empty`
    }
  }),
  numeric: (label: string) => ({
    pattern: {
      value: /^[0-9-]+$/,
      message: `${label} must be a valid number`
    }
  }),
  phone: (label: string) => ({
    pattern: {
      value: /^[0-9+\-\s()]+$/,
      message: `${label} must be a valid phone number`
    }
  })
};

const OwnerDetailsForm: React.FC = () => {
  const { control, watch, setValue, formState: { errors } } = useFormContext() as any;

  // Watch toggle for conditional rendering
  const hasAdministratorBeneficiary = watch('owner_details.hasAdministratorBeneficiary');

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
          {label}
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
            ...(keyboardType === 'numeric' && validationRules.numeric(label)),
            ...(keyboardType === 'phone-pad' && validationRules.phone(label))
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

  // Valid ID image uploader
  const windowWidth = Dimensions.get('window').width;
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Permission to access photos is required to upload valid ID images.');
        }
      }
    })();
  }, []);

  const showIdOptions = () => {
    Alert.alert(
      'Add Valid ID',
      'Choose an option',
      [
        { text: 'Camera', onPress: takeIdPhoto },
        { text: 'Gallery', onPress: pickIdFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const takeIdPhoto = async () => {
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
        const current = watch('owner_details.validIdImages') || [];
        setValue('owner_details.validIdImages', [...current, result.assets[0].uri]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickIdFromGallery = async () => {
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
        const current = watch('owner_details.validIdImages') || [];
        const uris = result.assets.map((a: any) => a.uri);
        setValue('owner_details.validIdImages', [...current, ...uris]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeIdImage = (index: number) => {
    const current = watch('owner_details.validIdImages') || [];
    const updated = current.filter((_: string, i: number) => i !== index);
    setValue('owner_details.validIdImages', updated);
  };

  const openIdGallery = (index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryVisible(true);
  };

  const renderIdUploader = () => {
    const images: string[] = watch('owner_details.validIdImages') || [];
    return (
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">Valid ID Images</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {images.map((uri, idx) => (
            <View key={uri + idx} style={{ marginRight: 8, position: 'relative' }}>
              <TouchableOpacity onPress={() => openIdGallery(idx)}>
                <Image source={{ uri }} style={{ width: 96, height: 72, borderRadius: 8 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeIdImage(idx)} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 12, padding: 2, elevation: 4 }}>
                <Icon name="close" size={16} color="#333" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={showIdOptions} style={{ width: 96, height: 72, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' }}>
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

  // Beneficiary valid ID uploader (separate state so modal works independently)
  const [isBenefGalleryVisible, setIsBenefGalleryVisible] = useState(false);
  const [selectedBenefIndex, setSelectedBenefIndex] = useState(0);

  const showBenefIdOptions = () => {
    Alert.alert(
      'Add Beneficiary Valid ID',
      'Choose an option',
      [
        { text: 'Camera', onPress: takeBenefPhoto },
        { text: 'Gallery', onPress: pickBenefFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const takeBenefPhoto = async () => {
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
        const current = watch('owner_details.administratorBeneficiary.validIdImages') || [];
        setValue('owner_details.administratorBeneficiary.validIdImages', [...current, result.assets[0].uri]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickBenefFromGallery = async () => {
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
        const current = watch('owner_details.administratorBeneficiary.validIdImages') || [];
        const uris = result.assets.map((a: any) => a.uri);
        setValue('owner_details.administratorBeneficiary.validIdImages', [...current, ...uris]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeBenefImage = (index: number) => {
    const current = watch('owner_details.administratorBeneficiary.validIdImages') || [];
    const updated = current.filter((_: string, i: number) => i !== index);
    setValue('owner_details.administratorBeneficiary.validIdImages', updated);
  };

  const openBenefGallery = (index: number) => {
    setSelectedBenefIndex(index);
    setIsBenefGalleryVisible(true);
  };

  const renderBeneficiaryIdUploader = () => {
    const images: string[] = watch('owner_details.administratorBeneficiary.validIdImages') || [];
    return (
      <View className="mb-4">
        <Text className="text-base font-rubik-medium text-black-300 mb-2">Beneficiary Valid ID Images</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {images.map((uri, idx) => (
            <View key={uri + idx} style={{ marginRight: 8, position: 'relative' }}>
              <TouchableOpacity onPress={() => openBenefGallery(idx)}>
                <Image source={{ uri }} style={{ width: 96, height: 72, borderRadius: 8 }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeBenefImage(idx)} style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 12, padding: 2, elevation: 4 }}>
                <Icon name="close" size={16} color="#333" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={showBenefIdOptions} style={{ width: 96, height: 72, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="add-a-photo" size={22} color={PRIMARY_COLOR} />
            <Text style={{ fontSize: 11, color: PRIMARY_COLOR }}>Add</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={isBenefGalleryVisible} animationType="slide" onRequestClose={() => setIsBenefGalleryVisible(false)} transparent={false}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <View style={{ position: 'absolute', top: 40, right: 16, zIndex: 20 }}>
              <TouchableOpacity onPress={() => setIsBenefGalleryVisible(false)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 }}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              contentOffset={{ x: selectedBenefIndex * windowWidth, y: 0 }}
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
    <>
      {/* Property Information */}
      <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <View className="flex-row items-center justify-between mb-4 p-3 bg-blue-100 rounded-lg border-l-4" style={{ borderLeftColor: PRIMARY_COLOR }}>
          <Text className="text-lg font-bold" style={{ color: PRIMARY_COLOR }}>PROPERTY INFORMATION</Text>
          <Icon name="assessment" size={24} style={{ color: PRIMARY_COLOR }} />
        </View>
        {renderInput('owner_details.transactionCode', 'Transaction Code')}
        {renderInput('owner_details.tdArp', 'TD/ARP')}
        {renderInput('owner_details.pin', 'PIN', 'Property Identification Number')}
      </View>

      {/* Owner Information */}
      <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <View className="flex-row items-center justify-between mb-4 p-3 bg-blue-100 rounded-lg border-l-4" style={{ borderLeftColor: PRIMARY_COLOR }}>
          <Text className="text-lg font-bold" style={{ color: PRIMARY_COLOR }}>OWNER INFORMATION</Text>
          <Icon name="assessment" size={24} style={{ color: PRIMARY_COLOR }} />
        </View>

        {renderInput('owner_details.owner', 'Owner Name')}
        {renderInput('owner_details.address', 'Address', 'Complete address', 'default', true)}
        {renderInput('owner_details.tin', 'TIN', 'Tax Identification Number', 'numeric')}
        {renderInput('owner_details.telNo', 'Tel No', 'Telephone/Mobile Number', 'phone-pad')}
        {renderIdUploader()}
      </View>

      {/* Administrator/Beneficiary Section */}
      <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
        <View className="flex flex-row items-center justify-between mb-4">
          <View className="flex-row items-center justify-between mb-4 p-3 bg-blue-100 rounded-lg border-l-4" style={{ borderLeftColor: PRIMARY_COLOR }}>
            <Text className="text-lg font-bold" style={{ color: PRIMARY_COLOR }}>ADMINISTRATOR / BENEFICIARY</Text>
            <Icon name="assessment" size={24} style={{ color: PRIMARY_COLOR }} />
          </View>
          <Controller
            control={control}
            name="owner_details.hasAdministratorBeneficiary"
            render={({ field: { onChange, value } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: '#e5e7eb', true: PRIMARY_COLOR }}
                thumbColor={value ? '#ffffff' : '#f3f4f6'}
              />
            )}
          />
        </View>

        {hasAdministratorBeneficiary && (
          <>
            {renderInput(
              'owner_details.administratorBeneficiary.name',
              'Administrator/Beneficiary Name',
              undefined,
              'default',
              false,
              validationRules.required('Administrator/Beneficiary Name')
            )}

            {renderInput(
              'owner_details.administratorBeneficiary.address',
              'Address',
              'Complete address',
              'default',
              true,
              validationRules.required('Administrator/Beneficiary Address')
            )}

            {renderInput(
              'owner_details.administratorBeneficiary.tin',
              'TIN',
              'Tax Identification Number',
              'numeric',
              false,
              {
                ...validationRules.required('Administrator/Beneficiary TIN'),
                ...validationRules.numeric('TIN')
              }
            )}

            {renderInput(
              'owner_details.administratorBeneficiary.telNo',
              'Tel No',
              'Telephone/Mobile Number',
              'phone-pad',
              false,
              {
                ...validationRules.required('Administrator/Beneficiary Tel No'),
                ...validationRules.phone('Tel No')
              }
            )}
            {renderBeneficiaryIdUploader()}
          </>
        )}
      </View>
    </>
  );
};

export default OwnerDetailsForm;