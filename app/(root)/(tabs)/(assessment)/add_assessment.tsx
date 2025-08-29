import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, TouchableOpacity, Alert, View, Modal, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDB, saveAssessment, syncPending } from '../../../../lib/local-db';
import { navigateToAssessment } from '../../../../lib/navigation';
import { SYNC_API_URL } from '../../../../constants/sync';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useForm, FormProvider } from 'react-hook-form';
import OwnerDetailsForm from '../../../../components/OwnerDetailsForm';
import BuildingLocationForm from '../../../../components/BuildingLocationForm';
import LandReferenceForm from '../../../../components/LandReferenceForm';
import GeneralDescriptionForm from '../../../../components/GeneralDescriptionForm';
import StructuralMaterialsForm from '../../../../components/StructuralMaterialsForm';
import PropertyAppraisalForm from '../../../../components/PropertyAppraisalForm';
import AdditionalItems from '../../../../components/AdditionalItems';
import PropertyAssessment from '../../../../components/PropertyAssessment';
import { PRIMARY_COLOR } from '../../../../constants/colors';

const AddAssessment: React.FC = () => {
    const methods = useForm<any>({ defaultValues: {} });
    const { handleSubmit, reset, getValues } = methods;

    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    useEffect(() => { initDB(); }, []);

    const onSubmit = (data: any) => {
        // show preview modal with collected data
        setPreviewData(data);
        setPreviewVisible(true);
    };

    const confirmSave = async () => {
        if (!previewData) return;
        try {
            const entry = { createdAt: new Date().toISOString(), data: previewData };
            const localId = await saveAssessment(entry);
            await AsyncStorage.setItem('last_assessment', JSON.stringify({ local_id: localId, ...entry }));
            setPreviewVisible(false);
            Alert.alert('Assessment Saved', 'Saved locally (id: ' + localId + ')');
            if (localId) navigateToAssessment(localId);
        } catch (err: any) {
            console.error('Failed to save assessment to local DB', err);
            Alert.alert('Save failed', err?.message || 'An error occurred while saving locally');
        }
    };

    const cancelPreview = () => {
        setPreviewVisible(false);
    };

    // Minimal realistic dummy data used to populate the whole form for testing
    const dummy_data = () => ({
        owner_details: {
            owner: 'Juan Dela Cruz',
            address: '123 Rizal St., Barangay Uno',
            tin: '123-456-789',
            telNo: '09171234567',
            hasAdministratorBeneficiary: false,
        },
        building_location: {
            street: 'Rizal St.',
            barangay: 'Barangay Uno',
            municipality: 'Metro City',
            province: 'Province',
        },
        land_reference: {
            owner: 'Juan Dela Cruz',
            titleNumber: 'TN-2025-001',
            lotNumber: 'LN-01',
            blockNumber: 'B1',
            surveyNumber: 'S-001',
            tdnArpNumber: 'TDN-123',
            area: '150',
        },
        general_description: {
            kindOfBuilding: 'Residential',
            structuralType: 'Reinforced Concrete',
            buildingPermitNo: 'BP-2025-001',
            condominiumCCT: '',
            completionCertificateDate: '',
            occupancyCertificateDate: '',
            dateConstructed: '',
            dateOccupied: '',
            buildingAge: '3',
            numberOfStoreys: '2',
            floorAreas: [],
            totalFloorArea: '150',
            floorPlanImages: [],
        },
        structural_materials: {},
        property_appraisal: {
            description: [{ kindOfBuilding: 'Residential', structuralType: 'Reinforced Concrete' }],
            area: '150',
            unit_value: '1200',
            bucc: '',
            baseMarketValue: '180000',
            depreciation: '0',
            depreciationCost: '0',
            marketValue: '180000',
        },
        property_assessment: {
            id: 1,
            market_value: 180000,
            building_category: 'A',
            assessment_level: 'Standard',
            assessment_value: 1800,
            taxable: 1,
            eff_year: '2025',
            eff_quarter: 'Q3',
            total_area: '150',
        },
        additionalItems: [],
        additionalItem: '',
    });

    const fillDummyData = () => reset(dummy_data());
    const clearForm = () => reset({});

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <ScrollView style={{ padding: 16 }} contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
                <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 16 }}>Add Assessment</Text>

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

                <TouchableOpacity onPress={handleSubmit(onSubmit)} style={{ backgroundColor: PRIMARY_COLOR, padding: 12, borderRadius: 8, marginTop: 16 }}>
                    <Text style={{ color: '#ffffff', textAlign: 'center', fontWeight: '700', fontSize: 18 }}>Save Assessment</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Floating action cluster (stacked) at bottom-right */}
            <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom: 24 }}>
                <View style={{ flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => { Alert.alert('Clear Form', 'Reset all fields to default?', [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: () => clearForm() }]); }} accessibilityLabel="Clear form" style={{ backgroundColor: '#fff', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, borderWidth: 1, borderColor: PRIMARY_COLOR, marginBottom: 12 }}>
                        <Icon name="clear" size={22} color={PRIMARY_COLOR} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { Alert.alert('Fill Dummy Data', 'Fill form with dummy data?', [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: () => fillDummyData() }]); }} accessibilityLabel="Fill dummy data" style={{ backgroundColor: PRIMARY_COLOR, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 }}>
                        <Icon name="filter-alt" size={22} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={async () => { if (!SYNC_API_URL) { Alert.alert('No Sync URL', 'Please configure SYNC_API_URL in constants/sync.ts before syncing.'); return; } Alert.alert('Sync Pending', 'Start syncing pending assessments to server?', [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: async () => { try { await syncPending(SYNC_API_URL); Alert.alert('Sync complete', 'Pending assessments have been synced.'); } catch (err: any) { console.error('Sync failed', err); Alert.alert('Sync failed', err?.message || 'An error occurred during sync'); } } }]); }} accessibilityLabel="Sync pending assessments" style={{ backgroundColor: '#fff', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, borderWidth: 1, borderColor: PRIMARY_COLOR, marginTop: 12 }}>
                        <Icon name="sync" size={22} color={PRIMARY_COLOR} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Preview Modal */}
            <Modal visible={previewVisible} animationType="slide" transparent={true} onRequestClose={cancelPreview}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Preview Assessment</Text>
                        <ScrollView style={styles.previewScroll}>
                            <Text style={styles.previewText}>{previewData ? JSON.stringify(previewData, null, 2) : 'No data'}</Text>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <Pressable style={[styles.actionButton, { backgroundColor: '#f3f3f3' }]} onPress={cancelPreview}>
                                <Text style={{ color: '#333' }}>Cancel</Text>
                            </Pressable>
                            <Pressable style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]} onPress={confirmSave}>
                                <Text style={{ color: '#fff' }}>Confirm Save</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '92%', maxHeight: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    previewScroll: { backgroundColor: '#fafafa', padding: 12, borderRadius: 8, maxHeight: 420 },
    previewText: { fontFamily: 'monospace', fontSize: 12, color: '#222' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    actionButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
});

export default AddAssessment;
