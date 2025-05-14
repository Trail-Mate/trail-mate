import { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Image, Animated } from "react-native";
import { Redirect } from "expo-router";
import { Colors } from "../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from '@react-native-firebase/auth';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;
    let authUnsubscribe: (() => void) | null = null;

    // Check if user is logged in via Firebase
    const checkLoginStatus = async () => {
      try {
        // Check onboarding status
        const onboardingStatus = await AsyncStorage.getItem(
          "hasCompletedOnboarding"
        );
        if (onboardingStatus === "true" && isMounted) {
          setHasCompletedOnboarding(true);
        }

        // Set up Firebase auth listener
        authUnsubscribe = auth().onAuthStateChanged((user) => {
          if (isMounted) {
            setIsLoggedIn(!!user);
            console.log("User is logged in:", !!user);
          }
        });
      } catch (error) {
        console.error("Failed to get login status:", error);
        if (isMounted) {
          setIsLoggedIn(false);
        }
      }
    };

    // Run login check and splash screen animation
    const setupApp = async () => {
      await checkLoginStatus();

      // Start with a delay before beginning the fade out
      const delayTimer = setTimeout(() => {
        if (!isMounted) return;

        // Fade out animation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500, // Shorter duration of fade out in milliseconds
          useNativeDriver: true,
        }).start(() => {
          // Set ready state after animation completes
          if (isMounted) {
            setIsReady(true);
          }
        });
      }, 1500); // Show splash for 1.5 seconds before starting fade

      return () => {
        clearTimeout(delayTimer);
        if (authUnsubscribe) authUnsubscribe();
      };
    };

    setupApp();

    // Cleanup function
    return () => {
      isMounted = false;
      if (authUnsubscribe) authUnsubscribe();
    };
  }, [fadeAnim]);

  // Show splash screen until ready
  if (!isReady) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Image
          source={require("../assets/images/logo-white.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    );
  }

  // Redirect based on login status and onboarding completion
  if (isLoggedIn) {
    // User is logged in - go to home
    return <Redirect href="/(app)/home" />;
  } else if (hasCompletedOnboarding) {
    // User has completed onboarding but is not logged in - go to auth
    return <Redirect href="/auth" />;
  } else {
    // First time user - go to onboarding
    return <Redirect href="/onboarding" />;
  }
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 80,
    height: 80,
  },
});
