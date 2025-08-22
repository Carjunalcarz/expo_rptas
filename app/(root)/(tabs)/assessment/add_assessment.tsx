import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal
} from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import icons from '@/constants/icons'
import OwnerDetailsForm from '@/components/OwnerDetailsForm'
import BuildingLocationForm from '@/components/BuildingLocationForm'
import LandReferenceForm from '@/components/LandReferenceForm'
import GeneralDescriptionForm from '@/components/GeneralDescriptionForm'
import StructuralMaterialsForm from '@/components/StructuralMaterialsForm'
import PropertyAppraisalForm from '@/components/PropertyAppraisalForm'
import {
  AppraisalItem,
  AdministratorBeneficiary,
  FloorArea,
  FloorMaterial,
  WallPartition
} from '@/types'

const AddAssessment = () => {
  // Initial state constants to ensure consistency
  const INITIAL_OWNER_DATA = {
    transactionCode: '',
    tdArp: '',
    pin: '',
    owner: '',
    address: '',
    tin: '',
    telNo: '',
    hasAdministratorBeneficiary: false,
    administratorBeneficiary: {
      name: '',
      address: '',
      tin: '',
      telNo: '',
    },
  };

  const INITIAL_LOCATION_DATA = {
    street: '',
    barangay: '',
    municipality: '',
    province: '',
  };

  const INITIAL_LAND_DATA = {
    owner: '',
    titleNumber: '',
    lotNumber: '',
    blockNumber: '',
    surveyNumber: '',
    tdnArpNumber: '',
    area: '',
  };

  const INITIAL_GENERAL_DATA = {
    kindOfBuilding: '',
    structuralType: '',
    buildingPermitNo: '',
    condominiumCCT: '',
    completionCertificateDate: '',
    occupancyCertificateDate: '',
    dateConstructed: '',
    dateOccupied: '',
    buildingAge: '',
    numberOfStoreys: '',
    floorAreas: [{ id: '1', floorNumber: 'Ground Floor', area: '' }] as FloorArea[],
    totalFloorArea: '0',
    floorPlanImages: [] as string[],
  };

  const INITIAL_STRUCTURAL_DATA = {
    foundation: {
      reinforceConcrete: false,
      plainConcrete: false,
      others: false,
      othersSpecify: '',
    },
    columns: {
      steel: false,
      reinforceConcrete: false,
      wood: false,
      others: false,
      othersSpecify: '',
    },
    beams: {
      steel: false,
      reinforceConcrete: false,
      others: false,
      othersSpecify: '',
    },
    trussFraming: {
      steel: false,
      wood: false,
      others: false,
      othersSpecify: '',
    },
    roof: {
      reinforceConcrete: false,
      tiles: false,
      giSheet: false,
      aluminum: false,
      asbestos: false,
      longSpan: false,
      concreteDesk: false,
      nipaAnahawCogon: false,
      others: false,
      othersSpecify: '',
    },
    flooring: [{ id: '1', floorName: 'Ground Floor', material: '', otherSpecify: '' }] as FloorMaterial[],
    wallsPartitions: [{ id: '1', wallName: 'Main Wall', material: '', otherSpecify: '' }] as WallPartition[],
  };

  const INITIAL_APPRAISAL_DATA: AppraisalItem = {
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
  };

  // Form reset key to force re-render when dummy data is filled
  const [formKey, setFormKey] = useState(0);
  
  // Individual form data states
  const [ownerData, setOwnerData] = useState(INITIAL_OWNER_DATA);
  const [locationData, setLocationData] = useState(INITIAL_LOCATION_DATA);
  const [landData, setLandData] = useState(INITIAL_LAND_DATA);
  const [generalData, setGeneralData] = useState(INITIAL_GENERAL_DATA);
  const [structuralData, setStructuralData] = useState(INITIAL_STRUCTURAL_DATA);
  const [appraisalData, setAppraisalData] = useState<AppraisalItem>(INITIAL_APPRAISAL_DATA);

  // Debug state
  const [showDebugModal, setShowDebugModal] = useState(false);

  // Form change handlers
  const handleOwnerFormChange = (data: typeof ownerData) => {
    setOwnerData(data);
  };

  const handleLocationFormChange = (data: typeof locationData) => {
    setLocationData(data);
  };

  const handleLandFormChange = (data: typeof landData) => {
    setLandData(data);
  };

  const handleGeneralFormChange = (data: typeof generalData) => {
    setGeneralData(data);
  };

  const handleStructuralFormChange = (data: typeof structuralData) => {
    setStructuralData(data);
  };

  const handleAppraisalFormChange = (data: AppraisalItem) => {
    setAppraisalData(data);
  };

  // Fill dummy data function
  const fillDummyData = () => {
    // Create dummy data objects
    const dummyOwnerData = {
      transactionCode: 'TXN-2025-001',
      tdArp: 'TD-12345-2025',
      pin: '123-456-789-000',
      owner: 'Juan Carlos Dela Cruz',
      address: '123 Rizal Street, Barangay San Antonio, Makati City, Metro Manila',
      tin: '123-456-789-000',
      telNo: '+63 917 123 4567',
      hasAdministratorBeneficiary: true,
      administratorBeneficiary: {
        name: 'Maria Santos Dela Cruz',
        address: '456 Bonifacio Avenue, Barangay Poblacion, Quezon City, Metro Manila',
        tin: '987-654-321-000',
        telNo: '+63 918 987 6543',
      },
    };

    const dummyLocationData = {
      street: '789 Mabini Street',
      barangay: 'Barangay Malate',
      municipality: 'Manila City',
      province: 'Metro Manila',
    };

    const dummyLandData = {
      owner: 'Pedro Martinez Santos',
      titleNumber: 'TCT-N-12345',
      lotNumber: '15',
      blockNumber: '8',
      surveyNumber: 'PSD-13-000123',
      tdnArpNumber: 'ARP-2025-456789',
      area: '250.50',
    };

    const dummyGeneralData = {
      kindOfBuilding: 'Residential',
      structuralType: 'II-A',
      buildingPermitNo: 'BP-2024-001234',
      condominiumCCT: 'CCT-N-98765',
      completionCertificateDate: '03/15/2024',
      occupancyCertificateDate: '04/01/2024',
      dateConstructed: '01/10/2024',
      dateOccupied: '04/15/2024',
      buildingAge: '1',
      numberOfStoreys: '2',
      floorAreas: [
        { id: '1', floorNumber: 'Ground Floor', area: '120.00' },
        { id: '2', floorNumber: 'Second Floor', area: '100.00' }
      ],
      totalFloorArea: '220.00',
      floorPlanImages: [],
    };

    const dummyStructuralData = {
      foundation: {
        reinforceConcrete: true,
        plainConcrete: false,
        others: false,
        othersSpecify: '',
      },
      columns: {
        steel: false,
        reinforceConcrete: true,
        wood: false,
        others: false,
        othersSpecify: '',
      },
      beams: {
        steel: false,
        reinforceConcrete: true,
        others: false,
        othersSpecify: '',
      },
      trussFraming: {
        steel: true,
        wood: false,
        others: false,
        othersSpecify: '',
      },
      roof: {
        reinforceConcrete: false,
        tiles: true,
        giSheet: false,
        aluminum: false,
        asbestos: false,
        longSpan: false,
        concreteDesk: false,
        nipaAnahawCogon: false,
        others: false,
        othersSpecify: '',
      },
      flooring: [
        { id: '1', floorName: 'Ground Floor', material: 'Tiles', otherSpecify: '' },
        { id: '2', floorName: 'Second Floor', material: 'Wood', otherSpecify: '' }
      ],
      wallsPartitions: [
        { id: '1', wallName: 'Main Wall', material: 'CHB', otherSpecify: '' },
        { id: '2', wallName: 'Interior Partition', material: 'Wood', otherSpecify: '' }
      ],
    };

    const dummyAppraisalData = {
      id: '1',
      description: 'Two-storey residential building with modern amenities',
      buildingCore: 'Residential Building - Type A',
      type: 'Single Family',
      areaInSqm: '220.00',
      unitValue: '3400.00',
      percentOfBUCC: '85.00',
      baseMarketValue: '635800.00',
      percentDepreciation: '5.00',
      depreciationCost: '31790.00',
      marketValue: '604010.00',
    };

    // Set all state at once
    setOwnerData(dummyOwnerData);
    setLocationData(dummyLocationData);
    setLandData(dummyLandData);
    setGeneralData(dummyGeneralData);
    setStructuralData(dummyStructuralData);
    setAppraisalData(dummyAppraisalData);

    // Force form re-render by changing key
    setFormKey(prev => prev + 1);

    Alert.alert('Success', 'All forms filled with dummy data!');
  };

  // Clear all data function
  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all form data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            // Reset all forms to initial state using constants
            setOwnerData({ ...INITIAL_OWNER_DATA });
            setLocationData({ ...INITIAL_LOCATION_DATA });
            setLandData({ ...INITIAL_LAND_DATA });
            setGeneralData({ ...INITIAL_GENERAL_DATA });
            setStructuralData({ ...INITIAL_STRUCTURAL_DATA });
            setAppraisalData({ ...INITIAL_APPRAISAL_DATA });

            // Force form re-render by changing key
            setFormKey(prev => prev + 1);

            Alert.alert('Success', 'All form data cleared!');
          }
        }
      ]
    );
  };

  const validateForm = () => {
    // Validate owner data
    const requiredOwnerFields = ['transactionCode', 'pin', 'owner', 'address', 'tin', 'telNo'];
    for (const field of requiredOwnerFields) {
      if (!ownerData[field as keyof typeof ownerData] || ownerData[field as keyof typeof ownerData] === '') {
        Alert.alert('Validation Error', `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
        return false;
      }
    }

    // Validate location data
    const locationFields = ['street', 'barangay', 'municipality', 'province'];
    for (const field of locationFields) {
      if (!locationData[field as keyof typeof locationData].trim()) {
        Alert.alert('Validation Error', `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
        return false;
      }
    }

    // Validate land reference data
    const landFields = ['owner', 'titleNumber', 'lotNumber', 'blockNumber', 'surveyNumber', 'tdnArpNumber', 'area'];
    for (const field of landFields) {
      if (!landData[field as keyof typeof landData].trim()) {
        Alert.alert('Validation Error', `Land Reference ${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
        return false;
      }
    }

    // Validate general description data
    const generalFields = ['kindOfBuilding', 'structuralType', 'buildingPermitNo', 'dateConstructed', 'buildingAge', 'numberOfStoreys'];
    for (const field of generalFields) {
      if (!generalData[field as keyof typeof generalData] || generalData[field as keyof typeof generalData] === '') {
        Alert.alert('Validation Error', `General Description ${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
        return false;
      }
    }

    // Validate floor areas
    if (generalData.floorAreas.length === 0) {
      Alert.alert('Validation Error', 'At least one floor area is required');
      return false;
    }

    for (const floor of generalData.floorAreas) {
      if (!floor.area.trim()) {
        Alert.alert('Validation Error', `Floor area for ${floor.floorNumber} is required`);
        return false;
      }
    }

    // Validate structural materials
    const structuralSections = ['foundation', 'columns', 'beams', 'trussFraming', 'roof'];
    for (const section of structuralSections) {
      const sectionData = structuralData[section as keyof typeof structuralData] as any;
      const hasSelection = Object.keys(sectionData).some(key =>
        key !== 'othersSpecify' && sectionData[key] === true
      );
      if (!hasSelection) {
        Alert.alert('Validation Error', `Please select at least one option for ${section.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`);
        return false;
      }
    }

    // Validate flooring materials
    for (const floor of structuralData.flooring) {
      if (!floor.material) {
        Alert.alert('Validation Error', `Please select material for ${floor.floorName}`);
        return false;
      }
      if (floor.material === 'Others (Specify)' && !floor.otherSpecify.trim()) {
        Alert.alert('Validation Error', `Please specify the material for ${floor.floorName}`);
        return false;
      }
    }

    // Validate walls & partitions materials
    for (const wall of structuralData.wallsPartitions) {
      if (!wall.material) {
        Alert.alert('Validation Error', `Please select material for ${wall.wallName}`);
        return false;
      }
      if (wall.material === 'Others (Specify)' && !wall.otherSpecify.trim()) {
        Alert.alert('Validation Error', `Please specify the material for ${wall.wallName}`);
        return false;
      }
    }

    // Validate property appraisal
    if (!appraisalData.buildingCore.trim()) {
      Alert.alert('Validation Error', 'Please provide building core for property appraisal');
      return false;
    }
    if (!appraisalData.areaInSqm.trim() || parseFloat(appraisalData.areaInSqm) <= 0) {
      Alert.alert('Validation Error', 'Please provide valid area for property appraisal');
      return false;
    }
    if (!appraisalData.unitValue.trim() || parseFloat(appraisalData.unitValue) <= 0) {
      Alert.alert('Validation Error', 'Please provide valid unit value for property appraisal');
      return false;
    }

    if (ownerData.hasAdministratorBeneficiary) {
      const adminRequiredFields: (keyof AdministratorBeneficiary)[] = ['name', 'address', 'tin', 'telNo'];
      for (const field of adminRequiredFields) {
        if (!ownerData.administratorBeneficiary[field].trim()) {
          Alert.alert('Validation Error', `Administrator/Beneficiary ${field.replace(/([A-Z])/g, ' $1')} is required`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const assessmentData = {
      ownerData,
      locationData,
      landData,
      generalData,
      structuralData,
      appraisalData,
      createdAt: new Date().toISOString(),
    };

    // Here you would typically save to your database
    console.log('Assessment Data:', assessmentData);
    
    Alert.alert(
      'Success', 
      'Assessment form submitted successfully!',
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Debug Panel - Remove this in production */}
        {__DEV__ && (
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <Text className="text-sm font-rubik-bold text-yellow-800 mb-2">🐛 Debug: Current Form Data</Text>
            <ScrollView className="max-h-40" nestedScrollEnabled>
              {/* Owner Data */}
              <Text className="text-xs font-rubik-bold text-yellow-800 mb-1">OWNER INFO:</Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Owner: {ownerData.owner || 'Not filled'} | PIN: {ownerData.pin || 'Not filled'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Transaction: {ownerData.transactionCode || 'Not filled'} | TIN: {ownerData.tin || 'Not filled'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Address: {ownerData.address || 'Not filled'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Admin/Beneficiary: {ownerData.hasAdministratorBeneficiary ? `Yes (${ownerData.administratorBeneficiary.name || 'No name'})` : 'No'}
              </Text>
              
              {/* Location Data */}
              <Text className="text-xs font-rubik-bold text-yellow-800 mb-1 mt-2">LOCATION:</Text>
              <Text className="text-xs font-mono text-yellow-700">
                • {locationData.street || 'No street'}, {locationData.barangay || 'No barangay'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • {locationData.municipality || 'No municipality'}, {locationData.province || 'No province'}
              </Text>
              
              {/* Land Data */}
              <Text className="text-xs font-rubik-bold text-yellow-800 mb-1 mt-2">LAND REFERENCE:</Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Owner: {landData.owner || 'Not filled'} | Title: {landData.titleNumber || 'Not filled'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Lot: {landData.lotNumber || 'Not filled'} | Block: {landData.blockNumber || 'Not filled'} | Area: {landData.area || 'Not filled'}
              </Text>
              
              {/* General Data */}
              <Text className="text-xs font-rubik-bold text-yellow-800 mb-1 mt-2">GENERAL DESCRIPTION:</Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Structural Type: {generalData.structuralType || 'Not filled'} | Kind: {generalData.kindOfBuilding || 'Not filled'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Building Permit: {generalData.buildingPermitNo || 'Not filled'} | CCT: {generalData.condominiumCCT || 'Not filled'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Completion Date: {generalData.completionCertificateDate || 'Not filled'} | Occupancy Date: {generalData.occupancyCertificateDate || 'Not filled'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Date Constructed: {generalData.dateConstructed || 'Not filled'} | Date Occupied: {generalData.dateOccupied || 'Not filled'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Building Age: {generalData.buildingAge || 'Not filled'} years | Storeys: {generalData.numberOfStoreys || 'Not filled'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Total Floor Area: {generalData.totalFloorArea || '0'} sq.m | Floor Count: {generalData.floorAreas.length}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Floor Plan Images: {generalData.floorPlanImages.length} uploaded
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Floor Details: {generalData.floorAreas.map(f => `${f.floorNumber}:${f.area || '0'}sqm`).join(', ')}
              </Text>
              
              {/* Structural Data */}
              <Text className="text-xs font-rubik-bold text-yellow-800 mb-1 mt-2">STRUCTURAL:</Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Foundation: {Object.entries(structuralData.foundation).filter(([key, value]) => key !== 'othersSpecify' && value).map(([key]) => key).join(', ') || 'None selected'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Flooring: {structuralData.flooring.map(f => `${f.floorName}:${f.material || 'None'}`).join(', ')}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Walls: {structuralData.wallsPartitions.map(w => `${w.wallName}:${w.material || 'None'}`).join(', ')}
              </Text>
              
              {/* Appraisal Data */}
              <Text className="text-xs font-rubik-bold text-yellow-800 mb-1 mt-2">APPRAISAL:</Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Building Core: {appraisalData.buildingCore || 'Not filled'} | Type: {appraisalData.type || 'Not filled'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Area: {appraisalData.areaInSqm || '0'} sq.m | Unit Value: ₱{appraisalData.unitValue || '0'}
              </Text>
              <Text className="text-xs font-mono text-yellow-700">
                • Base Market Value: ₱{appraisalData.baseMarketValue || '0.00'} | Final Market Value: ₱{appraisalData.marketValue || '0.00'}
              </Text>
            </ScrollView>
            <View className="flex-row gap-1 mt-2">
              <TouchableOpacity
                onPress={() => setShowDebugModal(true)}
                className="bg-blue-500 rounded-lg px-2 py-1 flex-1"
              >
                <Text className="text-white text-xs font-rubik-bold text-center">View Data</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={fillDummyData}
                className="bg-green-500 rounded-lg px-2 py-1 flex-1"
              >
                <Text className="text-white text-xs font-rubik-bold text-center">Fill Dummy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={clearAllData}
                className="bg-red-500 rounded-lg px-2 py-1 flex-1"
              >
                <Text className="text-white text-xs font-rubik-bold text-center">Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Header */}
        <View className="flex flex-row items-center justify-between py-4 border-b border-gray-200 mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={icons.backArrow} className="w-6 h-6" tintColor="#3b82f6" />
          </TouchableOpacity>
          <View className="flex flex-row items-center">
            <View className="bg-primary-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">
              <Text className="text-white text-lg font-bold">+</Text>
            </View>
            <Text className="text-xl font-rubik-bold text-black-300">Add Assessment</Text>
          </View>
          <View className="w-6" />
        </View>

        {/* Owner Details Form Component */}
        <OwnerDetailsForm
          key={`owner-${formKey}`}
          defaultValues={ownerData}
          onFormChange={handleOwnerFormChange}
        />

        {/* Building Location Form Component */}
        <BuildingLocationForm
          key={`location-${formKey}`}
          defaultValues={locationData}
          onFormChange={handleLocationFormChange}
        />

        {/* Land Reference Form Component */}
        <LandReferenceForm
          key={`land-${formKey}`}
          defaultValues={landData}
          onFormChange={handleLandFormChange}
        />

        {/* General Description Form Component */}
        <GeneralDescriptionForm
          key={`general-${formKey}`}
          defaultValues={generalData}
          onFormChange={handleGeneralFormChange}
        />

        {/* Structural Materials Form Component */}
        <StructuralMaterialsForm
          key={`structural-${formKey}`}
          defaultValues={structuralData}
          onFormChange={handleStructuralFormChange}
        />

        {/* Property Appraisal Form Component */}
        <PropertyAppraisalForm
          key={`appraisal-${formKey}`}
          defaultValues={appraisalData}
          onFormChange={handleAppraisalFormChange}
        />

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-primary-300 rounded-xl py-4 mb-8 shadow-sm flex flex-row items-center justify-center"
        >
          <View className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center mr-2">
            <Text className="text-white text-sm font-bold">+</Text>
          </View>
          <Text className="text-white text-center text-lg font-rubik-bold">
            Submit Assessment
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Debug Modal - Remove this in production */}
      {__DEV__ && (
        <Modal
          visible={showDebugModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDebugModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-5">
            <View className="bg-white rounded-xl p-5 max-h-4/5 w-full">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-rubik-bold text-black-300">🐛 Complete Form Data</Text>
                <TouchableOpacity
                  onPress={() => setShowDebugModal(false)}
                  className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
                >
                  <Text className="text-gray-600 font-bold">×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView className="flex-1">
                <Text className="text-xs font-mono text-gray-700 leading-4">
                  {JSON.stringify({
                    ownerData,
                    locationData,
                    landData,
                    generalData,
                    structuralData,
                    appraisalData,
                    timestamp: new Date().toISOString()
                  }, null, 2)}
                </Text>
              </ScrollView>
              
              <TouchableOpacity
                onPress={() => {
                  const data = {
                    ownerData,
                    locationData,
                    landData,
                    generalData,
                    structuralData,
                    appraisalData,
                    timestamp: new Date().toISOString()
                  };
                  console.log('📋 Form Data Copied to Console:', data);
                  Alert.alert('Success', 'Form data logged to console!');
                }}
                className="bg-blue-500 rounded-lg py-3 mt-4"
              >
                <Text className="text-white text-center font-rubik-bold">Copy to Console</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  )
}

export default AddAssessment