import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, TouchableOpacity, Alert, View, Modal, Pressable } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncPending, saveAssessment, updateAssessment, getAssessmentById } from '../../../lib/local-db';
import { syncPendingToAppwrite, getCurrentUser } from '../../../lib/appwrite';
import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
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
interface BuildingLocationData { street: string; barangay: string; municipality: string; province: string; latitude?: string; longitude?: string; buildingImages?: string[]; }
interface LandReferenceData { owner: string; titleNumber: string; lotNumber: string; blockNumber: string; surveyNumber: string; tdnArpNumber: string; area: string; }
interface FloorArea { id: string; floorNumber: string; area: string; }
interface GeneralFormData { kindOfBuilding: string; structuralType: string; buildingPermitNo: string; condominiumCCT: string; completionCertificateDate: string; occupancyCertificateDate: string; dateConstructed: string; dateOccupied: string; buildingAge: string; numberOfStoreys: string; floorAreas: FloorArea[]; totalFloorArea: string; floorPlanImages: string[]; floorPlanDrawings: string[]; }
interface FloorMaterial { id: string; floorName: string; material: string; otherSpecify: string; }
interface WallPartition { id: string; wallName: string; material: string; otherSpecify: string; }
interface StructuralFormData { foundation: { reinforceConcrete: boolean; plainConcrete: boolean; others: boolean; othersSpecify: string; }; columns: { steel: boolean; reinforceConcrete: boolean; wood: boolean; others: boolean; othersSpecify: string; }; beams: { steel: boolean; reinforceConcrete: boolean; others: boolean; othersSpecify: string; }; trussFraming: { steel: boolean; wood: boolean; others: boolean; othersSpecify: string; }; roof: { reinforceConcrete: boolean; tiles: boolean; giSheet: boolean; aluminum: boolean; asbestos: boolean; longSpan: boolean; concreteDesk: boolean; nipaAnahawCogon: boolean; others: boolean; othersSpecify: string; }; flooring: FloorMaterial[]; wallsPartitions: WallPartition[]; }
interface AssessmentFormData { owner_details: OwnerDetailsData; building_location: BuildingLocationData; land_reference: LandReferenceData; general_description: GeneralFormData; structural_materials?: StructuralFormData; property_appraisal?: PropertyAppraisalData; property_assessment?: PropertyAssessmentData; additionalItems?: any; additionalItem?: string; }
interface PropertyAssessmentData { id: number | string; market_value: number | string; building_category: string; assessment_level: string; assessment_value: number | string; taxable: number | string; eff_year: string; eff_quarter: string; total_area: string; }
interface Description { kindOfBuilding: string; structuralType: string; }
interface PropertyAppraisalData { description: Description[]; area: string; unit_value: string; bucc: string; baseMarketValue: string; depreciation: string; depreciationCost: string; marketValue: string; }

const DEFAULT_VALUES: AssessmentFormData = {
    owner_details: { transactionCode: "", tdArp: "", pin: "", owner: "", address: "", tin: "", telNo: "", hasAdministratorBeneficiary: false, administratorBeneficiary: { name: "", address: "", tin: "", telNo: "", }, },
    building_location: { street: "", barangay: "", municipality: "", province: "Agusan del Norte", },
    land_reference: { owner: '', titleNumber: '', lotNumber: '', blockNumber: '', surveyNumber: '', tdnArpNumber: '', area: '', },
    general_description: { kindOfBuilding: '', structuralType: '', buildingPermitNo: '', condominiumCCT: '', completionCertificateDate: '', occupancyCertificateDate: '', dateConstructed: '', dateOccupied: '', buildingAge: '', numberOfStoreys: '', floorAreas: [{ id: '1', floorNumber: 'Ground Floor', area: '' }], totalFloorArea: '0', floorPlanImages: [], floorPlanDrawings: [] },
    structural_materials: { foundation: { reinforceConcrete: false, plainConcrete: false, others: false, othersSpecify: '', }, columns: { steel: false, reinforceConcrete: false, wood: false, others: false, othersSpecify: '', }, beams: { steel: false, reinforceConcrete: false, others: false, othersSpecify: '', }, trussFraming: { steel: false, wood: false, others: false, othersSpecify: '', }, roof: { reinforceConcrete: false, tiles: false, giSheet: false, aluminum: false, asbestos: false, longSpan: false, concreteDesk: false, nipaAnahawCogon: false, others: false, othersSpecify: '', }, flooring: [{ id: '1', floorName: 'Ground Floor', material: '', otherSpecify: '' }], wallsPartitions: [{ id: '1', wallName: 'Main Wall', material: '', otherSpecify: '' }], },
    property_appraisal: { description: [{ kindOfBuilding: '', structuralType: '', }], area: '', unit_value: '', bucc: '', baseMarketValue: '', depreciation: '', depreciationCost: '', marketValue: '', },
    property_assessment: { id: 0, market_value: 0, building_category: '', assessment_level: '', assessment_value: 0, taxable: 1, eff_year: new Date().getFullYear().toString(), eff_quarter: 'QTR2', total_area: '0' },
    additionalItems: { items: [], subTotal: 0, total: 0 },
    additionalItem: '',
};

const dummy_data = (): AssessmentFormData => ({
    owner_details: {
        transactionCode: "RPTAS-2024-001234",
        tdArp: "08-001-12345",
        pin: "085-12-001-01-001",
        owner: "Maria Santos-Dela Cruz",
        address: "456 Rizal Street, Poblacion, Carmen, Agusan del Norte",
        tin: "123-456-789-000",
        telNo: "+63-917-123-4567",
        hasAdministratorBeneficiary: true,
        administratorBeneficiary: {
            name: "Roberto Santos Dela Cruz",
            address: "789 Bonifacio Avenue, Poblacion, Carmen, Agusan del Norte",
            tin: "987-654-321-000",
            telNo: "+63-928-987-6543"
        }
    },
    building_location: {
        street: "456 Rizal Street",
        barangay: "Poblacion",
        municipality: "Carmen",
        province: "Agusan del Norte",
        latitude: "",
        longitude: "",
        buildingImages: []
    },
    land_reference: {
        owner: 'Maria Santos-Dela Cruz',
        titleNumber: 'TCT-T-12345',
        lotNumber: '1234',
        blockNumber: '12',
        surveyNumber: 'Psd-08-001234',
        tdnArpNumber: '08-001-12345',
        area: '250',
    },
    general_description: {
        kindOfBuilding: 'Residential',
        structuralType: 'II-A',
        buildingPermitNo: 'BP-2022-0456',
        condominiumCCT: 'BP-2022-0456',
        completionCertificateDate: '2022-08-15T00:00:00.000Z',
        occupancyCertificateDate: '2022-09-01T00:00:00.000Z',
        dateConstructed: '2022-03-01T00:00:00.000Z',
        dateOccupied: '2022-09-15T00:00:00.000Z',
        buildingAge: '2',
        numberOfStoreys: '2',
        floorAreas: [
            { id: '1', floorNumber: 'Ground Floor', area: '120' },
            { id: '2', floorNumber: 'Second Floor', area: '100' }
        ],
        totalFloorArea: '',
        floorPlanImages: [],
        floorPlanDrawings: []
    },
    structural_materials: {
        foundation: {
            reinforceConcrete: true,
            plainConcrete: false,
            others: false,
            othersSpecify: ''
        },
        columns: {
            steel: false,
            reinforceConcrete: true,
            wood: false,
            others: false,
            othersSpecify: ''
        },
        beams: {
            steel: false,
            reinforceConcrete: true,
            others: false,
            othersSpecify: ''
        },
        trussFraming: {
            steel: true,
            wood: false,
            others: false,
            othersSpecify: ''
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
            othersSpecify: ''
        },
        flooring: [
            { id: '1', floorName: 'Ground Floor', material: 'Tiles (Ceramic)', otherSpecify: '' },
            { id: '2', floorName: 'Second Floor', material: 'Tiles (Ceramic)', otherSpecify: '' }
        ],
        wallsPartitions: [
            { id: '1', wallName: 'Exterior Walls', material: 'Concrete Hollow Blocks (CHB)', otherSpecify: '' },
            { id: '2', wallName: 'Interior Partitions', material: 'Concrete Hollow Blocks (CHB)', otherSpecify: '' }
        ]
    },
    property_appraisal: {
        description: [{
            kindOfBuilding: '',
            structuralType: ''
        }],
        area: '',
        unit_value: '',
        bucc: '',
        baseMarketValue: '',
        depreciation: '',
        depreciationCost: '',
        marketValue: ''
    },
    property_assessment: {
        id: '',
        market_value: '',
        building_category: '',
        assessment_level: '',
        assessment_value: '',
        taxable: '1',
        eff_year: '2026',
        eff_quarter: 'QTR2',
        total_area: ''
    },
    additionalItems: {
        items: [],
        subTotal: 0,
        total: 0
    },
    additionalItem: ''
});

const AddAssessment: React.FC = () => {
    const params = useLocalSearchParams<{ mode?: string; id?: string }>();
    const isEdit = (params?.mode === 'edit');
    const editId = params?.id ? Number(params.id) : undefined;
    const methods = useForm<AssessmentFormData>({ defaultValues: DEFAULT_VALUES });
    const { handleSubmit, reset, getValues } = methods;
    const [previewVisible, setPreviewVisible] = React.useState(false);
    const [previewData, setPreviewData] = React.useState<AssessmentFormData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [lastMeta, setLastMeta] = React.useState<{ local_id?: number; createdAt?: string } | null>(null);
    const showPreview = () => { setPreviewData(getValues()); setPreviewVisible(true); };
    const cancelPreview = () => { setPreviewVisible(false); };
    const confirmSave = () => { setPreviewVisible(false); handleSubmit(onSubmit)(); };
    const handleSync = async () => {
        Alert.alert('Sync Pending', 'Start syncing pending assessments to Appwrite?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'OK',
                onPress: async () => {
                    try {
                        const u = await getCurrentUser();
                        const results = await syncPendingToAppwrite({ userId: u?.$id });
                        const ok = results.filter((r) => r.ok).length;
                        const fail = results.length - ok;
                        Alert.alert('Sync complete', fail > 0 ? `Synced ${ok}, ${fail} failed.` : `Synced ${ok} item(s).`);
                    } catch (err: any) {
                        console.error('Sync failed', err);
                        Alert.alert('Sync failed', err?.message || 'An error occurred during sync');
                    }
                }
            }
        ]);
    };
    const onSubmit = async (data: AssessmentFormData) => {
        try {
            if (isEdit && lastMeta?.local_id) {
                await updateAssessment(lastMeta.local_id, data);
                await AsyncStorage.setItem('last_assessment', JSON.stringify({ createdAt: lastMeta?.createdAt || new Date().toISOString(), data, local_id: lastMeta.local_id }));
                Alert.alert('Assessment Updated', 'Changes saved to device');
                // Navigate back to the edited detail screen
                try {
                    const r = require('expo-router');
                    r?.router?.replace?.({ pathname: '/assessment/[id]', params: { id: String(lastMeta.local_id) } });
                } catch (e) { /* ignore */ }
            } else {
                const entry = { createdAt: new Date().toISOString(), data };
                // Persist via local DB (SQLite if available, otherwise AsyncStorage fallback)
                const newId = await saveAssessment(entry);
                // Also keep a last_assessment for quick preview/edit continuity
                await AsyncStorage.setItem('last_assessment', JSON.stringify({ ...entry, local_id: newId }));
                Alert.alert('Assessment Saved', 'Saved to device');
                // Go back to the list so it can refresh
                try { const r = require('expo-router'); r?.router?.back(); } catch (e) { /* ignore navigation errors */ }
            }
        } catch (err: any) {
            console.error('Failed to save assessment', err);
            Alert.alert('Save failed', err?.message || 'An error occurred while saving');
        }
    };
    const fillDummyData = () => reset(dummy_data());
    const clearForm = () => reset(DEFAULT_VALUES);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (isEdit) {
                    // If coming from edit, prefill with last_assessment
                    const raw = await AsyncStorage.getItem('last_assessment');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (mounted) {
                            if (parsed?.data) reset(parsed.data);
                            setLastMeta({ local_id: parsed?.local_id ?? (editId || undefined), createdAt: parsed?.createdAt });
                        }
                    } else if (editId) {
                        // Fallback: fetch from DB by id
                        const row = await getAssessmentById(editId);
                        if (row && mounted) {
                            reset(row.data);
                            setLastMeta({ local_id: row.local_id, createdAt: row.created_at });
                        }
                    }
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <ScrollView style={{ padding: 16 }} contentContainerStyle={{ paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
                <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 16 }}>{isEdit ? 'Edit Assessment' : 'Add Assessment'}</Text>
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
                    <Text style={{ color: '#ffffff', textAlign: 'center', fontWeight: '700', fontSize: 18 }}>{isEdit ? 'Save Changes' : 'Save Assessment'}</Text>
                </TouchableOpacity>
            </ScrollView>
            <View pointerEvents="box-none" style={{ position: 'absolute', right: 16, bottom: 24 }}>
                <View style={{ flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => { Alert.alert('Clear Form', 'Reset all fields to default?', [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: () => clearForm() }]); }} accessibilityLabel="Clear form" style={{ backgroundColor: '#fff', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, borderWidth: 1, borderColor: PRIMARY_COLOR, marginBottom: 12 }}>
                        <MaterialIcons name="clear" size={22} color={PRIMARY_COLOR} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { Alert.alert('Fill Dummy Data', 'Fill form with dummy data?', [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', onPress: () => fillDummyData() }]); }} accessibilityLabel="Fill dummy data" style={{ backgroundColor: PRIMARY_COLOR, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 }}>
                        <MaterialIcons name="filter-alt" size={22} color="#fff" />
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
                            <Pressable style={[styles.actionButton, { backgroundColor: PRIMARY_COLOR }]} onPress={confirmSave}><Text style={{ color: '#fff' }}>{isEdit ? 'Confirm Update' : 'Confirm Save'}</Text></Pressable>
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
