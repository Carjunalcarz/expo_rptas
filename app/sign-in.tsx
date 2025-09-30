import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

// import { login } from "@/lib/appwrite"; // not used in offline mode
import { Redirect } from "expo-router";
import { useGlobalContext } from "@/lib/global-provider";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { useRouter } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';

const Auth = () => {
  const { refetch, loading, isLogged } = useGlobalContext();
  const router = useRouter();
  const { width } = useWindowDimensions();

  if (!loading && isLogged) return <Redirect href="/" />;

  // ✅ Dynamic image size: larger on tablets
  const imageHeight = width > 768 ? 500 : 320; // Tablet >768px, Phone otherwise

  return (
    <SafeAreaView className="bg-white flex-1">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={64}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-10 py-6">
            <Image
              source={images.onboarding}
              style={{ width: "100%", height: "35%" }}
              resizeMode="contain"
            />

            <View className="items-center mt-2">
              {/* PGAN Logo */}
              <View className="mb-4">
                <Image
                  source={images.pganLogo}
                  style={{ width: 100, height: 100 }}
                  resizeMode="contain"
                />
              </View>
              
              {/* Official Header */}
              <View className="items-center mb-3">
                <Text className="text-sm text-center uppercase font-rubik text-gray-600 tracking-wider">
                  Province of Agusan del Norte
                </Text>
                <Text className="text-base text-center font-rubik-medium text-blue-700 mt-1">
                  Provincial Government
                </Text>
              </View>

              {/* System Title */}
              <Text className="text-2xl font-rubik-bold text-black-300 text-center mt-2 leading-tight">
                Real Property Tax {"\n"}
                <Text className="text-primary-300">Assessment System</Text>
              </Text>

              {/* Version & Authority */}
              <View className="items-center mt-3 mb-4">
                <Text className="text-sm text-center text-gray-600 font-medium">
                  Mobile Assessment Portal • Version 2.0
                </Text>
                <View className="flex-row items-center mt-1">
                  <MaterialIcons name="verified-user" size={16} color="#059669" />
                  <Text className="text-xs text-center text-green-700 ml-1 font-medium">
                    Authorized Personnel Only
                  </Text>
                </View>
              </View>

              {/* Security Badge */}
              <View className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 mb-4">
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="security" size={16} color="#2563eb" />
                  <Text className="text-blue-800 font-semibold ml-2 text-sm">Secure Government Portal</Text>
                </View>
                <Text className="text-blue-700 text-xs text-center mt-1">
                  Protected by government-grade security protocols
                </Text>
              </View>
            </View>

            {/* Government Portal Access Button */}
            <TouchableOpacity
              onPress={() => { try { const r = require('expo-router'); r?.router?.push("/local_sign-in"); } catch (e) { console.warn('router.push failed', e); } }}
              className="bg-blue-600 shadow-lg shadow-blue-300 rounded-xl w-full py-4 mt-6 border border-blue-700"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                <MaterialIcons name="login" size={24} color="#ffffff" />
                <Text className="text-lg text-white font-rubik-bold text-center ml-2">
                  Enter RPTAS Portal
                </Text>
              </View>
              <Text className="text-xs text-blue-100 text-center mt-1">
                Secure Assessor Login
              </Text>
            </TouchableOpacity>

            {/* Footer Information */}
            <View className="items-center mt-4">
              <View className="flex-row items-center mb-1">
                <MaterialIcons name="info-outline" size={14} color="#6b7280" />
                <Text className="text-gray-500 text-xs ml-1">
                  For technical support, contact IT Department
                </Text>
              </View>
              <Text className="text-xs text-gray-400 text-center">
                © 2024 Province of Agusan del Norte • All Rights Reserved
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Auth;
