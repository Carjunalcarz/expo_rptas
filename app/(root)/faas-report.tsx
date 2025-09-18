import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FaasReport from '../../components/FaasReportSimple';

const FaasReportScreen = () => {
  const params = useLocalSearchParams();

  // Parse the assessment data from params
  const assessment = params.assessment ? JSON.parse(params.assessment as string) : null;

  const handleShare = async () => {
    try {
      const ownerName = assessment?.owner_details?.owner || 'Assessment';
      const message = `FAAS Report for ${ownerName}\n\nGenerated from RPTAS Mobile App`;

      await Share.share({
        message,
        title: 'FAAS Report',
      });
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const handlePrint = () => {
    Alert.alert(
      'Print Report',
      'This will generate a PDF version of the FAAS report.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Print', onPress: () => console.log('Print functionality') }
      ]
    );
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!assessment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAAS Report</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No assessment data available</Text>
          <TouchableOpacity onPress={handleGoBack} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAAS Report</Text>
      </View>

      {/* FAAS Report Content */}
      <FaasReport assessment={assessment} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4472C4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginRight: 40, // Balance the back button
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#4472C4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FaasReportScreen;
