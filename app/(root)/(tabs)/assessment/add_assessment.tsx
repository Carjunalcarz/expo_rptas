import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, TouchableOpacity, Alert } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import OwnerDetailsForm from "@/components/OwnerDetailsForm";
import BuildingLocationForm from "@/components/BuildingLocationForm";
import LandReferenceForm from "@/components/LandReferenceForm";
import GeneralDescriptionForm from "@/components/GeneralDescriptionForm";
import StructuralMaterialsForm from "@/components/StructuralMaterialsForm";
import PropertyAppraisalForm from "@/components/PropertyAppraisalForm";

// // Validation utility
// const validationRules = {
//   required: (label: string) => ({
//     required: `${label} is required`,
//     minLength: {
//       value: 1,
//       message: `${label} cannot be empty`
//     }
//   }),
//   numeric: (label: string) => ({
//     pattern: {
//       value: /^[0-9-]+$/,
//       message: `${label} must be a valid number`
//     }
//   }),
//   phone: (label: string) => ({
//     pattern: {
//       value: /^[0-9+\-\s()]+$/,
//       message: `${label} must be a valid phone number`
//     }
//   })
// };

// Interfaces
interface AdministratorBeneficiaryData {
  name: string;
  address: string;
  tin: string;
  telNo: string;
}

interface OwnerDetailsData {
  owner: string;
  address: string;
  tin: string;
  telNo: string;
  hasAdministratorBeneficiary: boolean;
  administratorBeneficiary?: AdministratorBeneficiaryData;
  transactionCode?: string;
  tdArp?: string;
  pin?: string;
}

interface BuildingLocationData {
  street: string;
  barangay: string;
  municipality: string;
  province: string;
}

interface LandReferenceData {
  owner: string,
  titleNumber: string,
  lotNumber: string,
  blockNumber: string,
  surveyNumber: string,
  tdnArpNumber: string,
  area: string,
}
interface FloorArea {
  id: string;
  floorNumber: string;
  area: string;
}
interface GeneralFormData {
  kindOfBuilding: string;
  structuralType: string;
  buildingPermitNo: string;
  condominiumCCT: string;
  completionCertificateDate: string;
  occupancyCertificateDate: string;
  dateConstructed: string;
  dateOccupied: string;
  buildingAge: string;
  numberOfStoreys: string;
  floorAreas: FloorArea[];
  totalFloorArea: string;
  floorPlanImages: string[];
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

interface StructuralFormData {
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
}

interface AssessmentFormData {
  owner_details: OwnerDetailsData;
  building_location: BuildingLocationData;
  land_reference: LandReferenceData;
  general_description: GeneralFormData;
  structural_materials?: StructuralFormData;
  property_appraisal?: PropertyAppraisal;
}

interface PropertyAppraisal {
  description: string;
  area: string;
  unit_value: string;
  bucc: string;
  baseMarketValue: string;
  depreciation: string;
  depreciationCost: string;
  marketValue: string;
}


// Default values constant
const DEFAULT_VALUES: AssessmentFormData = {
  owner_details: {
    transactionCode: "",
    tdArp: "",
    pin: "",
    owner: "",
    address: "",
    tin: "",
    telNo: "",
    hasAdministratorBeneficiary: false,
    administratorBeneficiary: {
      name: "",
      address: "",
      tin: "",
      telNo: "",
    },
  },
  building_location: {
    street: "",
    barangay: "",
    municipality: "",
    province: "",
  },
  land_reference: {
    owner: '',
    titleNumber: '',
    lotNumber: '',
    blockNumber: '',
    surveyNumber: '',
    tdnArpNumber: '',
    area: '',
  },
  general_description: {
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
    floorAreas: [{ id: '1', floorNumber: 'Ground Floor', area: '' }],
    totalFloorArea: '0',
    floorPlanImages: [],
  },

  structural_materials: {
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
    flooring: [{ id: '1', floorName: 'Ground Floor', material: '', otherSpecify: '' }],
    wallsPartitions: [{ id: '1', wallName: 'Main Wall', material: '', otherSpecify: '' }],
  },

  property_appraisal: {
    description: '',
    area: '',
    unit_value: '',
    bucc: '',
    baseMarketValue: '',
    depreciation: '',
    depreciationCost: '',
    marketValue: ''
  },

};

const dummy_data = (): AssessmentFormData => ({
  owner_details: {
    transactionCode: "12345",
    tdArp: "67890",
    pin: "112233",
    owner: "John Doe",
    address: "123 Main St",
    tin: "123-456-789",
    telNo: "123-456-7890",
    hasAdministratorBeneficiary: true,
    administratorBeneficiary: {
      name: "Jane Doe",
      address: "456 Elm St",
      tin: "987-654-321",
      telNo: "098-765-4321",
    }
  },
  building_location: {
    street: "123 Main St",
    barangay: "Soriano",
    municipality: "Cabadbaran City",
    province: "Agusan del Norte"
  },
  land_reference: {
    owner: 'Juan dela Cruz',
    titleNumber: 'OCT-123456',
    lotNumber: '123',
    blockNumber: '123',
    surveyNumber: '123',
    tdnArpNumber: '123',
    area: '1000',
  },
  general_description: {
    kindOfBuilding: 'Residential',
    structuralType: 'I-A',
    buildingPermitNo: 'BP-2023-12345',
    condominiumCCT: 'asasasdasd',
    completionCertificateDate: '01/15/2023',
    occupancyCertificateDate: '02/01/2023',
    dateConstructed: '01/10/2023',
    dateOccupied: '02/15/2023',
    buildingAge: '1',
    numberOfStoreys: '2',
    floorAreas: [
      { id: '1', floorNumber: 'Ground Floor', area: '80' },
      { id: '2', floorNumber: 'Second Floor', area: '70' }
    ],
    totalFloorArea: '150',
    floorPlanImages: [],
  },
  structural_materials: {
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
      tiles: false,
      giSheet: true,
      aluminum: false,
      asbestos: false,
      longSpan: false,
      concreteDesk: false,
      nipaAnahawCogon: false,
      others: false,
      othersSpecify: '',
    },
    flooring: [
      {
        id: '1',
        floorName: 'Ground Floor',
        material: 'Reinforce Concrete',
        otherSpecify: ''
      },
      {
        id: '2',
        floorName: 'Second Floor',
        material: 'Tiles',
        otherSpecify: ''
      }
    ],
    wallsPartitions: [
      {
        id: '1',
        wallName: 'Exterior Walls',
        material: 'Reinforce Concrete',
        otherSpecify: ''
      },
      {
        id: '2',
        wallName: 'Interior Partitions',
        material: 'CHB',
        otherSpecify: ''
      }
    ],
  },
  property_appraisal: {
    description: '',
    area: '',
    unit_value: '',
    bucc: '',
    baseMarketValue: '',
    depreciation: '',
    depreciationCost: '',
    marketValue: ''
  },
});

// Main Component
const AddAssessment = () => {
  const methods = useForm<AssessmentFormData>({
    defaultValues: DEFAULT_VALUES,
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = (data: AssessmentFormData) => {
    Alert.alert("Assessment Saved", JSON.stringify(data, null, 2));
  };

  const fillDummyData = () => reset(dummy_data());
  const clearForm = () => reset(DEFAULT_VALUES);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="p-4">
        <Text className="text-2xl font-bold mb-4">Add Assessment</Text>

        <FormProvider {...methods}>
          <OwnerDetailsForm />
          <BuildingLocationForm />
          <LandReferenceForm />
          <GeneralDescriptionForm />
          <StructuralMaterialsForm />
          <PropertyAppraisalForm />
        </FormProvider>

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          className="bg-blue-600 p-3 rounded-lg mt-4"
        >
          <Text className="text-white text-center font-bold text-lg">
            Save Assessment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={fillDummyData}
          className="bg-gray-500 p-3 rounded-lg mt-2 mb-2"
        >
          <Text className="text-white text-center font-bold text-lg">
            Fill Dummy Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={clearForm}
          className="bg-red-500 p-3 rounded-lg mt-2 mb-10"
        >
          <Text className="text-white text-center font-bold text-lg">
            Clear Form Data
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddAssessment;
