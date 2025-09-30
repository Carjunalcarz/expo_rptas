import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PRIMARY_COLOR } from '../constants/colors';
import { useForm, Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { registerUser } from "@/lib/auth";
import { useGlobalContext } from "@/lib/global-provider";

type SignUpFormInputs = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

const SignUpForm: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { refetch } = useGlobalContext();

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        reset
    } = useForm<SignUpFormInputs>({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
        }
    });

    const password = watch("password");

    const handleSignUp = async (data: SignUpFormInputs) => {
        try {
            setIsSubmitting(true);
            console.log("📝 Starting registration process...");

            const result = await registerUser(data.email.trim(), data.password, data.name.trim());

            if (result) {
                console.log("✅ Registration successful");
                
                // Show success message
                Alert.alert(
                    "Registration Successful", 
                    "Your account has been created successfully! Please wait for an administrator to verify your account before you can login.",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                // Navigate back to sign-in
                                try { 
                                    const r = require('expo-router'); 
                                    r?.router?.replace?.('/sign-in'); 
                                } catch (e) { 
                                    console.warn('router.replace failed', e); 
                                }
                            }
                        }
                    ]
                );

                // Clear form
                reset();
            }
        } catch (error) {
            console.error("❌ Registration error:", error);
            Alert.alert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoBack = () => {
        try { const r = require('expo-router'); r?.router?.back?.(); } catch (e) { console.warn('router.back failed', e); }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={64}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 px-6 pt-4">
                        {/* Back Arrow */}
                        <TouchableOpacity
                            onPress={handleGoBack}
                            className="mb-6 p-2 self-start"
                            disabled={isSubmitting}
                        >
                            <Ionicons name="arrow-back" size={28} color="#111" />
                        </TouchableOpacity>

                        {/* RPTAS Header */}
                        <View className="items-center mb-8">
                            <View className="bg-blue-600 rounded-full p-4 mb-4">
                                <Ionicons name="person-add" size={32} color="#ffffff" />
                            </View>
                            <Text className="text-2xl font-bold text-center text-gray-900 mb-1">
                                RPTAS Account Request
                            </Text>
                            <Text className="text-lg font-semibold text-center text-blue-600 mb-2">
                                Municipal Assessor Registration
                            </Text>
                            <Text className="text-sm text-center text-gray-500">
                                Request access to the Real Property Tax Assessment System
                            </Text>
                        </View>

                        {/* Name Input */}
                        <Text className="text-gray-700 font-medium mb-2">Full Name</Text>
                        <Controller
                            control={control}
                            name="name"
                            rules={{
                                required: "Full name is required",
                                minLength: {
                                    value: 2,
                                    message: "Name must be at least 2 characters"
                                }
                            }}
                            render={({ field: { onChange, value, onBlur } }) => (
                                <TextInput
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize="words"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    editable={!isSubmitting}
                                    className="border border-gray-300 rounded-xl px-4 py-3 mb-3 bg-gray-50 text-base"
                                />
                            )}
                        />
                        {errors.name && (
                            <Text className="text-red-500 mb-2">{errors.name.message}</Text>
                        )}

                        {/* Email Input */}
                        <Text className="text-gray-700 font-medium mb-2">Email Address</Text>
                        <Controller
                            control={control}
                            name="email"
                            rules={{
                                required: "Email is required",
                                pattern: {
                                    value: /^\S+@\S+\.\S+$/i,
                                    message: "Invalid email address",
                                },
                            }}
                            render={({ field: { onChange, value, onBlur } }) => (
                                <TextInput
                                    placeholder="Enter your email"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    editable={!isSubmitting}
                                    className="border border-gray-300 rounded-xl px-4 py-3 mb-3 bg-gray-50 text-base"
                                />
                            )}
                        />
                        {errors.email && (
                            <Text className="text-red-500 mb-2">{errors.email.message}</Text>
                        )}

                        {/* Password Input */}
                        <Text className="text-gray-700 font-medium mb-2">Password</Text>
                        <Controller
                            control={control}
                            name="password"
                            rules={{
                                required: "Password is required",
                                minLength: {
                                    value: 8,
                                    message: "Password must be at least 8 characters"
                                },
                                pattern: {
                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                    message: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
                                }
                            }}
                            render={({ field: { onChange, value, onBlur } }) => (
                                <TextInput
                                    placeholder="Enter your password"
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry
                                    autoCapitalize="none"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    editable={!isSubmitting}
                                    className="border border-gray-300 rounded-xl px-4 py-3 mb-3 bg-gray-50 text-base"
                                />
                            )}
                        />
                        {errors.password && (
                            <Text className="text-red-500 mb-2">{errors.password.message}</Text>
                        )}

                        {/* Confirm Password Input */}
                        <Text className="text-gray-700 font-medium mb-2">Confirm Password</Text>
                        <Controller
                            control={control}
                            name="confirmPassword"
                            rules={{
                                required: "Please confirm your password",
                                validate: (value) => value === password || "Passwords do not match"
                            }}
                            render={({ field: { onChange, value, onBlur } }) => (
                                <TextInput
                                    placeholder="Confirm your password"
                                    placeholderTextColor="#9ca3af"
                                    secureTextEntry
                                    autoCapitalize="none"
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    editable={!isSubmitting}
                                    className="border border-gray-300 rounded-xl px-4 py-3 mb-3 bg-gray-50 text-base"
                                />
                            )}
                        />
                        {errors.confirmPassword && (
                            <Text className="text-red-500 mb-2">{errors.confirmPassword.message}</Text>
                        )}

                        {/* Sign Up Button */}
                        <TouchableOpacity
                            onPress={handleSubmit(handleSignUp)}
                            disabled={isSubmitting}
                            className={`rounded-xl py-4 mt-6 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600'}`}
                        >
                            {isSubmitting ? (
                                <View className="flex-row justify-center items-center">
                                    <ActivityIndicator color="white" size="small" />
                                    <Text className="text-white text-lg font-semibold ml-2">
                                        Creating Account...
                                    </Text>
                                </View>
                            ) : (
                                <Text className="text-white text-lg font-semibold text-center">
                                    Create Account
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Info Box */}
                        <View className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <Text className="text-yellow-800 font-medium mb-2">📋 Account Verification Required</Text>
                            <Text className="text-yellow-700 text-sm">
                                After creating your account, please wait for an administrator to verify your account before you can login to the RPTAS system.
                            </Text>
                        </View>

                        {/* Footer */}
                        <View className="mt-6 mb-8 items-center">
                            <Text className="text-gray-500">Already have an account?</Text>
                            <TouchableOpacity 
                                className="mt-1" 
                                disabled={isSubmitting}
                                onPress={() => {
                                    try { 
                                        const r = require('expo-router'); 
                                        r?.router?.push("/local_sign-in"); 
                                    } catch (e) { 
                                        console.warn('router.push failed', e); 
                                    }
                                }}
                            >
                                <Text className="text-blue-600 font-medium">Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignUpForm;
