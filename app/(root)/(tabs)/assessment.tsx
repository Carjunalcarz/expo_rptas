import { View, Text, TouchableOpacity, FlatList, Image, Alert } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import images from '@/constants/images'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm } from 'react-hook-form';
import { getAllAssessments, deleteAssessment } from '@/lib/local-db'
import { navigateToAssessment } from '@/lib/navigation'
import { navigateToAddAssessment } from '@/lib/navigation'
import { useFocusEffect } from '@react-navigation/native'

const Assessment = () => {
  const handleAddAssessment = () => navigateToAddAssessment()
  const { watch } = useForm();

  const [list, setList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRows = async () => {
    const rows = await getAllAssessments();
    setList(rows);
  };

  const handleDelete = async (localId: number | string, createdAt?: string) => {
    try {
      Alert.alert(
        'Delete assessment',
        'Are you sure you want to delete this assessment? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteAssessment(localId as any);
              // If last_assessment points to the deleted record, clear it to avoid ghost entries elsewhere
              try {
                const raw = await AsyncStorage.getItem('last_assessment');
                if (raw) {
                  const parsed = JSON.parse(raw);
                  const matchById = parsed?.local_id && String(parsed.local_id) === String(localId);
                  const matchByCreated = createdAt && parsed?.createdAt && String(parsed.createdAt) === String(createdAt);
                  if (matchById || matchByCreated) {
                    await AsyncStorage.removeItem('last_assessment');
                  }
                }
              } catch { }
              await loadRows();
            }
          }
        ]
      );
    } catch (e) {
      console.warn('delete error', e);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => { await loadRows(); })();
    return () => { mounted = false }
  }, []);

  // Reload list whenever the tab/screen regains focus (e.g., after deleting from detail)
  useFocusEffect(React.useCallback(() => {
    loadRows();
    return () => { /* no-op on blur */ };
  }, []));

  const allValues = watch();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-5">
        {/* Header */}
        <View className="flex flex-row items-center justify-between py-4 mb-6">
          <Text className="text-2xl font-rubik-bold text-gray-800">Assessments</Text>
          <TouchableOpacity
            onPress={handleAddAssessment}
            className="bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center shadow-sm"
            accessibilityLabel="Add assessment"
          >
            <Icon name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {list.length > 0 ? (
          <FlatList
            data={list}
            keyExtractor={(it) => String(it.local_id ?? it.created_at ?? Math.random())}
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await loadRows(); setRefreshing(false); }}
            renderItem={({ item }) => {
              const src = item.data?.general_description?.floorPlanImages?.[0] || item.data?.property_appraisal?.gallery?.[0]?.image;
              const imageSource = typeof src === 'string' && src.length ? { uri: src } : images.noResult;
              const marketValue = item.data?.property_assessment?.market_value;
              const formattedValue = marketValue ? new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                maximumFractionDigits: 0
              }).format(marketValue) : '-';

              return (
                <TouchableOpacity
                  onPress={() => navigateToAssessment(item.local_id)}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                >
                  <View className="flex flex-row items-center">
                    <Image
                      source={imageSource}
                      className="w-16 h-16 rounded-lg mr-4"
                      resizeMode="cover"
                    />
                    <View className="flex-1">
                      <Text className="text-lg font-rubik-medium text-gray-800" numberOfLines={1}>
                        {item.data?.owner_details?.owner || `Assessment ${item.local_id}`}
                      </Text>
                      <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
                        {item.data?.general_description?.buildingPermitNo || item.data?.building_location?.street || 'No details'}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-2">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-base font-rubik-bold text-blue-600">
                        {formattedValue}
                      </Text>
                      <View className="flex-row mt-3">
                        <TouchableOpacity
                          onPress={() => handleDelete(item.local_id, item.created_at)}
                          className="p-2 rounded-full bg-gray-100 ml-2"
                        >
                          <Icon name="delete-outline" size={18} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        ) : (
          // Empty state with prominent Add Assessment button
          <View className="flex-1 items-center justify-center">
            <View className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center mb-6">
              <Icon name="assessment" size={40} color="#3b82f6" />
            </View>
            <Text className="text-xl font-rubik-bold text-gray-800 mb-2">No Assessments Yet</Text>
            <Text className="text-base font-rubik text-gray-600 text-center mb-8 max-w-xs">
              Start by creating your first property assessment
            </Text>
            <TouchableOpacity
              onPress={handleAddAssessment}
              className="bg-blue-500 rounded-xl px-8 py-4 flex flex-row items-center shadow-md"
            >
              <Icon name="add" size={24} color="#FFF" style={{ marginRight: 8 }} />
              <Text className="text-white text-lg font-rubik-medium">Add Assessment</Text>
            </TouchableOpacity>

            <View className="mt-10">
              <Text className="text-sm text-gray-500 text-center mb-3">What you can do with assessments:</Text>
              <View className="flex-row">
                <View className="items-center mx-4">
                  <View className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center mb-2">
                    <Icon name="calculate" size={20} color="#3b82f6" />
                  </View>
                  <Text className="text-xs text-gray-600 text-center">Calculate property values</Text>
                </View>
                <View className="items-center mx-4">
                  <View className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center mb-2">
                    <Icon name="photo-camera" size={20} color="#3b82f6" />
                  </View>
                  <Text className="text-xs text-gray-600 text-center">Add property photos</Text>
                </View>
                <View className="items-center mx-4">
                  <View className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center mb-2">
                    <Icon name="description" size={20} color="#3b82f6" />
                  </View>
                  <Text className="text-xs text-gray-600 text-center">Generate reports</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

export default Assessment