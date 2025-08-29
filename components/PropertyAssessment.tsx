import React, { useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    Switch,
    TouchableOpacity,
    Dimensions,
    TextInput
} from 'react-native';
import { PRIMARY_COLOR } from '../constants/colors';
import { Picker } from '@react-native-picker/picker';
import { useFormContext } from 'react-hook-form';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const formatPHP = (value: number) => {
    try {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
    } catch (e) {
        return `₱${Number(value).toFixed(2)}`;
    }
};

function getAssessmentLevel(
    typeKey: string | null,
    marketValue: number,
    assessmentLevels: Record<string, { min: number; max: number | null; assessmentLevel: number }[]>
) {
    if (!typeKey || !marketValue) return null;
    const levels = assessmentLevels[typeKey];
    if (!levels) return null;
    for (const level of levels) {
        if (marketValue >= level.min && (level.max === null || marketValue < level.max)) {
            return level.assessmentLevel;
        }
    }
    return null;
}

const assessmentLevels = {
    ResidentialBuildingsAndOtherStructures: [
        { min: 0, max: 175000, assessmentLevel: 0 },
        { min: 175000, max: 300000, assessmentLevel: 10 },
        { min: 300000, max: 500000, assessmentLevel: 20 },
        { min: 500000, max: 750000, assessmentLevel: 25 },
        { min: 750000, max: 1000000, assessmentLevel: 30 },
        { min: 1000000, max: 2000000, assessmentLevel: 35 },
        { min: 2000000, max: 5000000, assessmentLevel: 40 },
        { min: 5000000, max: 10000000, assessmentLevel: 50 },
        { min: 10000000, max: null, assessmentLevel: 60 }
    ],
    CommercialAndIndustrialBuildingsOrStructures: [
        { min: 0, max: 300000, assessmentLevel: 30 },
        { min: 300000, max: 500000, assessmentLevel: 35 },
        { min: 500000, max: 750000, assessmentLevel: 40 },
        { min: 750000, max: 1000000, assessmentLevel: 50 },
        { min: 1000000, max: 2000000, assessmentLevel: 60 },
        { min: 2000000, max: 5000000, assessmentLevel: 70 },
        { min: 5000000, max: 10000000, assessmentLevel: 75 },
        { min: 10000000, max: null, assessmentLevel: 80 }
    ],
    AgriculturalBuildingsAndOtherStructures: [
        { min: 0, max: 300000, assessmentLevel: 25 },
        { min: 300000, max: 500000, assessmentLevel: 30 },
        { min: 500000, max: 750000, assessmentLevel: 35 },
        { min: 750000, max: 1000000, assessmentLevel: 40 },
        { min: 1000000, max: 2000000, assessmentLevel: 45 },
        { min: 2000000, max: null, assessmentLevel: 50 }
    ],
    TimberlandBuildingsAndOtherStructures: [
        { min: 0, max: 300000, assessmentLevel: 45 },
        { min: 300000, max: 500000, assessmentLevel: 50 },
        { min: 500000, max: 750000, assessmentLevel: 55 },
        { min: 750000, max: 1000000, assessmentLevel: 60 },
        { min: 1000000, max: 2000000, assessmentLevel: 65 },
        { min: 2000000, max: null, assessmentLevel: 70 }
    ]
};

const buildingCategories = [
    { id: 'residential', name: 'Residential Buildings' },
    { id: 'commercial', name: 'Commercial and Industrial Buildings' },
    { id: 'agricultural', name: 'Agricultural Buildings' },
    { id: 'timberland', name: 'Timberland Buildings' }
];

const quarters = [
    { value: 'QTR1', label: '1st Quarter' },
    { value: 'QTR2', label: '2nd Quarter' },
    { value: 'QTR3', label: '3rd Quarter' },
    { value: 'QTR4', label: '4th Quarter' }
];

const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [] as { id: string; name: string }[];
    for (let i = currentYear + 10; i >= 1900; i--) {
        years.push({ id: i.toString(), name: i.toString() });
    }
    return years;
};

const PropertyAssessment: React.FC = () => {
    const { watch, setValue } = useFormContext<any>();

    // Read property_appraisal and compute total market value
    const propertyAppraisal = watch('property_appraisal');
    const additionalItems = Number(watch('additionalItems.subTotal')) || 0;

    let totalMarketValue = 0;
    if (Array.isArray(propertyAppraisal)) {
        totalMarketValue = propertyAppraisal.reduce((s: number, it: any) => s + (Number(it.marketValue) || 0), 0);
    } else if (propertyAppraisal && typeof propertyAppraisal === 'object') {
        // if single object with marketValue
        if (propertyAppraisal.marketValue) totalMarketValue = Number(propertyAppraisal.marketValue) || 0;
        else if (Array.isArray(propertyAppraisal.description)) {
            // nothing
        }
    }
    const AssessmentTotalMarketValue = totalMarketValue + additionalItems;

    // total area from general description or property_appraisal
    const totalFloorArea = Number(watch('general_description.totalFloorArea')) || 0;
    const paTotalArea = Array.isArray(propertyAppraisal)
        ? propertyAppraisal.reduce((s: number, it: any) => s + (Number(it.area) || 0), 0)
        : Number(propertyAppraisal?.area) || 0;
    const totalArea = paTotalArea || totalFloorArea;

    const buildingCategory = watch('property_assessment.building_category') || watch('buildingCategory') || '';
    const assessmentLevel = Number(watch('property_assessment.assessment_level')) || 0;
    const assessmentValue = Number(watch('property_assessment.assessment_value')) || 0;
    const propertyAssessment = watch('property_assessment') || {};
    const currentQuarter = propertyAssessment.eff_quarter || 'QTR1';
    const currentYear = propertyAssessment.eff_year || new Date().getFullYear().toString();
    const currentTaxable = propertyAssessment.taxable ?? 1;

    useEffect(() => {
        // initialize propertyAssessment if missing
        if (!propertyAssessment || Object.keys(propertyAssessment).length === 0) {
            const initialItem = {
                id: 1,
                market_value: AssessmentTotalMarketValue,
                building_category: buildingCategory || '',
                assessment_level: assessmentLevel?.toString() || '',
                assessment_value: assessmentValue,
                taxable: 1,
                eff_year: currentYear,
                eff_quarter: currentQuarter,
                total_area: totalArea
            };
            setValue('property_assessment', initialItem);
        }
        // update when dependent values change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setValue('property_assessment', {
            ...propertyAssessment,
            assessment_level: assessmentLevel?.toString() || '',
            assessment_value: assessmentValue,
            total_area: totalArea,
            market_value: AssessmentTotalMarketValue,
            building_category: buildingCategory || propertyAssessment.building_category
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assessmentLevel, assessmentValue, totalArea, AssessmentTotalMarketValue, buildingCategory]);

    useEffect(() => {
        // compute assessment level from buildingCategory and totalMarketValue
        let typeKey = '';
        switch (buildingCategory) {
            case 'residential':
                typeKey = 'ResidentialBuildingsAndOtherStructures';
                break;
            case 'commercial':
                typeKey = 'CommercialAndIndustrialBuildingsOrStructures';
                break;
            case 'agricultural':
                typeKey = 'AgriculturalBuildingsAndOtherStructures';
                break;
            case 'timberland':
                typeKey = 'TimberlandBuildingsAndOtherStructures';
                break;
            default:
                typeKey = '';
        }
        if (typeKey && AssessmentTotalMarketValue > 0) {
            const level = getAssessmentLevel(typeKey, AssessmentTotalMarketValue, assessmentLevels as any);
            if (level !== null) {
                setValue('property_assessment.assessment_level', level.toString());
                setValue('property_assessment.assessment_value', (AssessmentTotalMarketValue * level) / 100);
            }
        } else {
            setValue('property_assessment.assessment_value', 0);
        }
    }, [buildingCategory, AssessmentTotalMarketValue, setValue]);

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <View className="flex-row items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg border-l-4" style={{ borderLeftColor: PRIMARY_COLOR }}>
                <Text className="text-lg font-bold text-gray-800">PROPERTY ASSESSMENT</Text>
                <Icon name="assessment" size={24} color="#2c3e50" />
            </View>

            <View className="bg-white rounded-lg mb-4 shadow-sm overflow-hidden">
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View className="min-w-[900px]">
                        {/* Table Header */}
                        <View className="flex-row" style={{ backgroundColor: PRIMARY_COLOR }}>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '15%', minWidth: 100 }}>
                                <Text className="text-white font-semibold text-center text-sm">Area</Text>
                            </View>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '15%', minWidth: 120 }}>
                                <Text className="text-white font-semibold text-center text-sm">Assessment Level</Text>
                            </View>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '25%', minWidth: 180 }}>
                                <Text className="text-white font-semibold text-center text-sm">Actual Use</Text>
                            </View>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '20%', minWidth: 140 }}>
                                <Text className="text-white font-semibold text-center text-sm">Market Value</Text>
                            </View>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '25%', minWidth: 160 }}>
                                <Text className="text-white font-semibold text-center text-sm">Assessment Value (PHP)</Text>
                            </View>
                        </View>

                        {/* Table Row 1 */}
                        <View className="flex-row border-b border-gray-200 min-h-[60px]">
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '15%', minWidth: 100 }}>
                                <TextInput
                                    value={totalArea > 0 ? `${totalArea} sq.m` : '-'}
                                    editable={false}
                                    selectTextOnFocus={false}
                                    className="w-full p-1 text-sm text-gray-500 text-center bg-gray-50 border border-gray-200 rounded"
                                />
                            </View>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '15%', minWidth: 120 }}>
                                <TextInput
                                    value={assessmentLevel > 0 ? `${assessmentLevel}%` : '-'}
                                    editable={false}
                                    selectTextOnFocus={false}
                                    className="w-full p-1 text-sm text-gray-500 text-center bg-gray-50 border border-gray-200 rounded"
                                />
                            </View>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '25%', minWidth: 180 }}>
                                <View className="w-full border border-gray-300 rounded bg-gray-50">
                                    <Picker
                                        selectedValue={buildingCategory}
                                        onValueChange={(newValue: string) => {
                                            setValue('property_assessment', { ...propertyAssessment, building_category: newValue });
                                            setValue('buildingCategory', newValue);
                                        }}
                                        style={{ height: 40, opacity: 0.01 }}
                                    >
                                        <Picker.Item label="Select category" value="" />
                                        {buildingCategories.map((c) => (
                                            <Picker.Item key={c.id} label={c.name} value={c.id} />
                                        ))}
                                    </Picker>
                                    <View className="absolute inset-0 justify-center items-center flex-row px-2" pointerEvents="none">
                                        <Text className="text-gray-800 text-sm flex-1 text-center" numberOfLines={1}>
                                            {buildingCategories.find((c) => c.id === buildingCategory)?.name || 'Select category'}
                                        </Text>
                                        <Icon name="arrow-drop-down" size={20} color="#374151" />
                                    </View>
                                </View>
                            </View>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '20%', minWidth: 140 }}>
                                <TextInput
                                    value={formatPHP(AssessmentTotalMarketValue)}
                                    editable={false}
                                    selectTextOnFocus={false}
                                    className="w-full p-1 text-sm text-gray-500 text-center bg-gray-50 border border-gray-200 rounded"
                                />
                            </View>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '25%', minWidth: 160 }}>
                                <TextInput
                                    value={formatPHP(assessmentValue)}
                                    editable={false}
                                    selectTextOnFocus={false}
                                    className="w-full p-1 text-sm text-green-600 font-bold text-center bg-gray-50 border border-gray-200 rounded"
                                />
                            </View>
                        </View>

                        {/* Table Row 2 */}
                        <View className="flex-row border-b border-gray-200 min-h-[60px]">
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '15%', minWidth: 100 }}>
                                <View className="items-center justify-center">
                                    <Text className="text-gray-700 font-semibold text-sm mb-1">
                                        {currentTaxable === 1 ? 'Taxable' : 'Exempt'}
                                    </Text>
                                    <Switch
                                        value={currentTaxable === 1}
                                        onValueChange={(newValue) => {
                                            const numericValue = newValue ? 1 : 0;
                                            setValue('property_assessment', { ...propertyAssessment, taxable: numericValue });
                                        }}
                                        trackColor={{ false: '#767577', true: PRIMARY_COLOR }}
                                        thumbColor={currentTaxable === 1 ? '#f59e0b' : '#f3f4f6'}
                                    />
                                </View>
                            </View>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '15%', minWidth: 120 }}>
                                <Text className="text-gray-600 font-semibold text-xs text-center">
                                    Effectivity of Assessment/Revision Date
                                </Text>
                            </View>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '25%', minWidth: 180 }}>
                                <View className="w-full border border-gray-300 rounded bg-gray-50">
                                    <Picker
                                        selectedValue={currentQuarter}
                                        onValueChange={(newValue: string) => setValue('property_assessment', { ...propertyAssessment, eff_quarter: newValue })}
                                        style={{ height: 40, opacity: 0.01 }}
                                    >
                                        <Picker.Item label="Select quarter" value="" />
                                        {quarters.map((q) => (
                                            <Picker.Item key={q.value} label={q.label} value={q.value} />
                                        ))}
                                    </Picker>
                                    <View className="absolute inset-0 justify-center items-center flex-row px-2" pointerEvents="none">
                                        <Text className="text-gray-800 text-sm flex-1 text-center" numberOfLines={1}>
                                            {quarters.find((q) => q.value === currentQuarter)?.label || 'Qtr'}
                                        </Text>
                                        <Icon name="arrow-drop-down" size={20} color="#374151" />
                                    </View>
                                </View>
                            </View>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '20%', minWidth: 140 }}>
                                <View className="w-full border border-gray-300 rounded bg-gray-50">
                                    <Picker
                                        selectedValue={currentYear}
                                        onValueChange={(newValue: string) => setValue('property_assessment', { ...propertyAssessment, eff_year: newValue })}
                                        style={{ height: 40, opacity: 0.01 }}
                                    >
                                        <Picker.Item label="Select year" value="" />
                                        {generateYears().map((y) => (
                                            <Picker.Item key={y.id} label={y.name} value={y.id} />
                                        ))}
                                    </Picker>
                                    <View className="absolute inset-0 justify-center items-center flex-row px-2" pointerEvents="none">
                                        <Text className="text-gray-800 text-sm flex-1 text-center" numberOfLines={1}>
                                            {currentYear || 'Year'}
                                        </Text>
                                        <Icon name="arrow-drop-down" size={20} color="#374151" />
                                    </View>
                                </View>
                            </View>
                            <View className="py-3 px-2 items-center justify-center" style={{ width: '25%', minWidth: 160 }}>
                                {/* Empty cell for alignment */}
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* Summary Section */}
            <View className="bg-white rounded-lg p-4 shadow-sm">
                <Text className="text-base font-bold text-gray-800 mb-3 pb-2 border-b border-gray-200">Assessment Summary</Text>

                <View className="flex-row justify-between items-start py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600 font-medium">Total Area:</Text>
                    <Text className="text-sm text-gray-800 font-semibold text-right flex-1">
                        {totalArea > 0 ? `${totalArea} sq.m` : '-'}
                    </Text>
                </View>

                <View className="flex-row justify-between items-start py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600 font-medium">Building Category:</Text>
                    <Text className="text-sm text-gray-800 font-semibold text-right flex-1">
                        {buildingCategories.find(c => c.id === buildingCategory)?.name || 'Not selected'}
                    </Text>
                </View>

                <View className="flex-row justify-between items-start py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600 font-medium">Assessment Level:</Text>
                    <Text className="text-sm text-gray-800 font-semibold text-right flex-1">
                        {assessmentLevel > 0 ? `${assessmentLevel}%` : '-'}
                    </Text>
                </View>

                <View className="flex-row justify-between items-start py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600 font-medium">Total Market Value:</Text>
                    <Text className="text-sm text-gray-800 font-semibold text-right flex-1">
                        {formatPHP(AssessmentTotalMarketValue)}
                    </Text>
                </View>

                <View className="flex-row justify-between items-start py-3 border-t border-gray-200 mt-2">
                    <Text className="text-base font-bold text-gray-800">Assessment Value:</Text>
                    <Text className="text-base font-bold text-green-600 text-right flex-1">
                        {formatPHP(assessmentValue)}
                    </Text>
                </View>

                <View className="flex-row justify-between items-start py-2 border-b border-gray-100">
                    <Text className="text-sm text-gray-600 font-medium">Status:</Text>
                    <Text className={`text-sm font-bold text-right flex-1 ${currentTaxable === 1 ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {currentTaxable === 1 ? 'Taxable' : 'Exempt'}
                    </Text>
                </View>

                <View className="flex-row justify-between items-start py-2">
                    <Text className="text-sm text-gray-600 font-medium">Effective Date:</Text>
                    <Text className="text-sm text-gray-800 font-semibold text-right flex-1">
                        {quarters.find(q => q.value === currentQuarter)?.label} {currentYear}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default PropertyAssessment;