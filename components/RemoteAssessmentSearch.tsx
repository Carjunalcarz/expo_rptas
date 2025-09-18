import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface RemoteSearchFilters {
  searchText: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  valueRange: 'all' | 'low' | 'medium' | 'high';
  location: string;
}

interface RemoteAssessmentSearchProps {
  assessments: any[];
  onFilteredResults: (filtered: any[]) => void;
  placeholder?: string;
}

const RemoteAssessmentSearch: React.FC<RemoteAssessmentSearchProps> = ({
  assessments,
  onFilteredResults,
  placeholder = "Search remote assessments..."
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<RemoteSearchFilters>({
    searchText: '',
    dateRange: 'all',
    valueRange: 'all',
    location: ''
  });

  const filterAssessments = (assessmentList: any[], currentFilters: RemoteSearchFilters) => {
    return assessmentList.filter(assessment => {
      // Parse JSON data for remote assessments
      const ownerDetails = JSON.parse(assessment.owner_details || '{}');
      const location = JSON.parse(assessment.building_location || '{}');
      const assessmentDetails = JSON.parse(assessment.property_assessment || '{}');

      // Text search - search in owner name, transaction code, TD/ARP, PIN, and address
      if (currentFilters.searchText) {
        const searchLower = currentFilters.searchText.toLowerCase();
        const owner = (ownerDetails?.owner || '').toLowerCase();
        const transactionCode = (ownerDetails?.transactionCode || '').toLowerCase();
        const tdArp = (ownerDetails?.tdArp || '').toLowerCase();
        const pin = (ownerDetails?.pin || '').toLowerCase();
        const assessmentId = (assessment.$id || '').toLowerCase();
        const street = (location?.street || '').toLowerCase();
        const barangay = (location?.barangay || '').toLowerCase();
        const municipality = (location?.municipality || '').toLowerCase();
        const province = (location?.province || '').toLowerCase();
        
        const matchesText = owner.includes(searchLower) ||
                           transactionCode.includes(searchLower) ||
                           tdArp.includes(searchLower) ||
                           pin.includes(searchLower) ||
                           assessmentId.includes(searchLower) ||
                           street.includes(searchLower) ||
                           barangay.includes(searchLower) ||
                           municipality.includes(searchLower) ||
                           province.includes(searchLower);
        
        if (!matchesText) return false;
      }

      // Date range filter
      if (currentFilters.dateRange !== 'all' && assessment.$createdAt) {
        const assessmentDate = new Date(assessment.$createdAt);
        const now = new Date();
        const diffTime = now.getTime() - assessmentDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (currentFilters.dateRange) {
          case 'today':
            if (diffDays > 1) return false;
            break;
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
          case 'year':
            if (diffDays > 365) return false;
            break;
        }
      }

      // Value range filter
      if (currentFilters.valueRange !== 'all') {
        const marketValue = assessmentDetails?.market_value || 0;
        switch (currentFilters.valueRange) {
          case 'low':
            if (marketValue > 500000) return false;
            break;
          case 'medium':
            if (marketValue <= 500000 || marketValue > 2000000) return false;
            break;
          case 'high':
            if (marketValue <= 2000000) return false;
            break;
        }
      }

      // Location filter
      if (currentFilters.location) {
        const locationLower = currentFilters.location.toLowerCase();
        const street = (location?.street || '').toLowerCase();
        const barangay = (location?.barangay || '').toLowerCase();
        const municipality = (location?.municipality || '').toLowerCase();
        const province = (location?.province || '').toLowerCase();
        
        const matchesLocation = street.includes(locationLower) ||
                               barangay.includes(locationLower) ||
                               municipality.includes(locationLower) ||
                               province.includes(locationLower);
        
        if (!matchesLocation) return false;
      }

      return true;
    });
  };

  useEffect(() => {
    const filtered = filterAssessments(assessments, filters);
    onFilteredResults(filtered);
  }, [assessments, filters]);

  const clearFilters = () => {
    setFilters({
      searchText: '',
      dateRange: 'all',
      valueRange: 'all',
      location: ''
    });
  };

  const hasActiveFilters = filters.dateRange !== 'all' || 
                          filters.valueRange !== 'all' || 
                          filters.location !== '';

  return (
    <View className="mb-4">
      {/* Search Bar */}
      <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 mb-3">
        <MaterialIcons name="search" size={20} color="#6b7280" />
        <TextInput
          className="flex-1 ml-3 text-gray-800 font-rubik"
          placeholder={placeholder}
          value={filters.searchText}
          onChangeText={(text) => setFilters(prev => ({ ...prev, searchText: text }))}
          placeholderTextColor="#9ca3af"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {filters.searchText ? (
          <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, searchText: '' }))}>
            <MaterialIcons name="clear" size={20} color="#6b7280" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Toggle */}
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          className="flex-row items-center bg-white border border-gray-200 rounded-lg px-3 py-2"
        >
          <MaterialIcons name="tune" size={18} color="#6b7280" />
          <Text className="ml-2 text-gray-700 font-rubik">Filters</Text>
          {hasActiveFilters && (
            <View className="ml-2 bg-blue-500 rounded-full w-2 h-2" />
          )}
        </TouchableOpacity>

        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters} className="px-3 py-2">
            <Text className="text-blue-500 font-rubik">Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Date Range Filter */}
            <View className="mb-4">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-2">Date Range</Text>
              <View className="flex-row flex-wrap">
                {[
                  { key: 'all', label: 'All Time' },
                  { key: 'today', label: 'Today' },
                  { key: 'week', label: 'This Week' },
                  { key: 'month', label: 'This Month' },
                  { key: 'year', label: 'This Year' }
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setFilters(prev => ({ ...prev, dateRange: option.key as any }))}
                    className={`mr-2 mb-2 px-3 py-2 rounded-lg border ${
                      filters.dateRange === option.key
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className={`text-sm font-rubik ${
                      filters.dateRange === option.key ? 'text-white' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Value Range Filter */}
            <View className="mb-4">
              <Text className="text-sm font-rubik-medium text-gray-700 mb-2">Market Value Range</Text>
              <View className="flex-row flex-wrap">
                {[
                  { key: 'all', label: 'All Values' },
                  { key: 'low', label: 'Under ₱500K' },
                  { key: 'medium', label: '₱500K - ₱2M' },
                  { key: 'high', label: 'Over ₱2M' }
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setFilters(prev => ({ ...prev, valueRange: option.key as any }))}
                    className={`mr-2 mb-2 px-3 py-2 rounded-lg border ${
                      filters.valueRange === option.key
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text className={`text-sm font-rubik ${
                      filters.valueRange === option.key ? 'text-white' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location Filter */}
            <View>
              <Text className="text-sm font-rubik-medium text-gray-700 mb-2">Location</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-rubik"
                placeholder="Search by location..."
                value={filters.location}
                onChangeText={(text) => setFilters(prev => ({ ...prev, location: text }))}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default RemoteAssessmentSearch;
