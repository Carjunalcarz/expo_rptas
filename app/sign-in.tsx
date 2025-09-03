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
          <View className="flex-1 px-10 p-10">
            <Image
              source={images.onboarding}
              style={{ width: "100%", height: "60%" }}
              resizeMode="contain"
            />

            <Text className="text-base text-center uppercase font-rubik text-black-200 mt-4">
              Welcome To Real Scout
            </Text>

            <Text className="text-3xl font-rubik-bold text-black-300 text-center mt-2">
              Let's Get You Closer To {"\n"}
              <Text className="text-primary-300">Your Ideal Home</Text>
            </Text>

            <Text className="text-lg font-rubik text-black-200 text-center mt-12">
              Login to Real Scout
            </Text>

            {/* Local Sign-in */}
            <TouchableOpacity
              onPress={() => { try { const r = require('expo-router'); r?.router?.push("/local_sign-in"); } catch (e) { console.warn('router.push failed', e); } }}
              className="bg-primary-300 shadow-md shadow-zinc-300 rounded-full w-full py-4 mt-5"
              activeOpacity={0.8}
            >
              <Text className="text-lg text-white font-rubik-medium text-center">
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Auth;
