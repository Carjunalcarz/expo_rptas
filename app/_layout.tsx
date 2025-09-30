import { useEffect, useState } from "react";
import { LogBox, View, ActivityIndicator, Text, Image } from 'react-native';
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import "./global.css";
import GlobalProvider from "@/lib/global-provider";
import { DebugProvider } from "@/lib/debug-provider";

// Suppress navigation context warnings globally
LogBox.ignoreLogs(["Couldn't find a navigation context"]);
export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
    "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
    "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
    "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
    "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
    "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();
        
        // Pre-load fonts, make any API calls you need to do here
        // Add a small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      // Hide the splash screen once the app is ready
      SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#ffffff', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Image 
          source={require('../assets/images/icon.png')}
          style={{
            width: 180,
            height: 180,
            marginBottom: 30
          }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ 
          marginTop: 20, 
          fontSize: 16, 
          color: '#666',
          fontFamily: 'Rubik-Medium' 
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <GlobalProvider>
      <DebugProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </DebugProvider>
    </GlobalProvider>
  );
}
