import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, TouchableOpacity, Alert, View, Modal, Pressable } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncPending } from '../../../lib/local-db';
import { SYNC_API_URL } from '../../../constants/sync';
import { useEffect } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useForm, FormProvider } from "react-hook-form";
import OwnerDetailsForm from "../../../components/OwnerDetailsForm";
import BuildingLocationForm from "../../../components/BuildingLocationForm";
import LandReferenceForm from "../../../components/LandReferenceForm";
import GeneralDescriptionForm from "../../../components/GeneralDescriptionForm";
import StructuralMaterialsForm from "../../../components/StructuralMaterialsForm";
import PropertyAppraisalForm from "../../../components/PropertyAppraisalForm";
import AdditionalItems from "../../../components/AdditionalItems";
import PropertyAssessment from "../../../components/PropertyAssessment";
import { PRIMARY_COLOR } from '../../../constants/colors';

// Interfaces (abbreviated — same shapes as other file)
interface AdministratorBeneficiaryData { name: string; address: string; tin: string; telNo: string; }
interface OwnerDetailsData { owner: string; address: string; tin: string; telNo: string; hasAdministratorBeneficiary: boolean; administratorBeneficiary?: AdministratorBeneficiaryData; transactionCode?: string; tdArp?: string; pin?: string; }
interface BuildingLocationData { street: string; barangay: string; municipality: string; province: string; }
interface LandReferenceData { owner: string; titleNumber: string; lotNumber: string; blockNumber: string; surveyNumber: string; tdnArpNumber: string; area: string; }
interface FloorArea { id: string; floorNumber: string; area: string; }
interface GeneralFormData { kindOfBuilding: string; structuralType: string; buildingPermitNo: string; condominiumCCT: string; completionCertificateDate: string; occupancyCertificateDate: string; dateConstructed: string; dateOccupied: string; buildingAge: string; numberOfStoreys: string; floorAreas: FloorArea[]; totalFloorArea: string; floorPlanImages: string[]; }
interface FloorMaterial { id: string; floorName: string; material: string; otherSpecify: string; }
interface WallPartition { id: string; wallName: string; material: string; otherSpecify: string; }
interface StructuralFormData { foundation: { reinforceConcrete: boolean; plainConcrete: boolean; others: boolean; othersSpecify: string; }; columns: { steel: boolean; reinforceConcrete: boolean; wood: boolean; others: boolean; othersSpecify: string; }; beams: { steel: boolean; reinforceConcrete: boolean; others: boolean; othersSpecify: string; }; trussFraming: { steel: boolean; wood: boolean; others: boolean; othersSpecify: string; }; roof: { reinforceConcrete: boolean; tiles: boolean; giSheet: boolean; aluminum: boolean; asbestos: boolean; longSpan: boolean; concreteDesk: boolean; nipaAnahawCogon: boolean; others: boolean; othersSpecify: string; }; flooring: FloorMaterial[]; wallsPartitions: WallPartition[]; }
interface AssessmentFormData { owner_details: OwnerDetailsData; building_location: BuildingLocationData; land_reference: LandReferenceData; general_description: GeneralFormData; structural_materials?: StructuralFormData; property_appraisal?: any; property_assessment?: any; additionalItems?: any; additionalItem?: string; }

const DEFAULT_VALUES: AssessmentFormData = {
    owner_details: { transactionCode: "", tdArp: "", pin: "", owner: "", address: "", tin: "", telNo: "", hasAdministratorBeneficiary: false, administratorBeneficiary: { name: "", address: "", tin: "", telNo: "", }, },
    building_location: { street: "", barangay: "", municipality: "", province: "", },
    land_reference: { owner: '', titleNumber: '', lotNumber: '', blockNumber: '', surveyNumber: '', tdnArpNumber: '', area: '', },
    general_description: { kindOfBuilding: '', structuralType: '', buildingPermitNo: '', condominiumCCT: '', completionCertificateDate: '', occupancyCertificateDate: '', dateConstructed: '', dateOccupied: '', buildingAge: '', numberOfStoreys: '', floorAreas: [{ id: '1', floorNumber: 'Ground Floor', area: '' }], totalFloorArea: '0', floorPlanImages: [], },
    structural_materials: { foundation: { reinforceConcrete: false, plainConcrete: false, others: false, othersSpecify: '', }, columns: { steel: false, reinforceConcrete: false, wood: false, others: false, othersSpecify: '', }, beams: { steel: false, reinforceConcrete: false, others: false, othersSpecify: '', }, trussFraming: { steel: false, wood: false, others: false, othersSpecify: '', }, roof: { reinforceConcrete: false, tiles: false, giSheet: false, aluminum: false, asbestos: false, longSpan: false, concreteDesk: false, nipaAnahawCogon: false, others: false, othersSpecify: '', }, flooring: [{ id: '1', floorName: 'Ground Floor', material: '', otherSpecify: '' }], wallsPartitions: [{ id: '1', wallName: 'Main Wall', material: '', otherSpecify: '' }], },
    property_appraisal: { description: [{ kindOfBuilding: '', structuralType: '', }], area: '', unit_value: '', bucc: '', baseMarketValue: '', depreciation: '', depreciationCost: '', marketValue: '', },
    property_assessment: { id: 0, market_value: 0, building_category: '', assessment_level: '', assessment_value: 0, taxable: 1, eff_year: new Date().getFullYear().toString(), eff_quarter: 'QTR1', total_area: '0' },
    additionalItems: { items: [], subTotal: 0, total: 0 },
    additionalItem: '',
};

const dummy_data = (): AssessmentFormData => ({
    owner_details: { transactionCode: "12345", tdArp: "67890", pin: "112233", owner: "John Doe", address: "123 Main St", tin: "123-456-789", telNo: "123-456-7890", hasAdministratorBeneficiary: true, administratorBeneficiary: { name: "Jane Doe", address: "456 Elm St", tin: "987-654-321", telNo: "098-765-4321", } },
    building_location: { street: "123 Main St", barangay: "Soriano", municipality: "Cabadbaran City", province: "Agusan del Norte" },
    land_reference: { owner: 'Juan dela Cruz', titleNumber: 'OCT-123456', lotNumber: '123', blockNumber: '123', surveyNumber: '123', tdnArpNumber: '123', area: '1000', },
    general_description: { kindOfBuilding: 'Residential', structuralType: 'I-A', buildingPermitNo: 'BP-2023-12345', condominiumCCT: 'asasasdasd', completionCertificateDate: '2023-01-15T00:00:00.000Z', occupancyCertificateDate: '2023-02-01T00:00:00.000Z', dateConstructed: '2023-01-10T00:00:00.000Z', dateOccupied: '2023-02-15T00:00:00.000Z', buildingAge: '1', numberOfStoreys: '2', floorAreas: [{ id: '1', floorNumber: 'Ground Floor', area: '80' }, { id: '2', floorNumber: 'Second Floor', area: '70' }], totalFloorArea: '150', floorPlanImages: [], },
    structural_materials: { foundation: { reinforceConcrete: true, plainConcrete: false, others: false, othersSpecify: '', }, columns: { steel: false, reinforceConcrete: true, wood: false, others: false, othersSpecify: '', }, beams: { steel: false, reinforceConcrete: true, others: false, othersSpecify: '', }, trussFraming: { steel: true, wood: false, others: false, othersSpecify: '', }, roof: { reinforceConcrete: false, tiles: false, giSheet: true, aluminum: false, asbestos: false, longSpan: false, concreteDesk: false, nipaAnahawCogon: false, others: false, othersSpecify: '', }, flooring: [{ id: '1', floorName: 'Ground Floor', material: 'Reinforce Concrete', otherSpecify: '' }, { id: '2', floorName: 'Second Floor', material: 'Tiles', otherSpecify: '' }], wallsPartitions: [{ id: '1', wallName: 'Exterior Walls', material: 'Reinforce Concrete', otherSpecify: '' }, { id: '2', wallName: 'Interior Partitions', material: 'CHB', otherSpecify: '' }], },
    property_appraisal: { description: [{ kindOfBuilding: '', structuralType: '', }], area: '', unit_value: '', bucc: '', baseMarketValue: '', depreciation: '', depreciationCost: '', marketValue: '' },
    additionalItems: { items: [], subTotal: 0, total: 0 },
    additionalItem: '',
});

const AddAssessment: React.FC = () => {
    const methods = useForm<AssessmentFormData>({ defaultValues: DEFAULT_VALUES });
    const { handleSubmit, reset, getValues } = methods;
    const [previewVisible, setPreviewVisible] = React.useState(false);
    const [previewData, setPreviewData] = React.useState<AssessmentFormData | null>(null);
    const showPreview = () => { setPreviewData(getValues()); setPreviewVisible(true); };
    const cancelPreview = () => { setPreviewVisible(false); };
    const confirmSave = () => { setPreviewVisible(false); handleSubmit(onSubmit)(); };
    const onSubmit = async (data: AssessmentFormData) => {
        try {
            const entry = { createdAt: new Date().toISOString(), data };
            await AsyncStorage.setItem('last_assessment', JSON.stringify(entry));
            Alert.alert('Assessment Saved', 'Saved to device (last_assessment)');
        } catch (err: any) {
            console.error('Failed to save assessment', err);
            Alert.alert('Save failed', err?.message || 'An error occurred while saving');
        }
    };
    const fillDummyData = () => reset(dummy_data());
    const clearForm = () => reset(DEFAULT_VALUES);

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
                <TouchableOpacity onPress={showPreview} style={{ backgroundColor: PRIMARY_COLOR, padding: 12, borderRadius: 8, marginTop: 16 }}>
                    <Text style={{ color: '#ffffff', textAlign: 'center', fontWeight: '700', fontSize: 18 }}>Save Assessment</Text>
                </TouchableOpacity>
            </ScrollView>
            <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom: 24 }}>
                <View style={{ flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => { Alert.alert('Clear Form', 'Reset all fields to default?', [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: () => clearForm() }]); }} accessibilityLabel="Clear form" style={{ backgroundColor: '#fff', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, borderWidth: 1, borderColor: PRIMARY_COLOR, marginBottom: 12 }}>
                        <Icon name="clear" size={22} color={PRIMARY_COLOR} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { Alert.alert('Fill Dummy Data', 'Fill form with dummy data?', [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: () => fillDummyData() }]); }} accessibilityLabel="Fill dummy data" style={{ backgroundColor: PRIMARY_COLOR, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 }}>
                        <Icon name="filter-alt" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => {
                        if (!SYNC_API_URL) { Alert.alert('No Sync URL', 'Please configure SYNC_API_URL in constants/sync.ts before syncing.'); return; }
                        Alert.alert('Sync Pending', 'Start syncing pending assessments to server?', [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: async () => { try { await syncPending(SYNC_API_URL); Alert.alert('Sync complete', 'Pending assessments have been synced.'); } catch (err: any) { console.error('Sync failed', err); Alert.alert('Sync failed', err?.message || 'An error occurred during sync'); } } }]);
                    }} accessibilityLabel="Sync pending assessments" style={{ backgroundColor: '#fff', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, borderWidth: 1, borderColor: PRIMARY_COLOR, marginTop: 12 }}>
                        <Icon name="sync" size={22} color={PRIMARY_COLOR} />
                    </TouchableOpacity>
                </View>
            </View>
            <Modal visible={previewVisible} animationType="slide" transparent={true} onRequestClose={cancelPreview}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Preview Assessment</Text>
                        <ScrollView style={styles.previewScroll}>
                            <Text style={styles.previewText}>{previewData ? JSON.stringify(previewData, null, 2) : 'No data'}</Text>
                        </ScrollView>
                        <View style={styles.modalActions}>
                            <Pressable style={[styles.actionButton, { backgroundColor: '#f3f3f3' }]} onPress={cancelPreview}><Text style={{ color: '#333' }}>Cancel</Text></Pressable>
                            <Pressable style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]} onPress={confirmSave}><Text style={{ color: '#fff' }}>Confirm Save</Text></Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

import { StyleSheet } from "react-native";
const styles = StyleSheet.create({ modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', }, modalContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxHeight: '80%', elevation: 8, }, modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center', }, previewScroll: { maxHeight: 300, marginBottom: 16, }, previewText: { fontSize: 14, color: '#333', }, modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, }, actionButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 8, }, });

export default AddAssessment;

// Hide the bottom tab bar and header when this screen is active
export const options = { tabBarStyle: { display: 'none' }, headerShown: false };
