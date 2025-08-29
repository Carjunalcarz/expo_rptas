import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_COLOR, PRIMARY_COLOR_DARK } from '../constants/colors';
import { useFormContext } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';

const additionalItems = {
    percentageComponents: [
        { label: 'Carport', percentage: 0.3 },
        { label: 'Mezzanine', percentage: 0.6 },
        { label: 'Porch', percentage: 0.4 },
        { label: 'Balcony', percentage: 0.45 },
        { label: 'Terrace - Covered', percentage: 0.35 },
        { label: 'Terrace - Open', percentage: 0.35 },
        { label: 'Garage', percentage: 0.45 },
        { label: 'Deck Roof - Residential', percentage: 0.6 },
        { label: 'Deck Roof - Open', percentage: 0.3 },
        { label: 'Basement - Residential', percentage: 0.7 },
        { label: 'Basement - High Rise Building', percentage: 0.2 }
    ],
    excessHeights: [
        {
            label: 'Excess Height Residential and Commercial',
            rule: 'Add 20% of base unit value per meter in excess of 3 meters',
            perMeterAddition: 0.2
        },
        {
            label: 'Excess Height Bodega and Factory',
            rule: 'Add 5% of base unit value per meter in excess of 4.5 meters',
            perMeterAddition: 0.05
        }
    ],
    deductions: [
        {
            label: 'Deductions - Not Painted',
            rule: 'Deduct 10% if the building is not painted',
            deductPercentage: 0.1
        },
        {
            label: 'Deductions - Second Hand Materials',
            rule: 'Deduct 5% to 10% if second-hand materials are used',
            deductRange: 0.1
        }
    ],
    flooring: [
        { label: 'Flooring - Vinyl tiles and wood tiles', ratePerSqM: 157.0 },
        { label: 'Flooring - Crazy cut marble', ratePerSqM: 630.0 },
        { label: 'Flooring - Marble (depends on quality)', ratePerSqM: 787.0 }
    ],
    wallingAndPartitioning: [
        { label: 'Walling and Partitioning - Marble (affected area)', ratePerSqM: 473.0 },
        { label: 'Walling and Partitioning - Synthetic marble and other finish', ratePerSqM: 550.0 },
        { label: 'Walling and Partitioning - Wash out pebbles and other', ratePerSqM: 315.0 }
    ],
    septicTank: { label: 'Septic Tank', ratePerSqM: 1179.0 }
};

const formatPHP = (value: number) => {
    try {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
    } catch (e) {
        return `₱${Number(value).toFixed(2)}`;
    }
};

const flattenAdditionalItems = () => {
    const items: { group: string; label: string; value: any }[] = [];
    Object.entries(additionalItems).forEach(([group, value]) => {
        if (Array.isArray(value)) {
            (value as any[]).forEach((item) => items.push({ group, label: item.label, value: item }));
        } else if (typeof value === 'object' && value !== null) {
            items.push({ group, label: (value as any).label, value });
        }
    });
    return items;
};

const AdditionalItems: React.FC = () => {
    const { watch, setValue } = useFormContext<any>();
    const items = useMemo(() => flattenAdditionalItems(), []);

    const selectedLabel = watch('additionalItem');
    const selectedItem = items.find((it) => it.label === selectedLabel) || null;
    const unitValue = Number(watch('general_description.unit_value') || 0);

    const tableItems: any[] = watch('additionalItems.items') || [];
    const subTotal = watch('additionalItems.subTotal') || 0;

    const [nextId, setNextId] = useState(() => {
        const existing = tableItems || [];
        return existing.length > 0 ? Math.max(...existing.map((i) => i.id)) + 1 : 1;
    });

    useEffect(() => {
        const subtotal = (tableItems || []).reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0);
        const currentSub = Number(subTotal || 0);
        if (subtotal !== currentSub) {
            setValue('additionalItems.subTotal', subtotal);
            setValue('additionalItems.total', subtotal);
        }
    }, [tableItems, subTotal, setValue]);

    const calculateTotal = (item: any) => {
        const baseValue = Number(unitValue) || 0;
        if (item.value?.ratePerSqM) return item.quantity * Number(item.value.ratePerSqM);
        if (item.value?.percentage) return item.quantity * (Number(item.value.percentage) * baseValue);
        if (item.value?.perMeterAddition) return item.quantity * (Number(item.value.perMeterAddition) * baseValue);
        if (item.value?.deductPercentage) return item.quantity * -(baseValue * Number(item.value.deductPercentage));
        if (item.value?.deductRange) return item.quantity * -(baseValue * Number(item.value.deductRange));
        return 0;
    };

    const addTableItem = () => {
        if (!selectedItem) return;
        const newItem = {
            id: nextId,
            label: selectedItem.label,
            value: selectedItem.value,
            quantity: 1,
            amount: 0,
            description: ''
        };
        newItem.amount = calculateTotal(newItem);
        const updated = [...tableItems, newItem];
        setValue('additionalItems.items', updated);
        setNextId(nextId + 1);
    };

    const removeTableItem = (id: number) => {
        const updated = tableItems.filter((t) => t.id !== id);
        setValue('additionalItems.items', updated);
    };

    const updateTableItem = (id: number, field: string, value: any) => {
        const updated = tableItems.map((it: any) => {
            if (it.id === id) {
                const copy = { ...it, [field]: value };
                copy.amount = calculateTotal(copy);
                return copy;
            }
            return it;
        });
        setValue('additionalItems.items', updated);
    };

    useEffect(() => {
        if (!tableItems || tableItems.length === 0) return;
        const updated = tableItems.map((it: any) => {
            const copy = { ...it };
            copy.amount = calculateTotal(copy);
            return copy;
        });
        const changed = updated.some((u: any, i: number) => Number(u.amount) !== Number(tableItems[i]?.amount || 0));
        if (changed) {
            setValue('additionalItems.items', updated);
        }
    }, [unitValue, tableItems, setValue]);

    const renderValueRows = (item: any) => {
        return Object.entries(item.value).map(([key, val]) => {
            if (key === 'label') return null;
            if (key === 'percentageComponents') return null;
            const numericValue = Number(val);
            const isPercentage = key === 'percentage' || key === 'perMeterAddition' || key === 'deductPercentage' || key === 'deductRange';
            return (
                <View key={key} className="flex-row justify-between py-3 px-3 border-b border-gray-200">
                    <Text className="font-medium text-gray-800">{key}</Text>
                    <Text className="text-right flex-1 text-gray-700">
                        {Array.isArray(val)
                            ? (val as any[]).join(' - ')
                            : !isNaN(numericValue)
                                ? isPercentage
                                    ? `${(numericValue * 100).toFixed(0)}% (${formatPHP(numericValue * unitValue)})`
                                    : formatPHP(numericValue)
                                : String(val)}
                    </Text>
                </View>
            );
        });
    };

    return (
        <ScrollView className="flex-1 p-4 bg-gray-50">
            <View className="flex-row items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg border-l-4" style={{ borderLeftColor: PRIMARY_COLOR }}>
                <Text className="text-lg font-bold text-gray-800">ADDITIONAL ITEMS</Text>
                <Icon name="assessment" size={24} color="#2c3e50" />
            </View>
            <Text className="text-base font-medium mb-2 text-gray-700">Select Additional Item:</Text>
            <View className="border border-gray-300 rounded-md mb-4 bg-white">
                <Picker
                    selectedValue={selectedLabel || ''}
                    onValueChange={(itemValue: string) => setValue('additionalItem', itemValue)}
                    className="h-12"
                >
                    <Picker.Item label="-- Select an item --" value="" />
                    {items.map((it, idx) => (
                        <Picker.Item key={idx} label={`${it.label} (${it.group})`} value={it.label} />
                    ))}
                </Picker>
            </View>

            {selectedItem && (
                <View className="mb-5">
                    <View className="border border-gray-300 rounded-md mb-4 bg-white">
                        {renderValueRows(selectedItem)}
                    </View>
                    <TouchableOpacity
                        onPress={addTableItem}
                        className="py-3 rounded-md items-center"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                        <Text className="text-white font-semibold">Add to Table</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View className="bg-white rounded-lg overflow-hidden mb-6">
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View className="min-w-[1000px]">
                        {/* Table Header */}
                        <View className="flex-row" style={{ backgroundColor: PRIMARY_COLOR }}>
                            <View className="py-3 px-2 min-w-[220px] items-center justify-center">
                                <Text className="text-white font-semibold text-center">Item</Text>
                            </View>
                            <View className="py-3 px-2 min-w-[300px] items-center justify-center">
                                <Text className="text-white font-semibold text-center">Description</Text>
                            </View>
                            <View className="py-3 px-2 min-w-[80px] items-center justify-center">
                                <Text className="text-white font-semibold text-center">Qty</Text>
                            </View>
                            <View className="py-3 px-2 min-w-[140px] items-center justify-center">
                                <Text className="text-white font-semibold text-center">Rate</Text>
                            </View>
                            <View className="py-3 px-2 min-w-[140px] items-center justify-center">
                                <Text className="text-white font-semibold text-center">Total</Text>
                            </View>
                            <View className="py-3 px-2 min-w-[60px] items-center justify-center">
                                <Text className="text-white font-semibold text-center">Action</Text>
                            </View>
                        </View>

                        {/* Table Rows */}
                        {tableItems.length === 0 ? (
                            <View className="py-6 items-center justify-center">
                                <Text className="text-gray-500 italic">No Items Added</Text>
                            </View>
                        ) : (
                            tableItems.map((item: any) => (
                                <View key={item.id} className="flex-row">
                                    <View className="py-2 px-2 min-w-[220px] items-center justify-center" style={{ minWidth: 220 }}>
                                        <Text className="text-gray-800 text-sm">{item.label}</Text>
                                    </View>
                                    <View className="py-2 px-2 min-w-[300px] items-center justify-center" style={{ minWidth: 300 }}>
                                        <TextInput
                                            className="w-full p-1 text-sm text-gray-800 bg-white border border-gray-300 rounded min-h-[40px]"
                                            value={item.description}
                                            onChangeText={(text) => updateTableItem(item.id, 'description', text)}
                                            placeholder="Enter description"
                                            multiline
                                        />
                                    </View>
                                    <View className="py-2 px-2 min-w-[80px] items-center justify-center" style={{ minWidth: 80 }}>
                                        <TextInput
                                            className="w-full p-1 text-sm text-gray-800 bg-white border border-gray-300 rounded text-center"
                                            value={String(item.quantity)}
                                            onChangeText={(text) => updateTableItem(item.id, 'quantity', Number(text) || 0)}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View className="py-2 px-2 min-w-[140px] items-center justify-center" style={{ minWidth: 140 }}>
                                        <Text className="text-gray-800 text-sm text-center">
                                            {item.value.ratePerSqM
                                                ? formatPHP(item.value.ratePerSqM)
                                                : item.value.percentage
                                                    ? `${(item.value.percentage * 100).toFixed(0)}%`
                                                    : item.value.perMeterAddition
                                                        ? `${(item.value.perMeterAddition * 100).toFixed(0)}% per meter`
                                                        : item.value.deductPercentage
                                                            ? `-${(item.value.deductPercentage * 100).toFixed(0)}%`
                                                            : item.value.deductRange
                                                                ? `-${(item.value.deductRange * 100).toFixed(0)}%`
                                                                : 'N/A'}
                                        </Text>
                                    </View>
                                    <View className="py-2 px-2 min-w-[140px] items-center justify-center" style={{ minWidth: 140 }}>
                                        <Text className="text-gray-800 text-sm font-bold text-center">
                                            {formatPHP(item.amount)}
                                        </Text>
                                    </View>
                                    <View className="py-2 px-2 min-w-[60px] items-center justify-center" style={{ minWidth: 60 }}>
                                        <TouchableOpacity
                                            onPress={() => removeTableItem(item.id)}
                                            className="p-1"
                                        >
                                            <Icon name="close" size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}

                        {/* Subtotal Row */}
                        <View className="flex-row bg-gray-50">
                            <View className="py-2 px-2 min-w-[220px]" />
                            <View className="py-2 px-2 min-w-[300px]" />
                            <View className="py-2 px-2 min-w-[80px]" />
                            <View className="py-2 px-2 min-w-[90px]" />
                            <View className="py-2 px-2 min-w-[140px] items-center justify-center">
                                <Text className="text-gray-800 text-sm font-bold">
                                    Subtotal: {formatPHP(subTotal)}
                                </Text>
                            </View>
                            <View className="py-2 px-2 min-w-[100px]" />
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* Additional Items Summary */}
            <View className="bg-white p-4 rounded-lg border border-gray-200">
                <Text className="text-base font-semibold text-gray-800 mb-2">Additional Items Summary</Text>
                <View className="flex-row justify-between items-center py-2">
                    <Text className="text-sm text-gray-700">Items Added:</Text>
                    <Text className="text-sm font-semibold text-gray-800">{tableItems.length}</Text>
                </View>
                <View className="flex-row justify-between items-center py-2 border-t border-gray-100">
                    <Text className="text-sm text-gray-700">Subtotal:</Text>
                    <Text className="text-sm font-semibold text-gray-800">{formatPHP(subTotal)}</Text>
                </View>
            </View>
        </ScrollView>
    );
};

export default AdditionalItems;