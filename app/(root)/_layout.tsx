import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useGlobalContext } from "@/lib/global-provider";
import { useDebugContext } from "@/lib/debug-provider";
import DebugFloatingButton from "@/components/DebugFloatingButton";

export default function AppLayout() {
  const { loading, isLogged } = useGlobalContext();
  const { isDebugVisible } = useDebugContext();

  // Suppression is handled globally in app/_layout.tsx

  if (loading) {
    return (
      <SafeAreaView className="bg-white h-full flex justify-center items-center">
        <ActivityIndicator className="text-primary-300" size="large" />
      </SafeAreaView>
    );
  }

  if (!isLogged) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      {isDebugVisible && <DebugFloatingButton />}
    </View>
  );
}
