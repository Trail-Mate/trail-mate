import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useColorScheme } from "../../hooks/useColorScheme";

export default function Signup() {
  const router = useRouter();

  // State variables to manage form inputs and visibility of passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Get color scheme
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;

  // Function to handle user signup
  const handleSignup = async () => {
    // Validate that all fields are filled
    if (!firstname || !lastname || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      // Create a new user with Firebase Authentication
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password
      );
      const user = userCredential.user;

      // Store additional user data in Firestore
      await firestore().collection("users").doc(user.uid).set({
        firstname,
        lastname,
        email,
        emailVerified: false,
        ecoPoints: 0,
      });

      console.log("User created and data saved:", user.uid);

      // Send email verification to the user
      await user.sendEmailVerification();
      alert(
        "Registration successful! A verification email has been sent to your email address."
      );

      // Navigate back to the login screen
      router.back();
    } catch (error) {
      // Handle errors during signup
      if (error instanceof Error) {
        console.error("Error signing up:", error.message);
        alert(error.message); // Show an error message to the user
      } else {
        console.error("Error signing up:", error);
        alert("An unknown error occurred."); // Fallback for unknown error types
      }
    }
  };

  // Function to navigate back to the login screen
  const handleBackToLogin = () => {
    router.back();
  };

  // Toggle visibility of the password field
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle visibility of the confirm password field
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and App Name */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/logo-green.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: theme.primary }]}>Welcome to TrailMate</Text>
        </View>

        {/* Signup Form */}
        <View style={styles.form}>
          {/* First Name Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.borderColor,
                  color: theme.text,
                  backgroundColor: isDarkMode ? Colors.dark.card : 'white'
                }
              ]}
              placeholder="First Name"
              placeholderTextColor={theme.inactive}
              autoCapitalize="words"
              value={firstname}
              onChangeText={setFirstname}
            />
          </View>

          {/* Last Name Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.borderColor,
                  color: theme.text,
                  backgroundColor: isDarkMode ? Colors.dark.card : 'white'
                }
              ]}
              placeholder="Last Name"
              placeholderTextColor={theme.inactive}
              autoCapitalize="words"
              value={lastname}
              onChangeText={setLastname}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.borderColor,
                  color: theme.text,
                  backgroundColor: isDarkMode ? Colors.dark.card : 'white'
                }
              ]}
              placeholder="Email"
              placeholderTextColor={theme.inactive}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password Input with Toggle Visibility */}
          <View style={styles.inputContainer}>
            <View style={[
              styles.passwordContainer,
              {
                borderColor: theme.borderColor,
                backgroundColor: isDarkMode ? Colors.dark.card : 'white'
              }
            ]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.inactive}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={togglePasswordVisibility}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color={theme.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input with Toggle Visibility */}
          <View style={styles.inputContainer}>
            <View style={[
              styles.passwordContainer,
              {
                borderColor: theme.borderColor,
                backgroundColor: isDarkMode ? Colors.dark.card : 'white'
              }
            ]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.text }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.inactive}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={toggleConfirmPasswordVisibility}
              >
                <Feather
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={24}
                  color={theme.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.signupButton, { backgroundColor: theme.buttonBackground }]}
            onPress={handleSignup}
          >
            <Text style={[styles.signupButtonText, { color: theme.buttonText }]}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Footer with Navigation to Login */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={[styles.footerText, { color: theme.inactive }]}>
              Already have an account?{" "}
              <Text style={[styles.loginText, { color: theme.primary }]}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Styles for the Signup screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 100,
    marginBottom: 50,
  },
  logo: {
    width: 70,
    height: 70,
  },
  appName: {
    ...Typography.text.h3,
    marginTop: 20,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 30,
    paddingVertical: 15,
    ...Typography.text.body,
  },
  passwordContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 100,
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 20,
    ...Typography.text.body,
  },
  eyeIcon: {
    paddingRight: 20,
  },
  signupButton: {
    padding: 20,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 10,
  },
  signupButtonText: {
    ...Typography.text.button,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    ...Typography.text.bodySmall,
  },
  loginText: {
    ...Typography.text.link,
    fontWeight: "bold",
  },
});
