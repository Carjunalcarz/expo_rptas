import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAssessmentDocument, deleteAssessmentDocument } from '@/lib/appwrite';
import { getRouter } from '@/lib/router';
import { FormProvider, useForm } from 'react-hook-form';
import HeaderHero from '../components/HeaderHero';
import OwnerCard from '../components/OwnerCard';
import Tabs from '../components/Tabs';
import Sections from '../components/Sections';
import { navigateToEditRemoteAssessment } from '@/lib/navigation';

const RemoteAssessmentDetail: React.FC = () => {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [doc, setDoc] = React.useState<any | null>(null);
    const [activeTab, setActiveTab] = React.useState('overview');
    const [loading, setLoading] = React.useState(true);
    const [notFound, setNotFound] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (!id) { setNotFound(true); return; }
                const d = await getAssessmentDocument(String(id));
                if (mounted) setDoc(d);
            } catch (e) {
                if (mounted) setNotFound(true);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

    const parseObj = (s: any) => { try { return JSON.parse(s || '{}'); } catch { return {}; } };
    const assessment = React.useMemo(() => ({
        owner_details: parseObj(doc?.owner_details),
        building_location: parseObj(doc?.building_location),
        land_reference: parseObj(doc?.land_reference),
        general_description: parseObj(doc?.general_description),
        structural_materials: parseObj(doc?.structural_materials),
        property_appraisal: parseObj(doc?.property_appraisal),
        property_assessment: parseObj(doc?.property_assessment),
        additionalItems: parseObj(doc?.additionalItems),
    }), [doc]);

    const methods = useForm({ defaultValues: assessment, values: assessment });
    React.useEffect(() => { methods.reset(assessment as any); }, [assessment]);

    const formatPHP = (v: number) => {
        try { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v); } catch { return `₱${Number(v).toFixed(2)}`; }
    };

    const handleCall = () => {
        const tel = (assessment as any)?.owner_details?.telNo;
        if (tel) {
            try { require('expo-linking').openURL(`tel:${tel}`); } catch { }
        }
    };
    const handleMessage = () => { /* placeholder */ };
    const handleEdit = () => { if (id) navigateToEditRemoteAssessment(String(id)); };
    const handleDeleteRecord = async () => {
        Alert.alert('Delete assessment', 'This will remove the remote document. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteAssessmentDocument(String(id)); getRouter()?.back(); } catch (e: any) { Alert.alert('Error', e?.message || 'Failed to delete'); } } }
        ]);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }
    if (notFound || !doc) {
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
                                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Remote ID</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{doc?.$id ?? '-'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Created At</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{doc?.$createdAt ? new Date(doc.$createdAt).toLocaleString() : '-'}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Updated At</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{doc?.$updatedAt ? new Date(doc.$updatedAt).toLocaleString() : '-'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>Total Assessment</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563eb' }}>
                                {Number((assessment as any)?.property_assessment?.assessment_value || 0) > 0
                                    ? formatPHP(Number((assessment as any)?.property_assessment?.assessment_value || 0))
                                    : '-'}
                            </Text>
                        </View>
                        <TouchableOpacity style={{ backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, flexDirection: 'row', alignItems: 'center' }}>
                            <Icon name="share" size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Pay Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </FormProvider>
    );
};

export default RemoteAssessmentDetail;
