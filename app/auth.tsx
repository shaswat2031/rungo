import { BASE_API_URL } from '@/constants/Config';
import { getUserStats, saveToken, saveUserStats } from '@/utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';

export default function AuthScreen() {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleAuth = async () => {
        if (!email || !password || (isRegister && (!username || !confirmPassword))) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (isRegister && password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            console.log(`🚀 Sending ${isRegister ? 'Register' : 'Login'} request to: ${BASE_API_URL}${endpoint}`);

            const payload = isRegister
                ? { username, email, password }
                : { email, password };

            const response = await fetch(`${BASE_API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            // Save token and user info
            if (data.token) {
                await saveToken(data.token);
                const currentStats = await getUserStats();
                await saveUserStats({
                    ...currentStats,
                    userId: data.user.userId,
                    username: data.user.username,
                    email: data.user.email,
                    isLoggedIn: true,
                    token: data.token
                });

                router.replace('/(tabs)');
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#050505', '#121212', '#0A0A0A']}
                style={styles.gradient}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Image
                                source={require('../assets/images/logo.png')}
                                style={styles.logoImage}
                            />
                        </View>
                        <Text style={styles.appName}>StrideRealm</Text>
                        <Text style={styles.tagline}>CONQUER YOUR CITY</Text>

                        {/* Render Server Notice */}
                        <Animated.View entering={FadeInDown.delay(300)} style={styles.serverNotice}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.serverNoticeText}>
                                Server starting on Render... (Wait 1-2 min for active testing)
                            </Text>
                        </Animated.View>
                    </Animated.View>

                    <Animated.View
                        layout={Layout.springify()}
                        entering={FadeInDown.delay(400).duration(800)}
                        style={styles.formCard}
                    >
                        <Text style={styles.formTitle}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>

                        <View style={styles.form}>
                            {isRegister && (
                                <Animated.View entering={FadeInDown} style={styles.inputContainer}>
                                    <User size={20} color="#888" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Username"
                                        placeholderTextColor="#666"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </Animated.View>
                            )}

                            <View style={styles.inputContainer}>
                                <Mail size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor="#666"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Lock size={20} color="#888" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#666"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={20} color="#888" /> : <Eye size={20} color="#888" />}
                                </TouchableOpacity>
                            </View>

                            {isRegister && (
                                <Animated.View entering={FadeInDown} style={styles.inputContainer}>
                                    <Lock size={20} color="#888" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#666"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                </Animated.View>
                            )}

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleAuth}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? 'Processing...' : (isRegister ? 'Join the Realm' : 'Enter Realm')}
                                </Text>
                                {!loading && <ArrowRight size={20} color="#000" />}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => setIsRegister(!isRegister)}
                            >
                                <Text style={styles.toggleText}>
                                    {isRegister ? 'Already have an account? ' : 'New to RunRealm? '}
                                    <Text style={styles.toggleTextHighlight}>
                                        {isRegister ? 'Login' : 'Register Now'}
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    <Text style={styles.footer}>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </Text>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 25,
        paddingTop: 60,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 15,
        shadowColor: '#FFCB00',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        backgroundColor: '#000',
        borderWidth: 2,
        borderColor: '#FFCB00',
    },
    logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    appName: {
        color: '#FFF',
        fontSize: 38,
        fontWeight: '900',
        letterSpacing: 3,
        textShadowColor: 'rgba(255, 203, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    tagline: {
        color: '#FFCB00',
        fontSize: 14,
        fontWeight: '800',
        marginTop: 5,
        letterSpacing: 5,
        opacity: 0.8,
    },
    serverNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 77, 0, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 77, 0, 0.2)',
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF4D00',
        marginRight: 8,
    },
    serverNoticeText: {
        color: '#FF4D00',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    formCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 24,
        padding: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    formTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 25,
        textAlign: 'center',
    },
    form: {
        gap: 18,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        height: 64,
        paddingHorizontal: 18,
    },
    inputIcon: {
        marginRight: 15,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    button: {
        height: 64,
        backgroundColor: '#FFCB00',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 10,
        elevation: 8,
        shadowColor: '#FFCB00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
        backgroundColor: '#444',
    },
    buttonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '900',
    },
    toggleButton: {
        marginTop: 10,
        alignItems: 'center',
    },
    toggleText: {
        color: '#888',
        fontSize: 15,
        fontWeight: '500',
    },
    toggleTextHighlight: {
        color: '#FFCB00',
        fontWeight: '800',
    },
    footer: {
        color: '#444',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 30,
        lineHeight: 18,
        paddingHorizontal: 20,
    }
});
