import React from 'react';
import { Modal, View, FlatList, Image, TouchableOpacity, Text, Dimensions, StyleSheet, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import images from '@/constants/images';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

type ImageSource = string | { uri?: string } | any;

interface Props {
    visible: boolean;
    images: ImageSource[];
    initialIndex?: number;
    onRequestClose: () => void;
}

export default function GalleryModal({ visible, images, initialIndex = 0, onRequestClose }: Props) {
    const listRef = React.useRef<FlatList>(null);
    const [index, setIndex] = React.useState(initialIndex);

    React.useEffect(() => {
        setIndex(initialIndex);
        if (visible && listRef.current) {
            // wait a tick for modal to layout
            setTimeout(() => {
                try {
                    listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
                } catch (e) {
                    // ignore
                }
            }, 50);
        }
    }, [visible, initialIndex]);

    const normalize = (it: ImageSource) => {
        if (!it) return undefined;
        // handle require(...) which is a numeric id
        if (typeof it === 'number') return it;
        if (typeof it === 'string') return { uri: it };
        if (it && typeof it === 'object') {
            // common shapes
            if (it.uri) return { uri: it.uri };
            if (it.url) return { uri: it.url };
            if (it.image) {
                if (typeof it.image === 'string') return { uri: it.image };
                if (it.image.uri) return { uri: it.image.uri };
                if (it.image.url) return { uri: it.image.url };
            }
            if (it.file && (it.file.url || it.file.uri)) return { uri: it.file.url || it.file.uri };
            if (it.path) return { uri: it.path };
            if (it.src) return { uri: it.src };
            if (it.data && typeof it.data === 'string' && it.data.startsWith('data:')) return { uri: it.data };
        }
        return undefined;
    };

    const renderItem = ({ item }: { item: ImageSource }) => {
        const src = normalize(item) || (images as any).noResult;
        return (
            <View style={{ width: windowWidth, height: windowHeight, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={src} style={styles.image} resizeMode="contain" />
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onRequestClose}>
            <StatusBar hidden />
            <View style={styles.container}>
                <FlatList
                    ref={listRef}
                    horizontal
                    pagingEnabled
                    data={images}
                    keyExtractor={(_, i) => String(i)}
                    initialScrollIndex={initialIndex}
                    renderItem={renderItem}
                    onMomentumScrollEnd={(ev) => {
                        const ix = Math.round(ev.nativeEvent.contentOffset.x / windowWidth);
                        setIndex(ix);
                    }}
                />

                <View style={styles.topRow} pointerEvents="box-none">
                    <TouchableOpacity style={styles.closeBtn} onPress={onRequestClose} accessibilityLabel="Close gallery">
                        <Icon name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.counter}><Text style={styles.counterText}>{index + 1} / {Math.max(1, images.length)}</Text></View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    image: { width: windowWidth, height: windowHeight, flex: 1 },
    topRow: { position: 'absolute', top: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, alignItems: 'center' },
    closeBtn: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 24 },
    counter: { alignSelf: 'center' },
    counterText: { color: '#fff', fontWeight: '600' },
});
