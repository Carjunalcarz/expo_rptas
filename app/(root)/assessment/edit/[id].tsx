import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ScrollView, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FormProvider, useForm } from 'react-hook-form';
import { getAssessmentById, updateAssessment, saveAssessment } from '../../../../lib/local-db';
import { getAssessmentDocument } from '../../../../lib/appwrite';
import { parseAssessmentData } from '../../../../lib/parser';
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
    const methods = useForm<AssessmentFormData>({ defaultValues: {} as any });
    const { reset, handleSubmit, getValues } = methods;
    const [loading, setLoading] = React.useState(true);
    const [assessmentData, setAssessmentData] = React.useState<AssessmentFormData | null>(null);
    const [previewVisible, setPreviewVisible] = React.useState(false);
    const [previewData, setPreviewData] = React.useState<any | null>(null);
    const [remoteDataVisible, setRemoteDataVisible] = React.useState(false);

    React.useEffect(() => {
        const loadAssessment = async () => {
            setLoading(true);
            let dataToLoad = null;
            try {
                const lastAssessmentJSON = await AsyncStorage.getItem('last_assessment');
                if (lastAssessmentJSON) {
                    const lastAssessment = JSON.parse(lastAssessmentJSON);
                    const storedId = String(lastAssessment.local_id || lastAssessment.remote_id);
                    if (storedId === String(id) && lastAssessment.data) {
                        dataToLoad = lastAssessment.data;
                    }
                }

                if (!dataToLoad && id) {
                    const isRemote = Number.isNaN(Number(id));
                    if (isRemote) {
                        const remoteDoc = await getAssessmentDocument(id);
                        if (remoteDoc) {
                            dataToLoad = parseAssessmentData(remoteDoc);
                        }
                    } else {
                        const numericId = Number(id);
                        const row = await getAssessmentById(numericId);
                        if (row) dataToLoad = row.data;
                    }
                }
                // Normalize property_appraisal so the table renders at least one row
                // Also normalize additionalItems to ensure unique numeric ids for React keys
                const normalizeForForms = (d: any) => {
                    if (!d) return d;
                    const out = { ...d } as any;

                    // property_appraisal normalization
                    const pa = out.property_appraisal;
                    let hasRows = false;
                    if (Array.isArray(pa)) {
                        hasRows = pa.length > 0;
                    } else if (pa && typeof pa === 'object') {
                        if (Array.isArray(pa.general_description)) hasRows = pa.general_description.length > 0;
                        else if (pa.description !== undefined || pa.area !== undefined || pa.unit_value !== undefined) hasRows = true;
                    }
                    if (!hasRows) {
                        out.property_appraisal = [{}];
                    }

                    // additionalItems normalization
                    const ai = out.additionalItems;
                    if (!ai || typeof ai !== 'object') {
                        out.additionalItems = { items: [], subTotal: 0, total: 0 };
                    } else {
                        const items = Array.isArray(ai.items) ? ai.items : [];
                        // Reassign sequential numeric ids to avoid duplicate React keys
                        const normalizedItems = items.map((it: any, idx: number) => ({
                            id: Number.isFinite(Number(it?.id)) ? Number(it.id) : idx + 1,
                            label: it?.label || '',
                            value: it?.value || {},
                            quantity: Number(it?.quantity || 1),
                            amount: Number(it?.amount || 0),
                            description: String(it?.description || ''),
                        }));
                        // If ids still collide (e.g., many 1s), force unique by index
                        const seen = new Set<number>();
                        const uniqueItems = normalizedItems.map((it: any, i: number) => {
                            let id = it.id;
                            if (seen.has(id)) id = i + 1;
                            seen.add(id);
                            return { ...it, id };
                        });
                        out.additionalItems = {
                            items: uniqueItems,
                            subTotal: Number(ai.subTotal || 0),
                            total: Number(ai.total || 0),
                        };
                    }

                    return out;
                };

                setAssessmentData(normalizeForForms(dataToLoad));
            } catch (error) {
                console.error('Failed to load assessment for editing:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAssessment();
    }, [id]);

    React.useEffect(() => {
        if (assessmentData) {
            reset(assessmentData);
        }
    }, [assessmentData, reset]);

    const onSubmit = async (data: AssessmentFormData) => {
        try {
            let newLocalId = NaN;
            // If we are editing a pre-existing local record, update it.
            const isRemote = id ? Number.isNaN(Number(id)) : false;
            if (!isRemote && id) {
                const localIdNumber = Number(id);
                await updateAssessment(localIdNumber, data);
                newLocalId = localIdNumber;
            } else {
                // If we are "editing" a remote record, we save it as a new local record.
                const newLocalId = await saveAssessment({ createdAt: new Date().toISOString(), data });
            }

            if (Number.isNaN(newLocalId)) return;

            await AsyncStorage.setItem('last_assessment', JSON.stringify({ local_id: newLocalId, createdAt: new Date().toISOString(), data }));
            const r = require('expo-router');
            r?.router?.replace?.({ pathname: '/assessment/[id]', params: { id: String(newLocalId) } });
        } catch (err) {
            console.error('Failed to save assessment', err);
        }
    };

    const showPreview = () => { setPreviewData(getValues()); setPreviewVisible(true); };
    const cancelPreview = () => setPreviewVisible(false);
    const confirmSave = () => { setPreviewVisible(false); handleSubmit(onSubmit)(); };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading Assessment...</Text>
            </SafeAreaView>
        );
    }

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

            <TouchableOpacity
                onPress={() => setRemoteDataVisible(true)}
                style={{ position: 'absolute', bottom: 24, right: 20, backgroundColor: PRIMARY_COLOR, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, zIndex: 9999, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 3 }}
                accessibilityLabel="Show remote JSON data"
            >
                <Icon name="visibility" size={26} color="#ffffff" />
            </TouchableOpacity>

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

            <Modal visible={remoteDataVisible} animationType="slide" transparent onRequestClose={() => setRemoteDataVisible(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxHeight: '80%', elevation: 8 }}>
                        <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' }}>Fetched Remote Data</Text>
                        <ScrollView style={{ maxHeight: 400, marginBottom: 16 }}>
                            <Text style={{ fontSize: 14, color: '#333' }}>{assessmentData ? JSON.stringify(assessmentData, null, 2) : 'No data loaded'}</Text>
                        </ScrollView>
                        <Pressable style={{ padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12, backgroundColor: '#f3f3f3' }} onPress={() => setRemoteDataVisible(false)}>
                            <Text style={{ color: '#333' }}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Hide the bottom tab bar and header when this screen is active
export const options = { tabBarStyle: { display: 'none' }, headerShown: false };
