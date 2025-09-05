import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider, useForm } from 'react-hook-form';
import { getAssessmentDocument, updateAssessmentDocument } from '@/lib/appwrite';
import OwnerDetailsForm from '@/components/OwnerDetailsForm';
import BuildingLocationForm from '@/components/BuildingLocationForm';
import LandReferenceForm from '@/components/LandReferenceForm';
import GeneralDescriptionForm from '@/components/GeneralDescriptionForm';
import StructuralMaterialsForm from '@/components/StructuralMaterialsForm';
import PropertyAppraisalForm from '@/components/PropertyAppraisalForm';
import AdditionalItems from '@/components/AdditionalItems';
import PropertyAssessment from '@/components/PropertyAssessment';

export default function EditRemoteAssessment() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const methods = useForm<any>({ defaultValues: {} });
    const { reset, handleSubmit } = methods;
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        (async () => {
            if (!id) return;
            try {
                setLoading(true);
                const d = await getAssessmentDocument(String(id));
                const parse = (s: any) => { try { return JSON.parse(s || '{}'); } catch { return {}; } };
                const values = {
                    owner_details: parse(d.owner_details),
                    building_location: parse(d.building_location),
                    land_reference: parse(d.land_reference),
                    general_description: parse(d.general_description),
                    structural_materials: parse(d.structural_materials),
                    property_appraisal: parse(d.property_appraisal),
                    property_assessment: parse(d.property_assessment),
                    additionalItems: parse(d.additionalItems),
                };
                reset(values);
            } catch (e: any) {
                Alert.alert('Error', e?.message || 'Failed to load');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const onSubmit = async (data: any) => {
        try {
            await updateAssessmentDocument(String(id), { data });
            Alert.alert('Updated', 'Remote assessment updated.');
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to update');
        }
    };

    if (loading) return (
        <SafeAreaView className="flex-1 bg-white"><Text className="p-5">Loading...</Text></SafeAreaView>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1 px-5 py-4">
                <FormProvider {...methods}>
                    <OwnerDetailsForm />
                    <BuildingLocationForm />
                    <LandReferenceForm />
                    <GeneralDescriptionForm />
                    <StructuralMaterialsForm />
                    <PropertyAppraisalForm />
                    <AdditionalItems />
                    <PropertyAssessment />
                </FormProvider>
                <TouchableOpacity onPress={handleSubmit(onSubmit)} className="bg-blue-500 rounded-xl px-6 py-4 mt-4">
                    <Text className="text-white text-center font-rubik-medium">Save Changes</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
