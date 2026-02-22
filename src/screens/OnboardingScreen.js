import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    TouchableOpacity,
    Dimensions,
    FlatList,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        image: require('@/assets/onboarding/commute.png'),
        title: 'Reliable Daily Commute',
        description: 'Discover a seamless pick and drop service tailored for your daily routine. Join our community of riders and drivers.',
    },
    {
        id: '2',
        image: require('@/assets/onboarding/scheduling.png'),
        title: 'Flexible Scheduling',
        description: 'Book your ride with multiple stops and flexible departure times. Your commute, your way.',
    },
    {
        id: '3',
        image: require('@/assets/onboarding/safety.png'),
        title: 'Safe & Verified',
        description: 'Travel with peace of mind. All our drivers are verified and rides are monitored for your safety.',
    },
];

const OnboardingScreen = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const flatListRef = useRef();

    const updateCurrentSlideIndex = (e) => {
        const contentOffsetX = e.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(contentOffsetX / width);
        setCurrentSlideIndex(currentIndex);
    };

    const goToNextSlide = () => {
        const nextSlideIndex = currentSlideIndex + 1;
        if (nextSlideIndex < slides.length) {
            const offset = nextSlideIndex * width;
            flatListRef?.current?.scrollToOffset({ offset });
            setCurrentSlideIndex(nextSlideIndex);
        } else {
            finishOnboarding();
        }
    };

    const goToPrevSlide = () => {
        const prevSlideIndex = currentSlideIndex - 1;
        if (prevSlideIndex >= 0) {
            const offset = prevSlideIndex * width;
            flatListRef?.current?.scrollToOffset({ offset });
            setCurrentSlideIndex(prevSlideIndex);
        }
    };

    const finishOnboarding = async () => {
        try {
            await AsyncStorage.setItem('IS_ONBOARDING_COMPLETE', 'true');
            navigation.replace('Root', { screen: 'Register' });
        } catch (error) {
            console.error('Error saving onboarding state:', error);
            navigation.replace('Root', { screen: 'Register' });
        }
    };

    const Slide = ({ item }) => {
        const title = t(`onboarding.slide${item.id}.title`);
        const description = t(`onboarding.slide${item.id}.description`);
        const firstWord = title.split(' ')[0];
        const restOfTitle = title.split(' ').slice(1).join(' ');

        return (
            <View style={styles.slide}>
                <View style={styles.imageContainer}>
                    <Image
                        source={item.image}
                        style={styles.image}
                        resizeMode="cover"
                    />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        {firstWord} <Text style={{ color: theme.colors.primary }}>{restOfTitle}</Text>
                    </Text>
                    <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                        {description}
                    </Text>
                </View>
            </View>
        );
    };

    const Footer = () => {
        return (
            <View style={styles.footer}>
                {/* Paging Indicators */}
                <View style={styles.indicatorContainer}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                {
                                    backgroundColor: currentSlideIndex === index ? theme.colors.primary : theme.colors.border,
                                    width: currentSlideIndex === index ? 30 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Dynamic Button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={goToNextSlide}
                    style={[styles.btn, { backgroundColor: theme.colors.primary }]}
                >
                    <Text style={styles.btnText}>
                        {currentSlideIndex === slides.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')}
                    </Text>
                    <Icon name="arrow-forward" size={20} color="#fff" style={styles.btnIcon} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header Buttons */}
            <View style={styles.header}>
                {currentSlideIndex > 0 ? (
                    <TouchableOpacity onPress={goToPrevSlide} style={[styles.headerBtn, { backgroundColor: theme.colors.border + '40' }]}>
                        <Icon name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 44 }} />
                )}

                <TouchableOpacity onPress={finishOnboarding}>
                    <Text style={[styles.skipText, { color: theme.colors.primary }]}>{t('onboarding.skip')}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                onMomentumScrollEnd={updateCurrentSlideIndex}
                pagingEnabled
                data={slides}
                contentContainerStyle={{ height: height * 0.75 }}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => <Slide item={item} />}
                keyExtractor={(item) => item.id}
            />

            <Footer />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        height: 60,
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
    },
    slide: {
        width: width,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    imageContainer: {
        width: width - 40,
        height: height * 0.45,
        borderRadius: 40,
        overflow: 'hidden',
        marginTop: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        marginTop: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 24,
    },
    footer: {
        height: height * 0.2,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    indicator: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    btn: {
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    btnIcon: {
        marginLeft: 10,
    },
});

export default OnboardingScreen;
