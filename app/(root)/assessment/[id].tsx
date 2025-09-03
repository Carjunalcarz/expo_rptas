import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, Dimensions, Linking, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import images from '@/constants/images';
import { getAssessmentById, deleteAssessment, getAllAssessments } from '@/lib/local-db';
import { getRouter } from '@/lib/router';
import { FormProvider, useForm } from 'react-hook-form';
import HeaderHero from './components/HeaderHero';
import OwnerCard from './components/OwnerCard';
import Tabs from './components/Tabs';
import Sections from './components/Sections';


const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

const AssessmentDetail: React.FC = () => {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const [assessment, setAssessment] = React.useState<any | null>(null);
    const [meta, setMeta] = React.useState<any | null>(null);
    const [activeTab, setActiveTab] = React.useState('overview');
    const [loading, setLoading] = React.useState(true);
    const [notFound, setNotFound] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (!id) { setNotFound(true); return; }
                let row = null as any;
                const numericId = Number(id);
                if (!Number.isNaN(numericId)) {
                    row = await getAssessmentById(numericId);
                }
                // Fallback: when id is a createdAt string (from AsyncStorage list injection)
                if (!row) {
                    const list = await getAllAssessments();
                    row = list.find((r: any) => String(r.local_id) === String(id) || String(r.created_at) === String(id)) ?? null;
                }
                if (mounted) {
                    if (!row) {
                        setNotFound(true);
                        setAssessment(null);
                        setMeta(null);
                    } else {
                        setAssessment(row.data ?? null);
                        setMeta({ local_id: row.local_id, remote_id: row.remote_id ?? null, created_at: row.created_at, synced: !!row.synced });
                    }
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

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
            const entry = { createdAt: meta?.created_at ?? new Date().toISOString(), data: assessment, local_id: meta?.local_id } as any;
            await AsyncStorage.setItem('last_assessment', JSON.stringify(entry));
            const router = getRouter();
            if (router) router.push({ pathname: '/assessment/edit/[id]', params: { id: String(meta?.local_id ?? '') } });
        } catch (err) {
            console.warn('handleEdit failed', err);
        }
    };

    const handleDeleteRecord = async () => {
        try {
            if (!meta?.local_id) {
                console.warn('no local id to delete');
                return;
            }
            // confirmation
            Alert.alert('Delete assessment', 'Are you sure you want to delete this assessment? This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        await deleteAssessment(meta.local_id);
                        getRouter()?.back();
                    }
                },
            ]);
        } catch (err) {
            console.warn('delete error', err);
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
                </ScrollView>

                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={{ fontSize: 12, color: '#6b7280' }}>Total Assessment</Text>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2563eb' }}>
                                {assessment?.property_assessment?.market_value ? formatPHP(assessment.property_assessment.assessment_value) : '-'}
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

export default AssessmentDetail;