import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type Props = { value: string; onChange: (v: string) => void };

export default function Tabs({ value, onChange }: Props) {
    return (
        <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 24, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            {[
                { key: 'overview', label: 'Overview' },
                { key: 'details', label: 'Details' },
                { key: 'appraisal', label: 'Appraisal' },
            ].map(t => (
                <TouchableOpacity
                    key={t.key}
                    style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', borderBottomWidth: value === t.key ? 2 : 0, borderBottomColor: '#3b82f6' }}
                    onPress={() => onChange(t.key)}
                >
                    <Text style={{ fontWeight: '500', color: value === t.key ? '#3b82f6' : '#6b7280' }}>{t.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}
