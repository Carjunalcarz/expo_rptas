import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { PRIMARY_COLOR } from '../constants/colors';
import { useForm, Controller } from "react-hook-form";
import { ArrowLeft } from "lucide-react-native";
import { login } from "@/lib/auth";
import { useRouter } from "expo-router";
import { useGlobalContext } from "@/lib/global-provider";

type LoginFormInputs = {
    email: string;
    password: string;
};

const LoginForm: React.FC = () => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleLogin = async (data: LoginFormInputs) => {
        try {
            setIsSubmitting(true);
            console.log("🔐 Starting login process...");

            const result = await login(data.email.trim(), data.password);

            if (result) {
                console.log("✅ Login successful, refreshing global context...");

                // Refresh the global context
                await refetch();

                // Navigate to home
                console.log("🏠 Redirecting to home...");
                router.replace("/");

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

    const fillDemoCredentials = () => {
        setValue("email", "user@example.com");
        setValue("password", "password");
    };

    const handleGoBack = () => {
        router.back();
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
        router.replace("/");
        return null;
    }

    return (
        <View className="flex-1 justify-center px-6 bg-white">
            {/* Back Arrow */}
            <TouchableOpacity
                onPress={handleGoBack}
                className="absolute top-12 left-6 p-2"
                disabled={isSubmitting}
            >
                <ArrowLeft size={28} color="#111" />
            </TouchableOpacity>

            <Text className="text-3xl font-bold text-center text-gray-900 mb-2">
                Welcome Back 👋
            </Text>
            <Text className="text-base text-center text-gray-500 mb-8">
                Login to continue (Offline Mode)
            </Text>

            {/* Demo Credentials Helper */}
            <TouchableOpacity
                onPress={fillDemoCredentials}
                className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
                disabled={isSubmitting}
            >
                <Text className="text-blue-600 text-center font-medium">
                    📋 Tap to fill demo credentials
                </Text>
                <Text className="text-blue-500 text-center text-sm mt-1">
                    user@example.com / password
                </Text>
            </TouchableOpacity>

            {/* Email Input */}
            <Controller
                control={control}
                name="email"
                rules={{
                    required: "Email is required",
                    pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Invalid email address",
                    },
                }}
                render={({ field: { onChange, value, onBlur } }) => (
                    <TextInput
                        placeholder="Email"
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
            <Controller
                control={control}
                name="password"
                rules={{
                    required: "Password is required",
                    minLength: {
                        value: 3,
                        message: "Password must be at least 3 characters"
                    }
                }}
                render={({ field: { onChange, value, onBlur } }) => (
                    <TextInput
                        placeholder="Password"
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

            {/* Login Button */}
            <TouchableOpacity
                onPress={handleSubmit(handleLogin)}
                disabled={isSubmitting}
                className={`rounded-xl py-3 mt-4 ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600'
                    }`}
            >
                {isSubmitting ? (
                    <View className="flex-row justify-center items-center">
                        <ActivityIndicator color="white" size="small" />
                        <Text className="text-white text-lg font-semibold ml-2">
                            Logging in...
                        </Text>
                    </View>
                ) : (
                    <Text className="text-white text-lg font-semibold text-center">
                        Login
                    </Text>
                )}
            </TouchableOpacity>

            {/* Debug Info */}
            <View className="mt-6 p-4 bg-gray-50 rounded-lg">
                <Text className="text-gray-700 font-medium mb-2">📱 Available Demo Accounts:</Text>
                <Text className="text-gray-600 text-sm">• user@example.com / password</Text>
                <Text className="text-gray-600 text-sm">• user2@example.com / password2</Text>
                <Text className="text-gray-600 text-sm">• admin@example.com / admin123</Text>
            </View>

            {/* Footer */}
            <View className="mt-6 items-center">
                <TouchableOpacity disabled={isSubmitting}>
                    <Text className="text-gray-500">Forgot password?</Text>
                </TouchableOpacity>
                <TouchableOpacity className="mt-1" disabled={isSubmitting}>
                    <Text className="text-blue-600">Create an account</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default LoginForm;