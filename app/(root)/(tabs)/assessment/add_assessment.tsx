// AddAssessment.tsx
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, TouchableOpacity, Alert } from "react-native";
import { useForm, FormProvider } from "react-hook-form";
import OwnerDetailsForm from "@/components/OwnerDetailsForm";

interface AdministratorBeneficiary {
  name: string;
  address: string;
  tin: string;
  telNo: string;
}

interface OwnerDetails {
  owner: string;
  address: string;
  tin: string;
  telNo: string;
  hasAdministratorBeneficiary: boolean;
  administratorBeneficiary?: AdministratorBeneficiary;
  transactionCode?: string;
  tdArp?: string;
  pin?: string;
}

interface AssessmentFormData {
  owner_details: OwnerDetails;
}

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
    },
  },
});

const AddAssessment = () => {
  const methods = useForm<AssessmentFormData>({
    defaultValues: {
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
    },
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = (data: AssessmentFormData) => {
    Alert.alert("Assessment Saved", JSON.stringify(data, null, 2));
  };

  const fillDummyData = () => reset(dummy_data());

  const clearForm = () =>
    reset({
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
    });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="p-4">
        <Text className="text-2xl font-bold mb-4">Add Assessment</Text>

        <FormProvider {...methods}>
          <OwnerDetailsForm />
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
