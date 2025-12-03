import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const dot1Anim = useRef(new Animated.Value(0.7)).current;
  const dot2Anim = useRef(new Animated.Value(0.7)).current;
  const dot3Anim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Start main animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false, // Disabled to avoid native module warning
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: false, // Disabled to avoid native module warning
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false, // Disabled to avoid native module warning
      }),
    ]).start();

    // Animate loading dots
    const createDotAnimation = (animValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false, // Disabled to avoid native module warning
          }),
          Animated.timing(animValue, {
            toValue: 0.7,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false, // Disabled to avoid native module warning
          }),
        ])
      );
    };

    createDotAnimation(dot1Anim, 0).start();
    createDotAnimation(dot2Anim, 200).start();
    createDotAnimation(dot3Anim, 400).start();

    // Hide splash screen after animation
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, slideAnim, dot1Anim, dot2Anim, dot3Anim, onFinish]);

  return (
    <LinearGradient
      colors={['#7e246c', '#9d2d7f', '#7e246c']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        {/* Logo Icon - Car with Location Pin */}
        <View style={styles.logoContainer}>
          <View style={styles.iconWrapper}>
            <Icon name="location-on" size={32} color="#FFFFFF" style={styles.locationIcon} />
            <Icon name="directions-car" size={60} color="#FFFFFF" style={styles.carIcon} />
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>AsaanCar</Text>
        
        {/* Tagline */}
        <Text style={styles.tagline}>Pakistan's Trusted Car Rental Service</Text>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingDot, { opacity: dot1Anim }]} />
          <Animated.View style={[styles.loadingDot, { opacity: dot2Anim }]} />
          <Animated.View style={[styles.loadingDot, { opacity: dot3Anim }]} />
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 30,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIcon: {
    position: 'absolute',
    top: -10,
    zIndex: 1,
  },
  carIcon: {
    marginTop: 10,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 5,
  },
});

export default SplashScreen;

