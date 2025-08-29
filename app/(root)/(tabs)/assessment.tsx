import { View, Text, TouchableOpacity, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useForm } from 'react-hook-form';
import { getAllAssessments } from '@/lib/local-db'
import { navigateToAssessment } from '@/lib/navigation'
import { navigateToAddAssessment } from '@/lib/navigation'

const Assessment = () => {
  const handleAddAssessment = () => navigateToAddAssessment()
  const { watch } = useForm();

  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = await getAllAssessments();
      if (!mounted) return;
      setList(rows);
    })();
    return () => { mounted = false }
  }, []);

  const allValues = watch();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-5">
        {/* Header */}
        <View className="flex flex-row items-center justify-between py-4 mb-6">
          <Text className="text-2xl font-rubik-bold text-black-300">Assessments</Text>
          <TouchableOpacity
            onPress={handleAddAssessment}
            className="bg-primary-300 rounded-full w-10 h-10 flex items-center justify-center shadow-sm"
            accessibilityLabel="Add assessment"
          >
            <Text className="text-white text-xl font-bold">+</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={list}
          keyExtractor={(it) => it.local_id?.toString() ?? String(Math.random())}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigateToAssessment(item.local_id)} className="border-b border-gray-100 py-3">

            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center mt-12">
              <View className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                <Text className="text-gray-400 text-2xl">📋</Text>
              </View>
              <Text className="text-lg font-rubik-medium text-black-300 mb-2">No Assessments Yet</Text>
              <Text className="text-base font-rubik text-black-100 text-center mb-6">Start by adding your first assessment</Text>
              <TouchableOpacity onPress={handleAddAssessment} className="bg-primary-300 rounded-xl px-6 py-3 flex flex-row items-center">
                <Text className="text-white text-lg font-bold mr-2">+</Text>
                <Text className="text-white text-base font-rubik-medium">Add Assessment</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  )
}

export default Assessment