import { View, Text, TouchableOpacity, Image, SectionList, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import images from '@/constants/images';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listAssessmentDocuments } from '@/lib/appwrite';
import { navigateToAssessment, navigateToEditAssessment } from '@/lib/navigation';
import { useAppwrite } from '@/lib/useAppwrite';
import NoResults from '@/components/NoResults';

const RemoteAssessment = () => {
  const { data: assessments, loading, refetch } = useAppwrite({ fn: listAssessmentDocuments });

  const renderRow = ({ item }: { item: any }) => {
    const ownerDetails = JSON.parse(item.owner_details || '{}');
    const location = JSON.parse(item.building_location || '{}');
    const assessmentDetails = JSON.parse(item.property_assessment || '{}');
    const appraisal = JSON.parse(item.property_appraisal || '{}');

    const src = location?.buildingImages?.[0] || appraisal?.gallery?.[0]?.image;
    const imageSource = typeof src === 'string' && src.length ? { uri: src } : images.noResult;
    const marketValue = assessmentDetails?.market_value;
    const formattedValue = marketValue ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(marketValue) : '-';
    const address = [location?.street, location?.barangay, location?.municipality, location?.province].filter(Boolean).join(', ');

    return (
      <TouchableOpacity onPress={() => navigateToAssessment(item.$id)} className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
        <View className="flex flex-row items-center">
          <Image source={imageSource} className="w-16 h-16 rounded-lg mr-4" resizeMode="cover" />
          <View className="flex-1">
            <Text className="text-lg font-rubik-medium text-gray-800" numberOfLines={1}>
              {ownerDetails?.owner || `Assessment ${item.$id}`}
            </Text>
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>{address || 'No address'}</Text>
            <Text className="text-xs text-gray-400 mt-2">
              {item.$createdAt ? new Date(item.$createdAt).toLocaleDateString() : ''}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-base font-rubik-bold text-blue-600">{formattedValue}</Text>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); navigateToEditAssessment(item.$id); }}
              className="mt-2 p-2 rounded-full"
            >
              <MaterialIcons name="edit" size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-5">
        <View className="flex flex-row items-center justify-between py-4 mb-6">
          <Text className="text-2xl font-rubik-bold text-gray-800">Remote Assessments</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : assessments && assessments.length > 0 ? (
          <SectionList
            sections={[{ title: 'All Assessments', data: assessments }]}
            keyExtractor={(item) => item.$id}
            renderItem={renderRow}
            refreshing={loading}
            onRefresh={() => refetch({} as any)}
            renderSectionHeader={({ section: { title } }) => (
              <Text className="text-base font-rubik-medium text-gray-700 mt-2 mb-2">{title}</Text>
            )}
            stickySectionHeadersEnabled={false}
          />
        ) : (
          <NoResults title="No Remote Assessments" subtitle="Sync local assessments to see them here." />
        )}
      </View>
    </SafeAreaView>
  );
};

export default RemoteAssessment;
