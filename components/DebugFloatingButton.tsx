import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { storageHealth, getCurrentUser, ensureSession, createAccount, loginWithEmail } from '@/lib/appwrite';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'success' | 'warning';
  message: string;
}

const DebugFloatingButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (level: LogEntry['level'], message: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const testAppwriteConnection = async () => {
    setIsLoading(true);
    addLog('info', '🔄 Starting Appwrite connection test...');

    try {
      // Test 1: Storage Health
      addLog('info', '📊 Testing storage health...');
      const health = await storageHealth();
      addLog('success', `✅ Storage Health: ${JSON.stringify(health, null, 2)}`);

      // Test 2: Current User
      addLog('info', '👤 Checking current user...');
      const user = await getCurrentUser();
      if (user) {
        addLog('success', `✅ User found: ${user.$id}`);
      } else {
        addLog('warning', '⚠️ No current user, trying to create session...');
        
        // Test 3: Email/Password Authentication
        addLog('info', '🔐 Testing email/password authentication...');
        try {
          const testEmail = "user@example.com";
          const testPassword = "password";
          const testName = "RPTAS User";
          
          // Try to login first
          addLog('info', '📧 Attempting login with test account...');
          const loginResult = await loginWithEmail(testEmail, testPassword);
          
          if (loginResult.success) {
            addLog('success', '✅ Login successful with existing account');
          } else {
            addLog('warning', '⚠️ Login failed, trying to create account...');
            
            // Try to create account
            const createResult = await createAccount(testEmail, testPassword, testName);
            if (createResult.success) {
              addLog('success', '✅ Account created successfully');
              
              // Try login again
              const loginResult2 = await loginWithEmail(testEmail, testPassword);
              if (loginResult2.success) {
                addLog('success', '✅ Login successful with new account');
              } else {
                addLog('error', `❌ Login failed after account creation: ${loginResult2.error}`);
              }
            } else {
              addLog('error', `❌ Account creation failed: ${createResult.error}`);
            }
          }
          
          // Test session
          const session = await ensureSession();
          if (session) {
            addLog('success', `✅ Session verified: ${session.$id}`);
          } else {
            addLog('error', '❌ Failed to get session after authentication');
          }
        } catch (sessionError: any) {
          addLog('error', `❌ Authentication error: ${sessionError?.message || sessionError}`);
          
          // Check specific error types
          if (sessionError?.message?.includes('Invalid Origin') || sessionError?.message?.includes('platform')) {
            addLog('error', '🔧 FIX: Add Android platform (com.ajncarz.restate) in Appwrite Console → Platforms');
          }
          if (sessionError?.message?.includes('not authorized')) {
            addLog('error', '🔧 FIX: Add role:users permissions to storage bucket and database collections');
          }
        }
      }

      addLog('success', '🎉 Appwrite connection test completed!');
    } catch (error: any) {
      addLog('error', `❌ Connection test failed: ${error?.message || error}`);
      
      // Additional debugging info
      addLog('info', `📍 Endpoint: ${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}`);
      addLog('info', `📍 Project ID: ${process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', '🧹 Logs cleared');
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '#ff4444';
      case 'success': return '#00aa00';
      case 'warning': return '#ffaa00';
      default: return '#666666';
    }
  };

  const copyLogsToClipboard = () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`).join('\n');
    // Note: In a real app, you'd use Clipboard API here
    Alert.alert('Logs', 'Logs copied to clipboard (simulated)', [{ text: 'OK' }]);
  };

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="bug-report" size={24} color="white" />
      </TouchableOpacity>

      {/* Debug Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Appwrite Debug Logs</Text>
            <TouchableOpacity
              onPress={() => setIsVisible(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.testButton]}
              onPress={testAppwriteConnection}
              disabled={isLoading}
            >
              <MaterialIcons 
                name={isLoading ? "hourglass-empty" : "play-arrow"} 
                size={20} 
                color="white" 
              />
              <Text style={styles.actionButtonText}>
                {isLoading ? 'Testing...' : 'Test Connection'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={clearLogs}
            >
              <MaterialIcons name="clear" size={20} color="white" />
              <Text style={styles.actionButtonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.copyButton]}
              onPress={copyLogsToClipboard}
            >
              <MaterialIcons name="content-copy" size={20} color="white" />
              <Text style={styles.actionButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>

          {/* Logs Display */}
          <ScrollView style={styles.logsContainer} showsVerticalScrollIndicator={true}>
            {logs.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="info" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No logs yet</Text>
                <Text style={styles.emptySubtext}>Tap "Test Connection" to start debugging</Text>
              </View>
            ) : (
              logs.map((log, index) => (
                <View key={index} style={styles.logEntry}>
                  <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                  <Text style={[styles.logMessage, { color: getLogColor(log.level) }]}>
                    {log.message}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              📱 Logs: {logs.length}/50 • 🔄 Auto-refresh on test
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  testButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
  },
  copyButton: {
    backgroundColor: '#4ECDC4',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  logsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  logEntry: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  logMessage: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default DebugFloatingButton;
