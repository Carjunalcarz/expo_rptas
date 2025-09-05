import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal, ScrollView, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFormContext } from 'react-hook-form';
import images from '@/constants/images';
import { PRIMARY_COLOR } from '@/constants/colors';

type Props = { onMessage?: () => void; onCall?: () => void; onEdit?: () => void; onDelete?: () => void };

export default function OwnerCard({ onMessage, onCall, onEdit, onDelete }: Props) {
    const { watch } = useFormContext();
    const assessment = watch();
    const [showJson, setShowJson] = React.useState(false);
    const { width } = useWindowDimensions();
    const isSmall = width < 360;
    const labelFontSize = isSmall ? 11 : 12;
    const valueFontSize = isSmall ? 14 : 16;

    const ownerAvatar = assessment?.owner_details?.avatar;
    const ownerAvatarSource = typeof ownerAvatar === 'string' && ownerAvatar.length ? { uri: ownerAvatar } : images.avatar;
    const loc = assessment?.building_location || {};
    const addressParts = [loc?.barangay, loc?.municipality].filter(Boolean);
    const addressCascade = "Brgy. " + (addressParts.length ? addressParts.join('\n') : '—');

    return (
        <>
            <View style={{ marginHorizontal: 20, marginTop: -40, zIndex: 10, backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }}>
                {/* Header: Avatar + Name/Address */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={ownerAvatarSource} style={{ width: 64, height: 64, borderRadius: 32, marginRight: 16 }} />
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>{assessment?.owner_details?.owner || '—'}</Text>
                        <Text numberOfLines={4} style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 16 }}>{addressCascade}</Text>
                    </View>
                </View>

                {/* Actions: evenly spaced with labels */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <TouchableOpacity onPress={onMessage} style={{ padding: 12, borderRadius: 9999, backgroundColor: '#eff6ff' }}>
                            <Icon name="message" size={20} color="#4A90E2" />
                        </TouchableOpacity>
                        <Text style={{ marginTop: 6, fontSize: 12, color: '#374151' }}>Message</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <TouchableOpacity onPress={onCall} style={{ padding: 12, borderRadius: 9999, backgroundColor: '#eff6ff' }}>
                            <Icon name="call" size={20} color="#4A90E2" />
                        </TouchableOpacity>
                        <Text style={{ marginTop: 6, fontSize: 12, color: '#374151' }}>Call</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <TouchableOpacity onPress={onEdit} style={{ padding: 12, borderRadius: 9999, backgroundColor: '#eef2ff' }}>
                            <Icon name="edit" size={20} color="#6366f1" />
                        </TouchableOpacity>
                        <Text style={{ marginTop: 6, fontSize: 12, color: '#374151' }}>Edit</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <TouchableOpacity onPress={onDelete} style={{ padding: 12, borderRadius: 9999, backgroundColor: '#fee2e2' }}>
                            <Icon name="delete" size={20} color="#ef4444" />
                        </TouchableOpacity>
                        <Text style={{ marginTop: 6, fontSize: 12, color: '#374151' }}>Delete</Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: '#f3f4f6', marginVertical: 16 }} />

                {/* Stats */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: labelFontSize, color: '#6b7280' }}>Area</Text>
                        <Text
                            style={{ fontSize: valueFontSize, fontWeight: 'bold', color: '#111827', marginTop: 4, textAlign: 'center', width: '100%' }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.6}
                        >
                            {assessment?.general_description?.totalFloorArea || '0'} sq.m
                        </Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f3f4f6' }}>
                        <Text style={{ fontSize: labelFontSize, color: '#6b7280' }}>Ass. Value</Text>
                        <Text
                            style={{ fontSize: valueFontSize, fontWeight: 'bold', color: '#111827', marginTop: 4, textAlign: 'center', width: '100%' }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.6}
                        >
                            {typeof assessment?.property_assessment?.assessment_value !== 'undefined' && assessment?.property_assessment?.assessment_value !== null
                                ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(assessment.property_assessment.assessment_value) || 0)
                                : '-'}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: labelFontSize, color: '#6b7280' }}>Market Value</Text>
                        <Text
                            style={{ fontSize: valueFontSize, fontWeight: 'bold', color: '#111827', marginTop: 4, textAlign: 'center', width: '100%' }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.6}
                        >
                            {assessment?.property_assessment?.market_value ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(assessment.property_assessment.market_value) : '-'}
                        </Text>
                    </View>
                </View>

                {/* Floating JSON FAB (top-right of card) */}
                <TouchableOpacity
                    onPress={() => setShowJson(true)}
                    style={{ position: 'absolute', right: 12, top: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', zIndex: 20, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 }}
                    accessibilityRole="button"
                    accessibilityLabel="View JSON"
                >
                    <Icon name="code" size={20} color="#ffffff" />
                </TouchableOpacity>
            </View>

            {/* JSON Modal */}
            <Modal visible={showJson} transparent animationType="slide" onRequestClose={() => setShowJson(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 16, maxHeight: '85%', padding: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>Assessment JSON</Text>
                            <TouchableOpacity onPress={() => setShowJson(false)} style={{ padding: 8 }}>
                                <Icon name="close" size={22} color="#111827" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <Text style={{ fontSize: 12, color: '#111827' }}>
                                {JSON.stringify(assessment, null, 2)}
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
}
