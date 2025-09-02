import React from 'react';
import { View, Text } from 'react-native';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Don't log navigation context errors as they are handled gracefully
        if (!error.message.includes("Couldn't find a navigation context")) {
            console.warn('ErrorBoundary caught an error:', error, errorInfo);
        }
    } render() {
        if (this.state.hasError) {
            // For navigation context errors, show a loading state instead of error
            if (this.state.error?.message.includes("Couldn't find a navigation context")) {
                return (
                    <View className="flex-1 items-center justify-center bg-white">
                        <Text className="text-sm text-gray-500">Loading...</Text>
                    </View>
                );
            }
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} />;
            }
            return (
                <View className="flex-1 items-center justify-center bg-white">
                    <Text className="text-sm text-gray-500">Something went wrong</Text>
                    {this.state.error && (
                        <Text className="text-xs text-red-500 mt-2">{this.state.error.message}</Text>
                    )}
                </View>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
