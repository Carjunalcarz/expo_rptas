import React from 'react';
import { View, Image, Text, TouchableOpacity, Dimensions, ScrollView, ImageSourcePropType } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFormContext } from 'react-hook-form';
import images from '@/constants/images';

type Props = { onBack?: () => void };

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

export default function HeaderHero({ onBack }: Props) {
    const { watch } = useFormContext();
    const assessment = watch();

    // Collect images: prefer building_location images, then floorPlanImages, then property_appraisal gallery
    const imageUris: string[] = React.useMemo(() => {
        const out: string[] = [];
        const pushUri = (x: any) => {
            if (!x) return;
            if (typeof x === 'string') { if (x) out.push(x); return; }
            if (typeof x === 'object') {
                const cand = x.uri || x.url || x.image || x.src;
                if (typeof cand === 'string' && cand) out.push(cand);
            }
        };

        const loc = assessment?.building_location;
        // Highest priority: building location images collected in the form
        const buildingImages = Array.isArray(loc?.buildingImages) ? loc?.buildingImages : [];
        for (const it of buildingImages) pushUri(it);
        // building_location.images array
        if (Array.isArray(loc?.images)) for (const it of loc.images) pushUri(it);
        // building_location.image single
        pushUri(loc?.image);

        // de-dupe
        return Array.from(new Set(out));
    }, [assessment]);

    const sources: Array<{ key: string; source: ImageSourcePropType }> = React.useMemo(() => {
        if (imageUris.length === 0) return [{ key: 'placeholder', source: images.noResult }];
        return imageUris.map((uri) => ({ key: uri, source: { uri } }));
    }, [imageUris]);

    const [index, setIndex] = React.useState(0);

    const onScroll = React.useCallback((e: any) => {
        const x = e?.nativeEvent?.contentOffset?.x || 0;
        const width = e?.nativeEvent?.layoutMeasurement?.width || windowWidth;
        const i = Math.round(x / width);
        if (i !== index) setIndex(i);
    }, [index]);

    return (
        <View style={{ height: windowHeight / 3 }}>
            {sources.length > 1 ? (
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                >
                    {sources.map((img, i) => (
                        <Image key={img.key} source={img.source} style={{ width: windowWidth, height: '100%' }} resizeMode="cover" />
                    ))}
                </ScrollView>
            ) : (
                <Image source={sources[0].source} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            )}

            {/* overlay - allow touches to pass through for swipe */}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' }} />

            {/* back */}
            <TouchableOpacity
                onPress={onBack}
                style={{ position: 'absolute', top: 56, left: 20, zIndex: 50, backgroundColor: 'rgba(255,255,255,0.24)', borderRadius: 9999, padding: 12 }}
            >
                <Icon name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* dots */}
            {sources.length > 1 && (
                <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' }}>
                    {sources.map((_, i) => (
                        <View
                            key={`dot-${i}`}
                            style={{ width: 8, height: 8, borderRadius: 4, marginHorizontal: 4, backgroundColor: i === index ? 'white' : 'rgba(255,255,255,0.5)' }}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}
