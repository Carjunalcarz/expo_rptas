import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PRIMARY_COLOR } from '../constants/colors';
import { useForm, Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { login, getOfflineModeStatus, debugAuthStatus } from "@/lib/auth";
import { useDebugContext } from "@/lib/debug-provider";
// avoid direct router hook usage during render; call router lazily when needed
import { useGlobalContext } from "@/lib/global-provider";

type LoginFormInputs = {
    email: string;
    password: string;
};

const LoginForm: React.FC = () => {
    // router will be required lazily in handlers to avoid missing navigation context
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [offlineStatus, setOfflineStatus] = useState<{ isOffline: boolean; hasCache: boolean }>({ isOffline: false, hasCache: false });
    const [showPassword, setShowPassword] = useState(false);
    const { isDebugVisible } = useDebugContext();

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm<LoginFormInputs>({
        defaultValues: {
            email: "",
            password: ""
        }
    });

    const { refetch, loading, isLogged } = useGlobalContext();

    // Check offline status on component mount
    useEffect(() => {
        const checkOfflineStatus = async () => {
            try {
                const status = await getOfflineModeStatus();
                setOfflineStatus(status);
            } catch (error) {
                console.error("Failed to check offline status:", error);
            }
        };
        
        checkOfflineStatus();
        
        // Check status periodically
        const interval = setInterval(checkOfflineStatus, 10000); // Check every 10 seconds
        
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (data: LoginFormInputs) => {
        try {
            setIsSubmitting(true);
            console.log("🔐 Starting login process...");

            const result = await login(data.email.trim(), data.password);

            if (result) {
                console.log("✅ Login successful, refreshing global context...");

                // Refresh the global context
                await refetch();

                // Navigate to home (guarded)
                console.log("🏠 Redirecting to home...");
                try { const r = require('expo-router'); r?.router?.replace?.('/'); } catch (e) { console.warn('router.replace failed', e); }

            } else {
                Alert.alert("Login Failed", "Invalid email or password. Please try again.");
            }
        } catch (error) {
            console.error("❌ Login error:", error);
            Alert.alert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleGoBack = () => {
        try { const r = require('expo-router'); r?.router?.back?.(); } catch (e) { console.warn('router.back failed', e); }
    };

    // Show loading screen while checking auth
    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text className="mt-4 text-gray-600">Checking authentication...</Text>
            </View>
        );
    }

    // If already logged in, redirect
    if (isLogged) {
        console.log("✅ User already logged in, redirecting...");
    try { const r = require('expo-router'); r?.router?.replace?.('/'); } catch (e) { console.warn('router.replace failed', e); }
        return null;
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={64}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back Arrow */}
                    <TouchableOpacity
                        onPress={handleGoBack}
                        className="mb-6 p-2 self-start"
                        disabled={isSubmitting}
                    >
                        <Ionicons name="arrow-back" size={28} color="#111" />
                    </TouchableOpacity>

            {/* RPTAS Header */}
            <View className="items-center mb-6">
                <View className="bg-blue-600 rounded-full p-4 mb-4">
                    <Ionicons name="business" size={32} color="#ffffff" />
                </View>
                <Text className="text-2xl font-bold text-center text-gray-900 mb-1">
                    Real Property Tax Assessment
                </Text>
                <Text className="text-lg font-semibold text-center text-blue-600 mb-2">
                    Mobile Assessment System
                </Text>
                <Text className="text-sm text-center text-gray-500 mb-2">
                    Municipal Government Portal
                </Text>
                <Text className="text-xs text-center text-gray-400">
                    Authorized Personnel Only
                </Text>
            </View>

            {/* Offline Status Indicator */}
            {offlineStatus.isOffline && (
                <View className={`mb-4 p-3 rounded-lg border ${offlineStatus.hasCache ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                    <Text className={`text-center font-medium ${offlineStatus.hasCache ? 'text-yellow-800' : 'text-red-800'}`}>
                        📱 {offlineStatus.hasCache ? 'Offline Mode Available' : 'No Internet Connection'}
                    </Text>
                    <Text className={`text-center text-sm mt-1 ${offlineStatus.hasCache ? 'text-yellow-700' : 'text-red-700'}`}>
                        {offlineStatus.hasCache 
                            ? 'You can login with cached credentials' 
                            : 'Connect to internet to login for the first time'
                        }
                    </Text>
                </View>
            )}

            {!offlineStatus.isOffline && (
                <View className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Text className="text-green-800 text-center font-medium">
                        🌐 Online Mode
                    </Text>
                    <Text className="text-green-700 text-center text-sm mt-1">
                        Connected to server
                    </Text>
                </View>
            )}

            {/* Login Form */}
            <View className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <Text className="text-lg font-semibold text-gray-800 mb-4 text-center">
                    Assessor Login Portal
                </Text>

                {/* Email Input */}
                <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2 flex-row items-center">
                        <Ionicons name="mail" size={16} color="#6b7280" /> Official Email Address
                    </Text>
                    <Controller
                        control={control}
                        name="email"
                        rules={{
                            required: "Official email is required",
                            pattern: {
                                value: /^\S+@\S+$/i,
                                message: "Please enter a valid email address",
                            },
                        }}
                        render={({ field: { onChange, value, onBlur } }) => (
                            <View className="relative">
                                <TextInput
                                    placeholder="assessor@municipality.gov"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    editable={!isSubmitting}
                                    className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-base pr-10"
                                />
                                <View className="absolute right-3 top-3">
                                    <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                                </View>
                            </View>
                        )}
                    />
                    {errors.email && (
                        <Text className="text-red-500 text-sm mt-1">{errors.email.message}</Text>
                    )}
                </View>

                {/* Password Input */}
                <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2 flex-row items-center">
                        <Ionicons name="lock-closed" size={16} color="#6b7280" /> Secure Password
                    </Text>
                    <Controller
                        control={control}
                        name="password"
                        rules={{
                            required: "Password is required",
                            minLength: {
                                value: 6,
                                message: "Password must be at least 6 characters"
                            }
                        }}
                        render={({ field: { onChange, value, onBlur } }) => (
                            <View className="relative">
                                <TextInput
                                    placeholder="Enter your secure password"
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    editable={!isSubmitting}
                                    className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-base pr-12"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3"
                                    disabled={isSubmitting}
                                >
                                    <Ionicons 
                                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                        size={20} 
                                        color="#6b7280" 
                                    />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                    {errors.password && (
                        <Text className="text-red-500 text-sm mt-1">{errors.password.message}</Text>
                    )}
                </View>

                {/* Login Button */}
                <TouchableOpacity
                    onPress={handleSubmit(handleLogin)}
                    disabled={isSubmitting}
                    className={`rounded-xl py-4 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600'} shadow-md`}
                >
                    {isSubmitting ? (
                        <View className="flex-row justify-center items-center">
                            <ActivityIndicator color="white" size="small" />
                            <Text className="text-white text-lg font-semibold ml-2">
                                Authenticating...
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-row justify-center items-center">
                            <Ionicons name="log-in" size={20} color="white" />
                            <Text className="text-white text-lg font-semibold ml-2">
                                Access RPTAS
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Security & Compliance Info */}
            <View className="mt-4">
                <View className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                    <View className="flex-row items-center mb-1">
                        <Ionicons name="shield-checkmark" size={16} color="#2563eb" />
                        <Text className="text-blue-800 font-medium ml-2 text-sm">Authorized Access Only</Text>
                    </View>
                    <Text className="text-blue-700 text-xs">
                        Restricted to verified assessors and authorized personnel. All access is monitored.
                    </Text>
                </View>

                <View className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <View className="flex-row items-center mb-1">
                        <Ionicons name="information-circle" size={16} color="#d97706" />
                        <Text className="text-amber-800 font-medium ml-2 text-sm">Data Security Notice</Text>
                    </View>
                    <Text className="text-amber-700 text-xs">
                        Property data is confidential. Handle taxpayer information per data protection policies.
                    </Text>
                </View>
            </View>

            {/* Debug Button - Only visible when debug is enabled */}
            {isDebugVisible && (
                <TouchableOpacity
                    onPress={async () => {
                        await debugAuthStatus();
                        Alert.alert("Debug", "Check console for authentication debug information");
                    }}
                    className="mt-4 p-3 bg-gray-100 rounded-lg"
                    disabled={isSubmitting}
                >
                    <Text className="text-gray-700 text-center font-medium">🔍 Debug Auth Status</Text>
                </TouchableOpacity>
            )}

            {/* Footer */}
            <View className="mt-8 items-center">
                <View className="flex-row items-center mb-3">
                    <Ionicons name="business-outline" size={16} color="#9ca3af" />
                    <Text className="text-gray-500 text-sm ml-1">Need access to RPTAS?</Text>
                </View>
                <TouchableOpacity 
                    className="mb-4" 
                    disabled={isSubmitting}
                    onPress={() => {
                        try { 
                            const r = require('expo-router'); 
                            r?.router?.push("/sign-up"); 
                        } catch (e) { 
                            console.warn('router.push failed', e); 
                        }
                    }}
                >
                    <Text className="text-blue-600 font-semibold">Request Assessor Account</Text>
                </TouchableOpacity>
                
                {/* System Info */}
                <View className="items-center border-t border-gray-200 pt-4">
                    <Text className="text-xs text-gray-400 text-center">
                        Real Property Tax Assessment System v2.0
                    </Text>
                    <Text className="text-xs text-gray-400 text-center mt-1">
                        Municipal Government • Secure Access Portal
                    </Text>
                    <View className="flex-row items-center mt-2">
                        <Ionicons name="shield-checkmark-outline" size={12} color="#9ca3af" />
                        <Text className="text-xs text-gray-400 ml-1">SSL Secured Connection</Text>
                    </View>
                </View>
            </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginForm;