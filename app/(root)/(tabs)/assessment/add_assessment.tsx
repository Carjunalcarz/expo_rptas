import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image
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

interface AdministratorBeneficiary {
  name: string;
  address: string;
  tin: string;
  telNo: string;
}

interface FloorArea {
  id: string;
  floorNumber: string;
  area: string;
}

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

const AddAssessment = () => {
  const [formData, setFormData] = useState({
    transactionCode: '',
    tdArp: '',
    pin: '',
    owner: '',
    address: '',
    tin: '',
    telNo: '',
  });

  const [locationData, setLocationData] = useState({
    street: '',
    barangay: '',
    municipality: '',
    province: '',
  });

  const [landData, setLandData] = useState({
    owner: '',
    titleNumber: '',
    lotNumber: '',
    blockNumber: '',
    surveyNumber: '',
    tdnArpNumber: '',
    area: '',
  });

  const [generalData, setGeneralData] = useState({
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
  });

  const [structuralData, setStructuralData] = useState({
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
  });

  const [appraisalData, setAppraisalData] = useState<AppraisalItem>({
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
  });

  const [administratorBeneficiary, setAdministratorBeneficiary] = useState<AdministratorBeneficiary>({
    name: '',
    address: '',
    tin: '',
    telNo: '',
  });

  const [hasAdministratorBeneficiary, setHasAdministratorBeneficiary] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdminBeneficiaryChange = (field: keyof AdministratorBeneficiary, value: string) => {
    setAdministratorBeneficiary(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field: string, value: string) => {
    setLocationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLandChange = (field: string, value: string) => {
    setLandData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGeneralChange = (field: string, value: any) => {
    setGeneralData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStructuralChange = (field: string, value: any) => {
    setStructuralData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAppraisalChange = (field: keyof AppraisalItem, value: string) => {
    setAppraisalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['transactionCode', 'pin', 'owner', 'address', 'tin', 'telNo'];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData].trim()) {
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
    if (!appraisalData.description.trim()) {
      Alert.alert('Validation Error', 'Please provide description for property appraisal');
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

    if (hasAdministratorBeneficiary) {
      const adminRequiredFields: (keyof AdministratorBeneficiary)[] = ['name', 'address', 'tin', 'telNo'];
      for (const field of adminRequiredFields) {
        if (!administratorBeneficiary[field].trim()) {
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
      ...formData,
      locationData,
      landData,
      generalData,
      structuralData,
      appraisalData,
      administratorBeneficiary: hasAdministratorBeneficiary ? administratorBeneficiary : null,
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
          formData={formData}
          administratorBeneficiary={administratorBeneficiary}
          hasAdministratorBeneficiary={hasAdministratorBeneficiary}
          onInputChange={handleInputChange}
          onAdminBeneficiaryChange={handleAdminBeneficiaryChange}
          onToggleAdminBeneficiary={setHasAdministratorBeneficiary}
        />

        {/* Building Location Form Component */}
        <BuildingLocationForm
          locationData={locationData}
          onLocationChange={handleLocationChange}
        />

        {/* Land Reference Form Component */}
        <LandReferenceForm
          landData={landData}
          onLandChange={handleLandChange}
        />

        {/* General Description Form Component */}
        <GeneralDescriptionForm
          generalData={generalData}
          onGeneralChange={handleGeneralChange}
        />

        {/* Structural Materials Form Component */}
        <StructuralMaterialsForm
          structuralData={structuralData}
          onStructuralChange={handleStructuralChange}
        />

        {/* Property Appraisal Form Component */}
        <PropertyAppraisalForm
          appraisalData={appraisalData}
          onAppraisalChange={handleAppraisalChange}
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
    </SafeAreaView>
  )
}

export default AddAssessment