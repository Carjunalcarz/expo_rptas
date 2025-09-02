import React from 'react';
import { View, ScrollView, Image, Text, TouchableOpacity, FlatList, Dimensions, Platform, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAssessmentById, deleteAssessment } from '@/lib/local-db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import images from '@/constants/images';
import icons from '@/constants/icons';
import Icon from 'react-native-vector-icons/MaterialIcons';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

const AssessmentDetail: React.FC = () => {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const [assessment, setAssessment] = React.useState<any | null>(null);
    const [meta, setMeta] = React.useState<any | null>(null);
    const [activeTab, setActiveTab] = React.useState('overview');

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            if (!id) return;
            const localId = Number(id);
            const row = await getAssessmentById(localId);
            if (mounted) {
                setAssessment(row?.data ?? null);
                setMeta(row ? { local_id: row.local_id, remote_id: row.remote_id ?? null, created_at: row.created_at, synced: !!row.synced } : null);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

    const headerImage = assessment?.general_description?.floorPlanImages?.[0] || assessment?.property_appraisal?.gallery?.[0]?.image || images.noResult;
    const headerImageSource = typeof headerImage === 'string' && headerImage.length ? { uri: headerImage } : headerImage;

    const gallery = assessment?.general_description?.floorPlanImages || [];

    const ownerAvatar = assessment?.owner_details?.avatar;
    const ownerAvatarSource = typeof ownerAvatar === 'string' && ownerAvatar.length ? { uri: ownerAvatar } : images.avatar;

    const formatPHP = (v: number) => {
        try {
            return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v);
        } catch (e) {
            return `₱${Number(v).toFixed(2)}`;
        }
    };

    const renderMaterials = (obj: any) => {
        if (!obj) return '-';
        const parts: string[] = [];
        for (const k of Object.keys(obj)) {
            if (typeof obj[k] === 'boolean' && obj[k]) parts.push(k);
            if (typeof obj[k] === 'string' && obj[k]) parts.push(`${k}: ${obj[k]}`);
        }
        return parts.length ? parts.join(', ') : '-';
    };

    const renderAppraisalTable = (app: any) => {
        if (!app) return <Text className="text-sm text-gray-700">No appraisal data</Text>;
        // normalize to rows
        const rows = Array.isArray(app) ? app : (app.description ? (Array.isArray(app.description) ? app.description : [app.description]) : []);
        return (
            <View className="mt-3">
                {rows.map((r: any, i: number) => (
                    <View key={i} className="py-3 border-b border-gray-100">
                        <Text className="text-sm font-rubik-medium text-gray-800">{(r && r.kindOfBuilding) ? `${r.structuralType || ''} ${r.kindOfBuilding || ''}`.trim() : 'Building'}</Text>
                        <View className="flex-row justify-between mt-2">
                            <Text className="text-xs text-gray-600">Area</Text>
                            <Text className="text-xs font-rubik-medium text-gray-800">{r.area || app.area || '-'}</Text>
                        </View>
                        <View className="flex-row justify-between mt-1">
                            <Text className="text-xs text-gray-600">Unit value</Text>
                            <Text className="text-xs font-rubik-medium text-gray-800">{r.unit_value || app.unit_value || '-'}</Text>
                        </View>
                        <View className="flex-row justify-between mt-1">
                            <Text className="text-xs text-gray-600">Base market value</Text>
                            <Text className="text-xs font-rubik-medium text-gray-800">{r.baseMarketValue || app.baseMarketValue || '-'}</Text>
                        </View>
                        <View className="flex-row justify-between mt-1">
                            <Text className="text-xs text-gray-600">Depreciation</Text>
                            <Text className="text-xs font-rubik-medium text-gray-800">{r.depreciation || app.depreciation || '-'}</Text>
                        </View>
                        <View className="flex-row justify-between mt-1">
                            <Text className="text-xs text-gray-600">Market value</Text>
                            <Text className="text-xs font-rubik-medium text-gray-800">{r.marketValue || app.marketValue || '-'}</Text>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

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
        // Prefill the add assessment form by saving to last_assessment then navigate
        try {
            const entry = { createdAt: meta?.created_at ?? new Date().toISOString(), data: assessment };
            await AsyncStorage.setItem('last_assessment', JSON.stringify(entry));
            router.push('/assessment/add_assessment');
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
            const confirmed = await new Promise((resolve) => {
                // Using window.Alert replacement via simple confirm pattern
                // but React Native Alert API used in other files; use it here
                const { Alert } = require('react-native');
                Alert.alert('Delete assessment', 'Are you sure you want to delete this assessment? This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
                ]);
            });
            if (!confirmed) return;
            await deleteAssessment(meta.local_id);
            // navigate back to list
            router.back();
        } catch (err) {
            console.warn('delete error', err);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <View>
                        <View className="mt-5">
                            <Text className="text-lg font-rubik-bold text-gray-800 mb-3">Property Details</Text>
                            <View className="bg-white rounded-xl p-4 shadow-sm">
                                <View className="flex-row justify-between py-2">
                                    <Text className="text-sm text-gray-600">Building Type</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{assessment?.general_description?.kindOfBuilding || '—'}</Text>
                                </View>
                                <View className="flex-row justify-between py-2 border-t border-gray-100">
                                    <Text className="text-sm text-gray-600">Structural Type</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{assessment?.property_assessment?.building_category || assessment?.general_description?.structuralType || '—'}</Text>
                                </View>
                                <View className="flex-row justify-between py-2 border-t border-gray-100">
                                    <Text className="text-sm text-gray-600">Total Floor Area</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{assessment?.general_description?.totalFloorArea || '0'} sq.m</Text>
                                </View>
                                <View className="flex-row justify-between py-2 border-t border-gray-100">
                                    <Text className="text-sm text-gray-600">Building Permit No.</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{assessment?.general_description?.buildingPermitNo || '—'}</Text>
                                </View>
                                <View className="flex-row justify-between py-2 border-t border-gray-100">
                                    <Text className="text-sm text-gray-600">CCT</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{assessment?.general_description?.condominiumCCT || '—'}</Text>
                                </View>
                            </View>
                        </View>

                        {gallery && gallery.length > 0 && (
                            <View className="mt-7">
                                <Text className="text-lg font-rubik-bold text-gray-800 mb-3">Gallery</Text>
                                <FlatList
                                    contentContainerStyle={{ paddingRight: 20 }}
                                    data={gallery}
                                    keyExtractor={(item, idx) => String(idx)}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    renderItem={({ item }) => {
                                        const itemSrc = typeof item === 'string' && item.length ? { uri: item } : images.noResult;
                                        return <Image source={itemSrc} className="w-40 h-32 rounded-xl mr-3" resizeMode="cover" />
                                    }}
                                />
                            </View>
                        )}

                        <View className="mt-7">
                            <Text className="text-lg font-rubik-bold text-gray-800 mb-3">Location</Text>
                            <View className="flex-row items-center bg-white rounded-xl p-4 shadow-sm">
                                <Icon name="location-on" size={20} color="#4A90E2" />
                                <Text className="text-sm text-gray-800 ml-2 flex-1">
                                    {assessment?.building_location ?
                                        `${assessment.building_location.street || ''}, ${assessment.building_location.barangay || ''}, ${assessment.building_location.municipality || ''}, ${assessment.building_location.province || ''}`
                                        : '—'
                                    }
                                </Text>
                            </View>
                            <Image source={images.map} className="h-40 w-full mt-3 rounded-xl" resizeMode="cover" />
                        </View>
                    </View>
                );

            case 'details':
                return (
                    <View>
                        {/* Land Reference */}
                        <View className="mt-5">
                            <Text className="text-lg font-rubik-bold text-gray-800 mb-3">Land Reference</Text>
                            <View className="bg-white rounded-xl p-4 shadow-sm">
                                <View className="flex-row justify-between py-2">
                                    <Text className="text-sm text-gray-600">Owner</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{assessment?.land_reference?.owner || '—'}</Text>
                                </View>
                                <View className="flex-row justify-between py-2 border-t border-gray-100">
                                    <Text className="text-sm text-gray-600">Title No.</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{assessment?.land_reference?.titleNumber || '—'}</Text>
                                </View>
                                <View className="flex-row justify-between py-2 border-t border-gray-100">
                                    <Text className="text-sm text-gray-600">Lot/Block</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{assessment?.land_reference?.lotNumber || '-'}/{assessment?.land_reference?.blockNumber || '-'}</Text>
                                </View>
                                <View className="flex-row justify-between py-2 border-t border-gray-100">
                                    <Text className="text-sm text-gray-600">Survey / TDN-ARP</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{assessment?.land_reference?.surveyNumber || '-'}/{assessment?.land_reference?.tdnArpNumber || '-'}</Text>
                                </View>
                                <View className="flex-row justify-between py-2 border-t border-gray-100">
                                    <Text className="text-sm text-gray-600">Area</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{assessment?.land_reference?.area || '0'} sq.m</Text>
                                </View>
                            </View>
                        </View>

                        {/* Structural Materials */}
                        <View className="mt-7">
                            <Text className="text-lg font-rubik-bold text-gray-800 mb-3">Structural Materials</Text>
                            <View className="bg-white rounded-xl p-4 shadow-sm">
                                <View className="flex-row justify-between py-2">
                                    <Text className="text-sm text-gray-600">Foundation</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{renderMaterials(assessment?.structural_materials?.foundation)}</Text>
                                </View>
                                <View className="flex-row justify-between py-2 border-t border-gray-100">
                                    <Text className="text-sm text-gray-600">Columns</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{renderMaterials(assessment?.structural_materials?.columns)}</Text>
                                </View>
                                <View className="flex-row justify-between py-2 border-t border-gray-100">
                                    <Text className="text-sm text-gray-600">Beams</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{renderMaterials(assessment?.structural_materials?.beams)}</Text>
                                </View>
                                <View className="flex-row justify-between py-2 border-t border-gray-100">
                                    <Text className="text-sm text-gray-600">Roof</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{renderMaterials(assessment?.structural_materials?.roof)}</Text>
                                </View>

                                <View className="mt-4">
                                    <Text className="text-sm font-rubik-medium text-gray-800 mb-2">Flooring</Text>
                                    {Array.isArray(assessment?.structural_materials?.flooring) && assessment.structural_materials.flooring.map((f: any, i: number) => (
                                        <View key={i} className="flex-row justify-between py-1">
                                            <Text className="text-xs text-gray-600">{f.floorName}</Text>
                                            <Text className="text-xs font-rubik-medium text-gray-800">{f.material || '-'}</Text>
                                        </View>
                                    ))}
                                </View>

                                <View className="mt-4">
                                    <Text className="text-sm font-rubik-medium text-gray-800 mb-2">Walls / Partitions</Text>
                                    {Array.isArray(assessment?.structural_materials?.wallsPartitions) && assessment.structural_materials.wallsPartitions.map((w: any, i: number) => (
                                        <View key={i} className="flex-row justify-between py-1">
                                            <Text className="text-xs text-gray-600">{w.wallName}</Text>
                                            <Text className="text-xs font-rubik-medium text-gray-800">{w.material || '-'}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                );

            case 'appraisal':
                return (
                    <View>
                        {/* Property Appraisal */}
                        <View className="mt-5">
                            <Text className="text-lg font-rubik-bold text-gray-800 mb-3">Property Appraisal</Text>
                            <View className="bg-white rounded-xl p-4 shadow-sm">
                                {renderAppraisalTable(assessment?.property_appraisal)}
                            </View>
                        </View>

                        {/* Additional Items */}
                        <View className="mt-7">
                            <Text className="text-lg font-rubik-bold text-gray-800 mb-3">Additional Items</Text>
                            <View className="bg-white rounded-xl p-4 shadow-sm">
                                {Array.isArray(assessment?.additionalItems?.items) && assessment.additionalItems.items.length > 0 ? (
                                    assessment.additionalItems.items.map((it: any, i: number) => (
                                        <View key={i} className="flex-row justify-between py-2 border-b border-gray-100">
                                            <Text className="text-sm text-gray-700">{it.name || `Item ${i + 1}`}</Text>
                                            <Text className="text-sm text-gray-700">{formatPHP(Number(it.amount) || 0)}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text className="text-sm text-gray-700 py-2">No additional items</Text>
                                )}
                                <View className="flex-row justify-between mt-3 pt-2 border-t border-gray-200">
                                    <Text className="text-sm font-rubik-medium text-gray-800">Subtotal</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800">{formatPHP(Number(assessment?.additionalItems?.subTotal) || 0)}</Text>
                                </View>
                                <View className="flex-row justify-between mt-2">
                                    <Text className="text-base font-rubik-bold text-gray-900">Total</Text>
                                    <Text className="text-base font-rubik-bold text-gray-900">{formatPHP(Number(assessment?.additionalItems?.total) || 0)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header with Image */}
            <View style={{ height: windowHeight / 3 }} className="relative w-full">
                <Image source={headerImageSource} className="size-full" resizeMode="cover" />
                <View className="absolute inset-0 bg-black/30" />

                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-14 left-5 z-50 bg-white/20 rounded-full p-2"
                    style={{ padding: 12 }}
                >
                    <Icon name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>

                {/* Header Content */}
                <View className="absolute bottom-0 left-0 right-0 p-5 pb-6">
                    <Text className="text-2xl font-rubik-bold text-white mb-1">{assessment?.owner_details?.owner || 'Assessment'}</Text>
                    <Text className="text-sm text-white/90 mb-3">
                        {assessment?.building_location ?
                            `${assessment.building_location.street || ''}${assessment.building_location.street ? ', ' : ''}${assessment.building_location.municipality || ''}`
                            : '—'
                        }
                    </Text>

                    <View className="flex-row flex-wrap gap-2">
                        <View className="bg-white/20 px-3 py-1 rounded-full">
                            <Text className="text-xs text-white">{assessment?.general_description?.kindOfBuilding || '—'}</Text>
                        </View>
                        <View className="bg-white/20 px-3 py-1 rounded-full">
                            <Text className="text-xs text-white">{assessment?.property_assessment?.building_category || assessment?.general_description?.structuralType || '—'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Main Content */}
            <View className="flex-1">
                {/* Owner Card */}
                <View className="mx-5 -mt-10 z-10 bg-white rounded-xl p-4 shadow-lg">
                    <View className="flex-row items-center">
                        <Image source={ownerAvatarSource} className="w-16 h-16 rounded-full mr-4" />
                        <View className="flex-1">
                            <Text className="text-lg font-rubik-bold text-gray-800">{assessment?.owner_details?.owner || '—'}</Text>
                            <Text className="text-sm text-gray-600 mt-1">{assessment?.owner_details?.address || '—'}</Text>
                        </View>
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={handleMessage}
                                className="p-3 rounded-full bg-blue-50"
                            >
                                <Icon name="message" size={20} color="#4A90E2" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCall}
                                className="p-3 rounded-full bg-blue-50"
                            >
                                <Icon name="call" size={20} color="#4A90E2" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="flex-row justify-between mt-4">
                        <View className="items-center flex-1">
                            <Text className="text-xs text-gray-500">Area</Text>
                            <Text className="text-base font-rubik-bold text-gray-800 mt-1">{assessment?.general_description?.totalFloorArea || '0'} sq.m</Text>
                        </View>
                        <View className="items-center flex-1 border-l border-r border-gray-100">
                            <Text className="text-xs text-gray-500">Tel</Text>
                            <Text className="text-base font-rubik-bold text-gray-800 mt-1">{assessment?.owner_details?.telNo || '—'}</Text>
                        </View>
                        <View className="items-center flex-1">
                            <Text className="text-xs text-gray-500">Market Value</Text>
                            <Text className="text-base font-rubik-bold text-gray-800 mt-1">
                                {assessment?.property_assessment?.market_value ? formatPHP(assessment.property_assessment.market_value) : '-'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tab Navigation */}
                <View className="flex-row mx-5 mt-6 border-b border-gray-200">
                    <TouchableOpacity
                        className={`flex-1 py-3 px-4 items-center ${activeTab === 'overview' ? 'border-b-2 border-blue-500' : ''}`}
                        onPress={() => setActiveTab('overview')}
                    >
                        <Text className={`font-rubik-medium ${activeTab === 'overview' ? 'text-blue-500' : 'text-gray-500'}`}>Overview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 px-4 items-center ${activeTab === 'details' ? 'border-b-2 border-blue-500' : ''}`}
                        onPress={() => setActiveTab('details')}
                    >
                        <Text className={`font-rubik-medium ${activeTab === 'details' ? 'text-blue-500' : 'text-gray-500'}`}>Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 px-4 items-center ${activeTab === 'appraisal' ? 'border-b-2 border-blue-500' : ''}`}
                        onPress={() => setActiveTab('appraisal')}
                    >
                        <Text className={`font-rubik-medium ${activeTab === 'appraisal' ? 'text-blue-500' : 'text-gray-500'}`}>Appraisal</Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                    className="mt-4"
                >
                    {renderContent()}

                    {/* Record metadata */}
                    <View className="mt-7 mb-10">
                        <Text className="text-lg font-rubik-bold text-gray-800 mb-3">Record Information</Text>
                        <View className="bg-white rounded-xl p-4 shadow-sm">
                            <View className="flex-row justify-between py-2">
                                <Text className="text-sm text-gray-600">Local ID</Text>
                                <Text className="text-sm font-rubik-medium text-gray-800">{meta?.local_id ?? '-'}</Text>
                            </View>
                            <View className="flex-row justify-between py-2 border-t border-gray-100">
                                <Text className="text-sm text-gray-600">Created At</Text>
                                <Text className="text-sm font-rubik-medium text-gray-800">{meta?.created_at ? new Date(meta.created_at).toLocaleString() : '-'}</Text>
                            </View>
                            <View className="flex-row justify-between py-2 border-t border-gray-100">
                                <Text className="text-sm text-gray-600">Synced</Text>
                                <Text className="text-sm font-rubik-medium text-gray-800">{meta?.synced ? 'Yes' : 'No'}</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* Fixed Bottom Action Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-white p-5 border-t border-gray-200">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-xs text-gray-600">Total Assessment</Text>
                        <Text className="text-xl font-rubik-bold text-blue-600">
                            {assessment?.property_assessment?.market_value ? formatPHP(assessment.property_assessment.market_value) : '-'}
                        </Text>
                    </View>
                    <TouchableOpacity className="bg-blue-500 py-3 px-6 rounded-full shadow-md flex-row items-center">
                        <Icon name="share" size={18} color="#FFF" style={{ marginRight: 8 }} />
                        <Text className="text-white font-rubik-bold">Share Report</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default AssessmentDetail;