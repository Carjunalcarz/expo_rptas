import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Modal, Dimensions, ScrollView, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFormContext } from 'react-hook-form';
import images from '@/constants/images';

function renderMaterialCheckboxList(obj?: Record<string, any>) {
    if (!obj) return <Text style={{ fontSize: 14, color: '#6b7280' }}>—</Text>;
    const keys = Object.keys(obj).filter(k => obj[k] === true);
    if (keys.length === 0) return <Text style={{ fontSize: 14, color: '#6b7280' }}>—</Text>;
    return (
        <View style={{ marginTop: 4 }}>
            {keys.map(key => (
                <View key={key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                    <Icon name="check-box" size={18} color="#4A90E2" />
                    <Text style={{ marginLeft: 8, fontSize: 14, color: '#374151' }}>{key}</Text>
                </View>
            ))}
        </View>
    );
}

function renderAppraisalTable(assessment: any) {
    const app = assessment?.property_appraisal;
    if (!app) return <Text style={{ fontSize: 14, color: '#374156' }}>No appraisal data</Text>;

    // Handle both property_appraisal structure and direct data
    const description = app.description || [];
    const buildingInfo = Array.isArray(description) && description.length > 0 ? description[0] : {};

    return (
        <View style={{ marginTop: 12 }}>
            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                    {buildingInfo.kindOfBuilding || buildingInfo.structuralType ? 
                        `${buildingInfo.structuralType || ''} ${buildingInfo.kindOfBuilding || ''}`.trim() : 
                        'Property Appraisal'}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Area</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>{app.area || '-'} sqm</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Unit Value</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                        {app.unit_value ? `₱${Number(app.unit_value).toLocaleString()}` : '-'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>BUCC</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>{app.bucc || '-'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Base Market Value</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                        {app.baseMarketValue ? `₱${Number(app.baseMarketValue).toLocaleString()}` : '-'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Depreciation</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                        {app.depreciation ? `${app.depreciation}%` : '-'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Depreciation Cost</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                        {app.depreciationCost ? `₱${Number(app.depreciationCost).toLocaleString()}` : '-'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Market Value</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                        {app.marketValue ? `₱${Number(app.marketValue).toLocaleString()}` : '-'}
                    </Text>
                </View>
            </View>
        </View>
    );
}

function renderAssessmentTable(assessment: any) {
    const assess = assessment?.property_assessment;
    if (!assess) return <Text style={{ fontSize: 14, color: '#374156' }}>No assessment data</Text>;

    const buildingCategories = {
        'residential': 'Residential Buildings',
        'commercial': 'Commercial and Industrial Buildings',
        'agricultural': 'Agricultural Buildings',
        'timberland': 'Timberland Buildings'
    };

    const quarters = {
        'QTR1': '1st Quarter',
        'QTR2': '2nd Quarter',
        'QTR3': '3rd Quarter',
        'QTR4': '4th Quarter'
    };

    return (
        <View style={{ marginTop: 12 }}>
            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>Property Assessment</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Building Category</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                        {buildingCategories[assess.building_category as keyof typeof buildingCategories] || assess.building_category || '-'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Market Value</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                        {assess.market_value ? `₱${Number(assess.market_value).toLocaleString()}` : '-'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Assessment Level</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                        {assess.assessment_level ? `${assess.assessment_level}%` : '-'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Assessment Value</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                        {assess.assessment_value ? `₱${Number(assess.assessment_value).toLocaleString()}` : '-'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Total Area</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                        {assess.total_area ? `${assess.total_area} sqm` : '-'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Taxable</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                        {assess.taxable === 1 || assess.taxable === '1' ? 'Yes' : 'No'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Effectivity</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>
                        {quarters[assess.eff_quarter as keyof typeof quarters] || assess.eff_quarter || '-'} {assess.eff_year || '-'}
                    </Text>
                </View>
            </View>
        </View>
    );
}

export default function Sections({ activeTab }: { activeTab: string }) {
    const { watch } = useFormContext();
    const assessment = watch();
    const windowWidth = Dimensions.get('window').width;

    // Collect ALL images with optional IDs (to use as keys and display)
    type GalleryItem = { uri: string; id?: string | number; key: string };
    const gallery: GalleryItem[] = React.useMemo(() => {
        const out: GalleryItem[] = [];
        const pushItem = (x: any, source: string, idx: number) => {
            if (!x) return;
            let uri: string | undefined;
            let id: string | number | undefined;
            if (typeof x === 'string') {
                uri = x;
            } else if (typeof x === 'object') {
                uri = x.uri || x.url || x.image || x.src;
                id = x.id || x.imageId || x._id || x.key || x.uid;
            }
            if (typeof uri === 'string' && uri) {
                const key = id ? String(id) : `${source}-${idx}-${uri}`;
                out.push({ uri, id, key });
            }
        };

        const loc = assessment?.building_location;
        if (Array.isArray(loc?.buildingImages)) loc.buildingImages.forEach((it: any, i: number) => pushItem(it, 'buildingImages', i));
        if (Array.isArray(loc?.images)) loc.images.forEach((it: any, i: number) => pushItem(it, 'locationImages', i));
        pushItem(loc?.image, 'locationImage', 0);

        const floor = assessment?.general_description?.floorPlanImages;
        if (Array.isArray(floor)) floor.forEach((it: any, i: number) => pushItem(it, 'floorPlan', i));

        const gal = assessment?.property_appraisal?.gallery;
        if (Array.isArray(gal)) gal.forEach((g: any, i: number) => pushItem(g, 'appraisalGallery', i));

        // Owner's valid ID images
        const owner = assessment?.owner_details;
        if (Array.isArray(owner?.validIdImages)) owner.validIdImages.forEach((it: any, i: number) => pushItem(it, 'validIdImages', i));
        // Administrator/Beneficiary valid ID images
        const adminBen = owner?.administratorBeneficiary;
        if (Array.isArray(adminBen?.validIdImages)) adminBen.validIdImages.forEach((it: any, i: number) => pushItem(it, 'adminBeneficiaryValidIdImages', i));

        // de-dupe by key or uri
        const seen = new Set<string>();
        const unique: GalleryItem[] = [];
        for (const item of out) {
            const sig = item.id ? `id:${item.id}` : `uri:${item.uri}`;
            if (!seen.has(sig)) { seen.add(sig); unique.push(item); }
        }
        return unique;
    }, [assessment]);

    const [isGalleryVisible, setGalleryVisible] = React.useState(false);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const openGallery = (idx: number) => { setSelectedIndex(idx); setGalleryVisible(true); };
    const closeGallery = () => setGalleryVisible(false);

    return (
        <View>
            {activeTab === 'overview' && (
                <View>
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 }}>Property Details</Text>
                        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>Building Type</Text>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{assessment?.general_description?.kindOfBuilding || '—'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>Structural Type</Text>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{assessment?.property_assessment?.building_category || assessment?.general_description?.structuralType || '—'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>Total Floor Area</Text>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{assessment?.general_description?.totalFloorArea || '0'} sq.m</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>Building Permit No.</Text>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{assessment?.general_description?.buildingPermitNo || '—'}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>CCT</Text>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{assessment?.general_description?.condominiumCCT || '—'}</Text>
                            </View>
                        </View>
                    </View>

                    {gallery && gallery.length > 0 && (
                        <View style={{ marginTop: 28 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 }}>Gallery</Text>
                            <FlatList
                                contentContainerStyle={{ paddingRight: 20 }}
                                data={gallery}
                                keyExtractor={(item) => String(item.id ?? item.key)}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                renderItem={({ item, index }) => {
                                    const itemSrc = item?.uri ? { uri: item.uri } : images.noResult;
                                    return (
                                        <TouchableOpacity onPress={() => openGallery(index)}>
                                            <Image source={itemSrc} style={{ width: 160, height: 128, borderRadius: 12, marginRight: 12 }} resizeMode="cover" />
                                        </TouchableOpacity>
                                    );
                                }}
                            />

                            {/* Fullscreen Modal Gallery */}
                            <Modal visible={isGalleryVisible} animationType="slide" transparent={false} onRequestClose={closeGallery}>
                                <View style={{ flex: 1, backgroundColor: '#000' }}>
                                    <View style={{ position: 'absolute', top: 40, right: 16, zIndex: 20 }}>
                                        <TouchableOpacity onPress={closeGallery} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 }}>
                                            <Icon name="close" size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView
                                        horizontal
                                        pagingEnabled
                                        showsHorizontalScrollIndicator={false}
                                        contentOffset={{ x: selectedIndex * windowWidth, y: 0 }}
                                    >
                                        {gallery.map((gi, i) => (
                                            <View key={(gi.id ?? gi.key) + '-' + i} style={{ width: windowWidth, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                                <Image source={{ uri: gi.uri }} style={{ width: windowWidth, height: windowWidth * 0.75, resizeMode: 'contain' }} />
                                                {gi.id !== undefined && (
                                                    <View style={{ position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' }}>
                                                        <Text style={{ color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                                                            ID: {String(gi.id)} ({i + 1}/{gallery.length})
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            </Modal>
                        </View>
                    )}

                    <View style={{ marginTop: 28 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 }}>Location</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                            <Icon name="location-on" size={20} color="#4A90E2" />
                            <Text style={{ fontSize: 14, color: '#374151', marginLeft: 8, flex: 1 }}>
                                {assessment?.building_location ? `${assessment.building_location.street || ''}, ${assessment.building_location.barangay || ''}, ${assessment.building_location.municipality || ''}, ${assessment.building_location.province || ''}` : '—'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${assessment?.building_location?.latitude},${assessment?.building_location?.longitude}`)}>
                            <Image source={images.map} style={{ height: 160, width: '100%', marginTop: 12, borderRadius: 12 }} resizeMode="cover" />
                        </TouchableOpacity>

                    </View>
                </View>
            )}

            {activeTab === 'details' && (
                <View>
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 }}>Land Reference</Text>
                        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                            {/* Owner */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>Owner</Text>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{assessment?.land_reference?.owner || '—'}</Text>
                            </View>
                            {/* Title */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>Title No.</Text>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{assessment?.land_reference?.titleNumber || '—'}</Text>
                            </View>
                            {/* Lot/Block */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>Lot/Block</Text>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{assessment?.land_reference?.lotNumber || '-'}/{assessment?.land_reference?.blockNumber || '-'}</Text>
                            </View>
                            {/* Survey / TDN-ARP */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>Survey / TDN-ARP</Text>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{assessment?.land_reference?.surveyNumber || '-'}/{assessment?.land_reference?.tdnArpNumber || '-'}</Text>
                            </View>
                            {/* Area */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                                <Text style={{ fontSize: 14, color: '#6b7280' }}>Area</Text>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{assessment?.land_reference?.area || '0'} sq.m</Text>
                            </View>
                        </View>
                    </View>

                    {/* Structural Materials */}
                    <View style={{ marginTop: 28 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 }}>Structural Materials</Text>
                        <View style={{ flexDirection: 'column', gap: 16 }}>
                            {(['Foundation', 'Columns', 'Beams', 'Roof'] as const).map(cat => (
                                <View key={cat} style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>{cat}</Text>
                                    {renderMaterialCheckboxList(assessment?.structural_materials?.[cat.toLowerCase()])}
                                </View>
                            ))}
                            {Array.isArray(assessment?.structural_materials?.flooring) && (
                                <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Flooring</Text>
                                    {assessment.structural_materials.flooring.map((f: any, i: number) => (
                                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                                            <Text style={{ fontSize: 12, color: '#6b7280' }}>{f.floorName}</Text>
                                            <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>{f.material || '-'}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {Array.isArray(assessment?.structural_materials?.wallsPartitions) && (
                                <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>Walls / Partitions</Text>
                                    {assessment.structural_materials.wallsPartitions.map((w: any, i: number) => (
                                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                                            <Text style={{ fontSize: 12, color: '#6b7280' }}>{w.wallName}</Text>
                                            <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151' }}>{w.material || '-'}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            )}

            {activeTab === 'appraisal' && (
                <View>
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 }}>Property Appraisal</Text>
                        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                            {renderAppraisalTable(assessment)}
                        </View>
                    </View>

                    <View style={{ marginTop: 28 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 }}>Additional Items</Text>
                        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                            {Array.isArray(assessment?.additionalItems?.items) && assessment.additionalItems.items.length > 0 ? (
                                assessment.additionalItems.items.map((it: any, i: number) => (
                                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                                        <Text style={{ fontSize: 14, color: '#374156' }}>{it.label + (it.quantity > 1 ? ` (${it.quantity})` : '') || `Item ${i + 1}`}</Text>
                                        <Text style={{ fontSize: 14, color: '#374156' }}>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(it.amount) || 0)}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ fontSize: 14, color: '#374156', paddingVertical: 8 }}>No additional items</Text>
                            )}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>Subtotal</Text>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(assessment?.additionalItems?.subTotal) || 0)}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>Total</Text>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(assessment?.additionalItems?.total) || 0)}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ marginTop: 28 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 }}>Property Assessment</Text>
                        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                            {renderAssessmentTable(assessment)}
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}
