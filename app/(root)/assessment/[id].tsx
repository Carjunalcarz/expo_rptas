import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, Dimensions, Linking, Alert, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDebugContext } from '@/lib/debug-provider';
import images from '@/constants/images';
import { getAssessmentById, deleteAssessment, getAllAssessments } from '@/lib/local-db';
import { getAssessmentDocument, deleteAssessmentDocument } from '@/lib/appwrite';
import { parseAssessmentData } from '@/lib/parser';
import { getRouter } from '@/lib/router';
import { FormProvider, useForm } from 'react-hook-form';
import HeaderHero from './components/HeaderHero';
import OwnerCard from './components/OwnerCard';
import Tabs from './components/Tabs';
import Sections from './components/Sections';
import { router } from 'expo-router';

// TypeScript interfaces for type safety
interface AdministratorBeneficiaryData { name: string; address: string; tin: string; telNo: string; }
interface OwnerDetailsData { owner: string; address: string; tin: string; telNo: string; hasAdministratorBeneficiary: boolean; administratorBeneficiary?: AdministratorBeneficiaryData; transactionCode?: string; tdArp?: string; pin?: string; }
interface BuildingLocationData { street: string; barangay: string; municipality: string; province: string; latitude?: string; longitude?: string; buildingImages?: string[]; }
interface LandReferenceData { owner: string; titleNumber: string; lotNumber: string; blockNumber: string; surveyNumber: string; tdnArpNumber: string; area: string; }
interface FloorArea { id: string; floorNumber: string; area: string; }
interface GeneralFormData { kindOfBuilding: string; structuralType: string; buildingPermitNo: string; condominiumCCT: string; completionCertificateDate: string; occupancyCertificateDate: string; dateConstructed: string; dateOccupied: string; buildingAge: string; numberOfStoreys: string; floorAreas: FloorArea[]; totalFloorArea: string; floorPlanImages: string[]; }
interface FloorMaterial { id: string; floorName: string; material: string; otherSpecify: string; }
interface WallPartition { id: string; wallName: string; material: string; otherSpecify: string; }
interface StructuralFormData { foundation: { reinforceConcrete: boolean; plainConcrete: boolean; others: boolean; othersSpecify: string; }; columns: { steel: boolean; reinforceConcrete: boolean; wood: boolean; others: boolean; othersSpecify: string; }; beams: { steel: boolean; reinforceConcrete: boolean; others: boolean; othersSpecify: string; }; trussFraming: { steel: boolean; wood: boolean; others: boolean; othersSpecify: string; }; roof: { reinforceConcrete: boolean; tiles: boolean; giSheet: boolean; aluminum: boolean; asbestos: boolean; longSpan: boolean; concreteDesk: boolean; nipaAnahawCogon: boolean; others: boolean; othersSpecify: string; }; flooring: FloorMaterial[]; wallsPartitions: WallPartition[]; }
interface PropertyAssessmentData { id: number | string; market_value: number | string; building_category: string; assessment_level: string; assessment_value: number | string; taxable: number | string; eff_year: string; eff_quarter: string; total_area: string; }
interface Description { kindOfBuilding: string; structuralType: string; }
interface PropertyAppraisalData { description: Description[]; area: string; unit_value: string; bucc: string; baseMarketValue: string; depreciation: string; depreciationCost: string; marketValue: string; }
interface AssessmentFormData { owner_details: OwnerDetailsData; building_location: BuildingLocationData; land_reference: LandReferenceData; general_description: GeneralFormData; structural_materials?: StructuralFormData; property_appraisal?: PropertyAppraisalData; property_assessment?: PropertyAssessmentData; additionalItems?: any; additionalItem?: string; }
interface AssessmentMeta { local_id?: number; remote_id?: string | null; created_at?: string; synced?: boolean; }


const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

const AssessmentDetail: React.FC = () => {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { isDebugVisible } = useDebugContext();
    const [assessment, setAssessment] = React.useState<AssessmentFormData | null>(null);
    const [meta, setMeta] = React.useState<AssessmentMeta | null>(null);
    const [activeTab, setActiveTab] = React.useState('overview');
    const [loading, setLoading] = React.useState(true);
    const [notFound, setNotFound] = React.useState(false);
    const [refetching, setRefetching] = React.useState(false);
    const [showJsonModal, setShowJsonModal] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (!id) { setNotFound(true); return; }
                let assessmentData: AssessmentFormData | null = null;
                let metaData: AssessmentMeta | null = null;

                // Try to load from local DB first
                const numericId = Number(id);
                if (!Number.isNaN(numericId)) {
                    const row = await getAssessmentById(numericId);
                    if (row) {
                        assessmentData = row.data ?? null;
                        metaData = { local_id: row.local_id, remote_id: row.remote_id ?? null, created_at: row.created_at, synced: !!row.synced };
                    }
                }

                // If not found locally, try fetching from remote
                if (!assessmentData) {
                    try {
                        const remoteDoc = await getAssessmentDocument(id);
                        if (remoteDoc) {
                            const parsedData = parseAssessmentData(remoteDoc);
                            assessmentData = parsedData;
                            metaData = { remote_id: remoteDoc.$id, created_at: remoteDoc.$createdAt, synced: true };
                        }
                    } catch (e) {
                        console.log('Failed to fetch remote assessment, it may be a local-only ID that was not found.', e);
                    }
                }

                if (mounted) {
                    if (!assessmentData) {
                        setNotFound(true);
                    } else {
                        setAssessment(assessmentData);
                        setMeta(metaData);
                    }
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

    const refetchRemoteAssessment = async () => {
        if (!id || !meta?.remote_id) {
            Alert.alert('Error', 'Cannot refetch: No remote ID available');
            return;
        }

        setRefetching(true);
        try {
            const remoteDoc = await getAssessmentDocument(meta.remote_id);
            if (remoteDoc) {
                const parsedData = parseAssessmentData(remoteDoc);
                setAssessment(parsedData);
                setMeta({ ...meta, created_at: remoteDoc.$createdAt });
                Alert.alert('Success', 'Assessment data refreshed from remote');
            } else {
                Alert.alert('Error', 'Assessment not found on remote server');
            }
        } catch (error) {
            console.error('Failed to refetch remote assessment:', error);
            Alert.alert('Error', 'Failed to refresh assessment data');
        } finally {
            setRefetching(false);
        }
    };

    const methods = useForm({
        defaultValues: assessment || {},
        values: assessment || {},
    });

    React.useEffect(() => {
        methods.reset(assessment || {});
    }, [assessment]);

    const formatPHP = (v: number) => {
        try {
            return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v);
        } catch (e) {
            return `₱${Number(v).toFixed(2)}`;
        }
    };

    // legacy inline render helpers removed; content now lives in ./components/Sections

    const handleCall = () => {
        if (assessment?.owner_details?.telNo) {
            Linking.openURL(`tel:${assessment.owner_details.telNo}`);
        }
    };

    const handleMessage = () => {
        // Placeholder for messaging functionality
        console.log('Message owner');
    };

    const handleEdit = async () => {
        try {
            const isRemote = meta?.remote_id && !meta?.local_id;
            const editId = isRemote ? meta.remote_id : meta?.local_id;

            if (!editId) {
                Alert.alert('Error', 'Cannot edit this assessment as it has no valid ID.');
                return;
            }

            // Ensure the data being passed to the edit screen is fully parsed.
            // The `assessment` state already holds the correctly parsed data from the loading useEffect.
            const entry = {
                createdAt: meta?.created_at ?? new Date().toISOString(),
                data: assessment, // This now correctly holds the parsed data for both local and remote.
                local_id: meta?.local_id,
                remote_id: meta?.remote_id,
                synced: meta?.synced,
            };

            await AsyncStorage.setItem('last_assessment', JSON.stringify(entry));
            const router = getRouter();
            if (router) {
                router.push({ pathname: '/(root)/assessment/edit/[id]', params: { id: String(editId) } });
            }
        } catch (err) {
            console.warn('handleEdit failed', err);
            Alert.alert('Error', 'Could not prepare the assessment for editing.');
        }
    };

    const handleDeleteRecord = async () => {
        try {
            // Handle both local and remote assessments
            if (meta?.local_id) {
                // Local assessment deletion
                Alert.alert('Delete assessment', 'Are you sure you want to delete this local assessment? This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete', style: 'destructive', onPress: async () => {
                            try {
                                await deleteAssessment(meta.local_id!);
                                getRouter()?.back();
                            } catch (err) {
                                Alert.alert('Error', 'Failed to delete local assessment');
                                console.warn('delete error', err);
                            }
                        }
                    },
                ]);
            } else if (meta?.remote_id) {
                // Remote assessment deletion
                Alert.alert('Delete assessment', 'This will permanently delete the remote assessment. This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete', style: 'destructive', onPress: async () => {
                            try {
                                await deleteAssessmentDocument(meta.remote_id!);
                                getRouter()?.back();
                            } catch (err: any) {
                                Alert.alert('Error', err?.message || 'Failed to delete remote assessment');
                                console.warn('delete error', err);
                            }
                        }
                    },
                ]);
            } else {
                Alert.alert('Error', 'Cannot delete: No valid assessment ID found');
            }
        } catch (err) {
            console.warn('delete error', err);
            Alert.alert('Error', 'An unexpected error occurred');
        }
    };

    // Clean top-level render with early returns and componentized sections
    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (notFound || !assessment) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>Assessment not found.</Text>
                <TouchableOpacity onPress={() => getRouter()?.back()} style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#3b82f6', borderRadius: 8 }}>
                    <Text style={{ color: 'white', fontWeight: '600' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <FormProvider {...methods}>
            <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                    <HeaderHero onBack={() => getRouter()?.back()} />
                    <OwnerCard onMessage={handleMessage} onCall={handleCall} onEdit={handleEdit} onDelete={handleDeleteRecord} />
                    <Tabs value={activeTab} onChange={setActiveTab} />

                    <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                        <Sections activeTab={activeTab} />

                        <View style={{ marginTop: 28, marginBottom: 40 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 }}>Record Information</Text>
                            <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Local ID</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{meta?.local_id ?? '-'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Created At</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{meta?.created_at ? new Date(meta.created_at).toLocaleString() : '-'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Synced</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{meta?.synced ? 'Yes' : 'No'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    {/* Action buttons section - now part of scrollable content */}
                    <View style={{ backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 20 }}>
                        <View style={{ flexDirection: 'column', gap: 16 }}>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, color: '#6b7280' }}>Total Assessment</Text>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb' }}>
                                    {assessment?.property_assessment?.market_value ? formatPHP(Number(assessment.property_assessment.assessment_value)) : '-'}
                                </Text>
                            </View>

                            {/* Enhanced Action Buttons - Modern Design */}
                            <View style={{ flexDirection: 'column', gap: 12 }}>
                                {meta?.remote_id && (
                                    <TouchableOpacity
                                        onPress={refetchRemoteAssessment}
                                        disabled={refetching}
                                        style={{
                                            backgroundColor: refetching ? '#10b981' : '#059669',
                                            paddingVertical: 12,
                                            paddingHorizontal: 16,
                                            borderRadius: 12,
                                            minHeight: 44,
                                            shadowColor: '#059669',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 4,
                                            elevation: 4,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {refetching ? (
                                            <>
                                                <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                                    Refreshing Data...
                                                </Text>
                                            </>
                                        ) : (
                                            <>
                                                <View style={{
                                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                                    borderRadius: 8,
                                                    padding: 4,
                                                    marginRight: 8
                                                }}>
                                                    <Icon name="refresh" size={18} color="#FFF" />
                                                </View>
                                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                                    Refresh from Server
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                                
                                {/* Action Buttons Row */}
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            router.push({
                                                pathname: '/(root)/faas-report',
                                                params: { assessment: JSON.stringify(assessment) }
                                            });
                                        }}
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#059669',
                                            paddingVertical: 10,
                                            paddingHorizontal: 12,
                                            borderRadius: 10,
                                            minHeight: 40,
                                            shadowColor: '#059669',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.15,
                                            shadowRadius: 3,
                                            elevation: 3,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <View style={{
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            borderRadius: 6,
                                            padding: 3,
                                            marginRight: 6
                                        }}>
                                            <Icon name="description" size={16} color="#fff" />
                                        </View>
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Generate FAAS</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        onPress={() => {
                                            Alert.alert('Payment', 'Payment functionality coming soon!');
                                        }}
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#3b82f6',
                                            paddingVertical: 10,
                                            paddingHorizontal: 12,
                                            borderRadius: 10,
                                            minHeight: 40,
                                            shadowColor: '#3b82f6',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.15,
                                            shadowRadius: 3,
                                            elevation: 3,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <View style={{
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            borderRadius: 6,
                                            padding: 3,
                                            marginRight: 6
                                        }}>
                                            <Icon name="payment" size={16} color="#fff" />
                                        </View>
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Pay Now</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Debug JSON View Button - Only visible when debug is enabled */}
                                {isDebugVisible && (
                                    <TouchableOpacity
                                        onPress={() => setShowJsonModal(true)}
                                        style={{
                                            backgroundColor: '#6366f1',
                                            paddingVertical: 10,
                                            paddingHorizontal: 12,
                                            borderRadius: 10,
                                            minHeight: 40,
                                            shadowColor: '#6366f1',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.15,
                                            shadowRadius: 3,
                                            elevation: 3,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <View style={{
                                            backgroundColor: 'rgba(255,255,255,0.15)',
                                            borderRadius: 6,
                                            padding: 3,
                                            marginRight: 6
                                        }}>
                                            <Icon name="code" size={16} color="#fff" />
                                        </View>
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>View JSON Data</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </ScrollView>
                
            </View>

            {/* JSON View Modal */}
            <Modal visible={showJsonModal} animationType="slide" presentationStyle="pageSheet">
                <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
                    {/* Header */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 16,
                        backgroundColor: 'white',
                        borderBottomWidth: 1,
                        borderBottomColor: '#e5e7eb',
                        paddingTop: 50
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
                            Assessment JSON Data
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowJsonModal(false)}
                            style={{
                                backgroundColor: '#f3f4f6',
                                borderRadius: 20,
                                padding: 8
                            }}
                        >
                            <Icon name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* JSON Content */}
                    <ScrollView style={{ flex: 1, padding: 16 }}>
                        <View style={{
                            backgroundColor: '#1f2937',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 16
                        }}>
                            <Text style={{
                                color: '#10b981',
                                fontSize: 14,
                                fontFamily: 'monospace',
                                lineHeight: 20
                            }}>
                                {JSON.stringify({
                                    assessment_data: assessment,
                                    metadata: meta,
                                    local_id: id
                                }, null, 2)}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={{
                        padding: 16,
                        backgroundColor: 'white',
                        borderTopWidth: 1,
                        borderTopColor: '#e5e7eb',
                        flexDirection: 'row',
                        gap: 12
                    }}>
                        <TouchableOpacity
                            onPress={() => {
                                // Copy to clipboard functionality could be added here
                                Alert.alert('Info', 'JSON data displayed above. Copy functionality can be added if needed.');
                            }}
                            style={{
                                flex: 1,
                                backgroundColor: '#3b82f6',
                                paddingVertical: 12,
                                borderRadius: 8,
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center'
                            }}
                        >
                            <Icon name="content-copy" size={18} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={{ color: 'white', fontWeight: '600' }}>Copy JSON</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={() => setShowJsonModal(false)}
                            style={{
                                flex: 1,
                                backgroundColor: '#6b7280',
                                paddingVertical: 12,
                                borderRadius: 8,
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: '600' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </FormProvider>
    );
};

export default AssessmentDetail;