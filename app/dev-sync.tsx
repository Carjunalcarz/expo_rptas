import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SyncManager } from '@/lib/sync-utils';
import { storageHealth, uploadSingleForDebug } from '@/lib/appwrite';

const DEFAULT_JSON = `{
  "street":"123 Main St",
  "barangay":"Soriano",
  "municipality":"Cabadbaran City",
  "province":"Agusan del Norte",
  "buildingImages":[
    "file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540ajncarz%252Frestate/ImagePicker/1bf6bbf7-9c06-49ea-91f1-8839dab08f5b.png",
    "file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540ajncarz%252Frestate/ImagePicker/df2d2e0a-1933-4a68-b9b8-65d4174435fc.jpeg",
    "file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540ajncarz%252Frestate/ImagePicker/a1ec8e29-9baf-49cd-b7dd-0137d3a9bde3.png"
  ]
}`;

export default function DevSync() {
    const [input, setInput] = React.useState(DEFAULT_JSON);
    const [output, setOutput] = React.useState('');
    const [progress, setProgress] = React.useState<string>('');
    const [busy, setBusy] = React.useState(false);
    const [health, setHealth] = React.useState<any | null>(null);

    const parseInput = () => {
        try { return JSON.parse(input); } catch { throw new Error('Invalid JSON'); }
    };

    const justConvertUrls = async () => {
        try {
            setBusy(true); setOutput(''); setProgress('');
            const data = parseInput();
            const local = Array.isArray(data?.buildingImages) ? data.buildingImages : [];
            const urls = await SyncManager.uploadImagesOnly(local);
            const result = { ...data, buildingImages: urls, syncedAt: new Date().toISOString() };
            setOutput(JSON.stringify(result, null, 2));
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to convert URLs');
        } finally { setBusy(false); }
    };

    const uploadAndCreate = async () => {
        try {
            setBusy(true); setOutput(''); setProgress('');
            const data = parseInput();
            const doc = await SyncManager.syncPropertyData(data, (p) => setProgress(p.message || p.stage));
            // Show minimal details and remind where to find images remotely
            setOutput(JSON.stringify({
                remoteId: doc?.$id,
                createdAt: doc?.$createdAt,
                note: 'Open this record in Remote Assessments to view normalized image URLs under building_location',
            }, null, 2));
        } catch (e: any) {
            Alert.alert('Sync failed', e?.message || 'Unexpected error');
        } finally { setBusy(false); }
    };

    const runHealthCheck = async () => {
        try {
            setBusy(true); setProgress('');
            const h = await storageHealth();
            setHealth(h);
            Alert.alert('Storage Health', JSON.stringify(h, null, 2));
        } catch (e: any) {
            Alert.alert('Health check failed', e?.message || 'Unexpected error');
        } finally { setBusy(false); }
    };

    const testSingleUpload = async () => {
        try {
            setBusy(true); setProgress('');
            const data = parseInput();
            const first = Array.isArray(data?.buildingImages) ? data.buildingImages[0] : undefined;
            if (!first) return Alert.alert('No image', 'Paste JSON with at least one image path');
            const res = await uploadSingleForDebug(String(first));
            Alert.alert('Single upload', JSON.stringify(res, null, 2));
        } catch (e: any) {
            Alert.alert('Test upload failed', e?.message || 'Unexpected error');
        } finally { setBusy(false); }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-5 py-4 border-b border-gray-100">
                <Text className="text-2xl font-rubik-bold text-gray-800">Dev: Offline → Online Sync</Text>
                {progress ? <Text className="text-xs text-gray-500 mt-1">{progress}</Text> : null}
            </View>
            <ScrollView className="flex-1 px-5">
                <Text className="text-sm text-gray-600 mt-4 mb-2">Paste JSON with file:// image paths</Text>
                <TextInput
                    value={input}
                    onChangeText={setInput}
                    multiline
                    numberOfLines={10}
                    className="border border-gray-300 rounded-lg p-3 text-xs"
                    style={{ fontFamily: 'monospace' as any }}
                />
                <View className="flex-row mt-4 flex-wrap">
                    <TouchableOpacity disabled={busy} onPress={justConvertUrls} className="bg-gray-800 rounded-lg px-4 py-3 mr-2">
                        {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-sm">Convert URLs only</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity disabled={busy} onPress={uploadAndCreate} className="bg-blue-600 rounded-lg px-4 py-3">
                        {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-sm">Upload & Save Remote</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity disabled={busy} onPress={runHealthCheck} className="bg-gray-200 rounded-lg px-4 py-3 ml-2">
                        {busy ? <ActivityIndicator /> : <Text className="text-gray-800 text-sm">Storage Health</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity disabled={busy} onPress={testSingleUpload} className="bg-gray-200 rounded-lg px-4 py-3 ml-2">
                        {busy ? <ActivityIndicator /> : <Text className="text-gray-800 text-sm">Test 1 Upload</Text>}
                    </TouchableOpacity>
                </View>
                <Text className="text-sm text-gray-600 mt-6 mb-2">Output</Text>
                <View className="border border-gray-200 rounded-lg p-3 mb-8 bg-gray-50">
                    <Text className="text-xs text-gray-800" selectable style={{ fontFamily: 'monospace' as any }}>
                        {output || '—'}
                    </Text>
                </View>
                {health ? (
                    <View className="border border-gray-200 rounded-lg p-3 mb-8 bg-gray-50">
                        <Text className="text-xs text-gray-500" selectable style={{ fontFamily: 'monospace' as any }}>
                            {JSON.stringify(health, null, 2)}
                        </Text>
                    </View>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
