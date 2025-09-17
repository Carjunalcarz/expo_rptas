import React from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, Share } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FaasReport from './FaasReport';

interface FaasReportModalProps {
  visible: boolean;
  onClose: () => void;
  assessment: any;
}

const FaasReportModal: React.FC<FaasReportModalProps> = ({ visible, onClose, assessment }) => {
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
      'Print functionality will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleExportPDF = () => {
    Alert.alert(
      'Export PDF',
      'PDF export functionality will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          paddingTop: 50, // Account for status bar
        }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: '#f3f4f6',
            }}
          >
            <Icon name="close" size={20} color="#374151" />
            <Text style={{ marginLeft: 4, fontSize: 14, color: '#374151', fontWeight: '600' }}>
              Close
            </Text>
          </TouchableOpacity>

          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#374151',
            flex: 1,
            textAlign: 'center',
            marginHorizontal: 16,
          }}>
            FAAS Report
          </Text>
        </View>

        {/* Report Content */}
        <View style={{ flex: 1 }}>
          <FaasReport assessment={assessment} />
        </View>
      </View>
    </Modal>
  );
};

export default FaasReportModal;
