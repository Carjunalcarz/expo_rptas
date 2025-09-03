import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ScrollView, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FormProvider, useForm } from 'react-hook-form';
import { getAssessmentById, updateAssessment } from '../../../../lib/local-db';
import { PRIMARY_COLOR } from '../../../../constants/colors';

// Reuse existing form sections
import OwnerDetailsForm from '../../../../components/OwnerDetailsForm';
import BuildingLocationForm from '../../../../components/BuildingLocationForm';
import LandReferenceForm from '../../../../components/LandReferenceForm';
import GeneralDescriptionForm from '../../../../components/GeneralDescriptionForm';
import StructuralMaterialsForm from '../../../../components/StructuralMaterialsForm';
import PropertyAppraisalForm from '../../../../components/PropertyAppraisalForm';
import AdditionalItems from '../../../../components/AdditionalItems';
import PropertyAssessment from '../../../../components/PropertyAssessment';

type AssessmentFormData = any;

export default function EditAssessmentScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const localId = id ? Number(id) : NaN;
    const methods = useForm<AssessmentFormData>({ defaultValues: {} as any });
    const { reset, handleSubmit, getValues } = methods;
    const [loading, setLoading] = React.useState(true);
    const [previewVisible, setPreviewVisible] = React.useState(false);
    const [previewData, setPreviewData] = React.useState<any | null>(null);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (!Number.isNaN(localId)) {
                    const row = await getAssessmentById(localId);
                    if (row && mounted) {
                        reset(row.data || {});
                    }
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

    const onSubmit = async (data: AssessmentFormData) => {
        if (Number.isNaN(localId)) return;
        await updateAssessment(localId, data);
        await AsyncStorage.setItem('last_assessment', JSON.stringify({ local_id: localId, createdAt: new Date().toISOString(), data }));
        try {
            const r = require('expo-router');
            r?.router?.replace?.({ pathname: '/assessment/[id]', params: { id: String(localId) } });
        } catch { }
    };

    const showPreview = () => { setPreviewData(getValues()); setPreviewVisible(true); };
    const cancelPreview = () => setPreviewVisible(false);
    const confirmSave = () => { setPreviewVisible(false); handleSubmit(onSubmit)(); };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <ScrollView style={{ padding: 16 }} contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
                <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 16 }}>Edit Assessment</Text>
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
                <TouchableOpacity onPress={showPreview} style={{ backgroundColor: PRIMARY_COLOR, padding: 12, borderRadius: 8, marginTop: 16 }}>
                    <Text style={{ color: '#ffffff', textAlign: 'center', fontWeight: '700', fontSize: 18 }}>Save Changes</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={previewVisible} animationType="slide" transparent onRequestClose={cancelPreview}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxHeight: '80%', elevation: 8 }}>
                        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' }}>Preview Changes</Text>
                        <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, color: '#333' }}>{previewData ? JSON.stringify(previewData, null, 2) : 'No data'}</Text>
                        </ScrollView>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                            <Pressable style={{ flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 8, backgroundColor: '#f3f3f3' }} onPress={cancelPreview}>
                                <Text style={{ color: '#333' }}>Cancel</Text>
                            </Pressable>
                            <Pressable style={{ flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 8, backgroundColor: PRIMARY_COLOR }} onPress={confirmSave}>
                                <Text style={{ color: '#fff' }}>Confirm Update</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Hide the bottom tab bar and header when this screen is active
export const options = { tabBarStyle: { display: 'none' }, headerShown: false };
