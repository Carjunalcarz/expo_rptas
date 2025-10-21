import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, Linking, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_COLOR } from '@/constants/colors';
import { FaasPrintService } from './FaasPrintService';

interface FaasHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  assessment: any;
}

interface FaasHistoryItem {
  url: string;
  timestamp: string;
  version: number;
  action: string;
  tdArp?: string;
}

export default function FaasHistoryModal({ visible, onClose, assessment }: FaasHistoryModalProps) {
  const faasHistory = FaasPrintService.getFaasHistory(assessment);
  const currentFaas = FaasPrintService.getLatestFaasPdf(assessment);

  const handleOpenPdf = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open PDF. URL not supported.');
      }
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Failed to open PDF. Please try again.');
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return 'add-circle';
      case 'updated':
        return 'update';
      default:
        return 'description';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return '#10b981'; // green
      case 'updated':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  const renderHistoryItem = ({ item, index }: { item: FaasHistoryItem; index: number }) => {
    const isLatest = item.url === currentFaas;

    return (
      <TouchableOpacity
        onPress={() => handleOpenPdf(item.url)}
        style={{
          backgroundColor: 'white',
          marginHorizontal: 16,
          marginVertical: 4,
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
          borderLeftWidth: 4,
          borderLeftColor: isLatest ? PRIMARY_COLOR : getActionColor(item.action)
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Icon
                name={getActionIcon(item.action)}
                size={20}
                color={getActionColor(item.action)}
                style={{ marginRight: 8 }}
              />
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#111827',
                flex: 1
              }}>
                {item.tdArp || assessment?.tdArp || `TDN ${item.version}`}
                {isLatest && (
                  <Text style={{ color: PRIMARY_COLOR, fontSize: 12 }}> (Current)</Text>
                )}
              </Text>
              <Icon name="open-in-new" size={16} color="#6b7280" />
            </View>

            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
              {formatDate(item.timestamp)}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                backgroundColor: getActionColor(item.action),
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                marginRight: 8
              }}>
                <Text style={{
                  fontSize: 10,
                  color: 'white',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}>
                  {item.action}
                </Text>
              </View>

              <Text style={{ fontSize: 11, color: '#9ca3af', flex: 1 }} numberOfLines={1}>
                {item.url.split('/').pop()?.split('?')[0] || 'PDF Document'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
          backgroundColor: 'white',
          paddingTop: 50,
          paddingBottom: 16,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="history" size={24} color={PRIMARY_COLOR} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
                FAAS PDF History
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: '#f3f4f6'
              }}
            >
              <Icon name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
            {faasHistory.length} version{faasHistory.length !== 1 ? 's' : ''} available
          </Text>
        </View>

        {/* Content */}
        {faasHistory.length > 0 ? (
          <FlatList
            data={faasHistory.reverse()} // Show latest first
            keyExtractor={(item, index) => `${item.version}-${index}`}
            renderItem={renderHistoryItem}
            contentContainerStyle={{ paddingVertical: 16 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32
          }}>
            <Icon name="description" size={64} color="#d1d5db" />
            <Text style={{
              fontSize: 18,
              fontWeight: '500',
              color: '#6b7280',
              textAlign: 'center',
              marginTop: 16,
              marginBottom: 8
            }}>
              No FAAS PDFs Available
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#9ca3af',
              textAlign: 'center',
              lineHeight: 20
            }}>
              FAAS PDFs will appear here once they are generated for this assessment.
            </Text>
          </View>
        )}

        {/* Footer Info */}
        <View style={{
          backgroundColor: 'white',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="info" size={16} color="#6b7280" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: '#6b7280', flex: 1 }}>
              Tap any version to open the PDF. The current version is highlighted in blue.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
