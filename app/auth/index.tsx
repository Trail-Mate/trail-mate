import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "../../hooks/useColorScheme";
import { signInWithGoogle } from '../../services/googleAuth';
import { trackScreen, trackAuthEvent, trackEvent } from '../../services/analyticsService';

// Main authentication screen component
export default function AuthIndex() {
  const router = useRouter(); // Router for navigation
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [email, setEmail] = useState(""); // State to store email input
  const [password, setPassword] = useState(""); // State to store password input
  const { effectiveColorScheme } = useColorScheme();
  const isDarkMode = effectiveColorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;

  // Track screen view
  useEffect(() => {
    trackScreen('auth_signin');
  }, []);

  // Handles user login
  const handleLogin = async () => {
    const trimmedEmail = email.trim(); // Trim whitespace from email
    if (!trimmedEmail || !password) {
      alert("Please enter both email and password."); // Alert if fields are empty
      return;
    }

    console.log("Attempting to log in with email:", email);
    console.log("Password:", password);
  };

  // Handles forgot password
  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      alert("Please enter your email to reset your password.");
      return;
    }

    console.log("Attempting to reset password for email:", email);
  };

  // Navigate to the signup screen
  const handleSignup = () => {
    router.push("/auth/signup");
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Logo and app name */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/logo-green.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: theme.primary }]}>Welcome to Trekteria</Text>
      </View>

      {/* Login form */}
      <View style={styles.form}>
        {/* Email input */}
        {/* <View style={styles.inputContainer}>
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
        </View> */}

        {/* Password input with visibility toggle */}
        {/* <View style={styles.inputContainer}>
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
              secureTextEntry={!showPassword} // Toggle secure text entry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={togglePasswordVisibility}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"} // Icon changes based on visibility
                size={24}
                color={theme.text}
              />
            </TouchableOpacity>
          </View>
        </View> */}

        {/* Login button */}
        {/* <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: theme.buttonBackground }]}
          onPress={handleLogin}
        >
          <Text style={[styles.loginButtonText, { color: theme.buttonText }]}>Log In</Text>
        </TouchableOpacity> */}

        {/* Forgot password link */}
        {/* <TouchableOpacity
          style={styles.forgotPassword}
          onPress={handleForgotPassword}
        >
          <Text style={[styles.forgotPasswordText, { color: theme.text }]}>Forgot your Password?</Text>
        </TouchableOpacity> */}

        {/* Divider for social login */}
        {/* <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: theme.inactive }]} />
          <Text style={[styles.dividerText, { color: theme.inactive }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: theme.inactive }]} />
        </View> */}

        {/* Social login buttons */}
        <TouchableOpacity
          style={[styles.socialButton, { borderColor: theme.borderColor }]}
          onPress={() => {
            trackEvent('google_signin_button_clicked', {
              method: 'google',
              screen: 'auth_signin',
              category: 'authentication'
            });
            signInWithGoogle();
          }}
        >
          <FontAwesome
            name="google"
            size={24}
            color={theme.text}
          />
          <Text style={[styles.socialButtonText, { color: theme.text }]}>Continue with Google</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={[styles.socialButton, { borderColor: theme.borderColor }]}>
          <FontAwesome
            name="apple"
            size={24}
            color={theme.text}
          />
          <Text style={[styles.socialButtonText, { color: theme.text }]}>Continue with Apple</Text>
        </TouchableOpacity> */}

        {/* Registration link */}
        {/* <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: theme.inactive }]}>Not a member? </Text>
          <TouchableOpacity onPress={handleSignup}>
            <Text style={[styles.registerLink, { color: theme.primary }]}>Register now</Text>
          </TouchableOpacity>
        </View> */}
      </View>
    </View>
  );
}

// Handle Firebase authentication errors
const handleFirebaseError = (error: any) => {
  if (error.code === "auth/invalid-email") {
    alert("Invalid email format.");
  } else if (error.code === "auth/invalid-credential") {
    alert("Invalid credentials. Please check your email and password.");
  } else {
    alert(error.message); // Display other error messages
  }
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  buttonContainer: {
    marginBottom: 50,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 30,
    paddingVertical: 20,
    fontSize: 16,
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
    fontSize: 16,
  },
  eyeIcon: {
    paddingRight: 20,
  },
  forgotPassword: {
    alignSelf: "center",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    padding: 20,
    borderRadius: 100,
    alignItems: "center",
    marginBottom: 15,
    marginTop: 20,
  },
  loginButtonText: {
    ...Typography.text.button,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
  },
  socialButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    gap: 10,
    borderWidth: 1,
  },
  socialIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    ...Typography.text.body,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    ...Typography.text.body,
  },
  registerLink: {
    ...Typography.text.body,
  },
});
