import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import auth from '@react-native-firebase/auth';
import { useColorScheme } from "../../hooks/useColorScheme";
import { useTemperatureUnit } from "../../hooks/useTemperatureUnit";
import { Share } from "react-native";

export default function SettingsPage() {
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { temperatureUnit, setTemperatureUnit } = useTemperatureUnit();
  const isDarkMode = colorScheme === 'dark';
  const [measurementUnit, setMeasurementUnit] = useState("Imperial");
  const [showTemperatureModal, setShowTemperatureModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      router.replace("/auth");
    } catch (error) {
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  // Get the appropriate theme colors
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const handleAppShare = async () => {
    try {
      const result = await Share.share({
        title: "TrailMate - Your Hiking Companion",
        message: "TrailMate is a great hiking companion! Download it here: https://yourappstorelink.com",
        url: "https://yourappstorelink.com", // optional on Android
      });

      // Optional: check result.action to see if shared or dismissed
    } catch (error) {
      console.error("Error sharing app:", error);
    }
  };


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="chevron-back"
              size={28}
              color={theme.text}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, { color: theme.primary }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
        {/* Preferences Section */}
        <Text style={[styles.sectionHeader, { color: theme.text }]}>Preferences</Text>

        {/* Dark Mode Toggle */}
        <View style={[styles.row, { borderBottomColor: theme.borderColor }]}>
          <Text style={[styles.label, { color: theme.text }]}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleColorScheme}
            trackColor={{ false: "#767577", true: Colors.primary }}
            thumbColor="#f4f3f4"
          />
        </View>

        <TouchableOpacity
          style={[styles.row, { borderBottomColor: theme.borderColor }]}
          onPress={() => setShowTemperatureModal(true)}
        >
          <Text style={[styles.label, { color: theme.text }]}>Temperature</Text>
          <View style={styles.valueContainer}>
            <Text style={[styles.value, { color: theme.icon }]}>{temperatureUnit}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.icon} />
          </View>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={[styles.row, { borderBottomColor: theme.borderColor }]}
          onPress={() => setShowUnitModal(true)}
        >
          <Text style={[styles.label, { color: theme.text }]}>Unit</Text>
          <View style={styles.valueContainer}>
            <Text style={[styles.value, { color: theme.icon }]}>{measurementUnit}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.icon} />
          </View>
        </TouchableOpacity> */}

        {/* Account Section */}
        <Text style={[styles.sectionHeader, { color: theme.text }]}>Account</Text>
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: theme.borderColor }]}
          onPress={() => router.push("/(app)/settings/change-name")}
        >
          <Text style={[styles.label, { color: theme.text }]}>Change name</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: theme.borderColor }]}
          onPress={() => router.push("/(app)/settings/change-email")}
        >
          <Text style={[styles.label, { color: theme.text }]}>Change email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: theme.borderColor }]}
          onPress={() => router.push("/(app)/settings/change-password")}
        >
          <Text style={[styles.label, { color: theme.text }]}>Change password</Text>
        </TouchableOpacity>

        {/* Temperature Selection Modal */}
        <Modal
          visible={showTemperatureModal}
          transparent={true}
          animationType="slide"
        >
          <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Temperature Unit</Text>

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  temperatureUnit === "°F" && { backgroundColor: Colors.primary + '20' }
                ]}
                onPress={() => {
                  setTemperatureUnit("°F");
                  setShowTemperatureModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: theme.text }]}>Fahrenheit (°F)</Text>
                {temperatureUnit === "°F" && (
                  <Ionicons name="checkmark" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  temperatureUnit === "°C" && { backgroundColor: Colors.primary + '20' }
                ]}
                onPress={() => {
                  setTemperatureUnit("°C");
                  setShowTemperatureModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: theme.text }]}>Celsius (°C)</Text>
                {temperatureUnit === "°C" && (
                  <Ionicons name="checkmark" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTemperatureModal(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Unit Selection Modal */}
        <Modal
          visible={showUnitModal}
          transparent={true}
          animationType="slide"
        >
          <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Measurement Unit</Text>

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  measurementUnit === "Imperial" && { backgroundColor: Colors.primary + '20' }
                ]}
                onPress={() => {
                  setMeasurementUnit("Imperial");
                  setShowUnitModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: theme.text }]}>Imperial (miles, feet)</Text>
                {measurementUnit === "Imperial" && (
                  <Ionicons name="checkmark" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalOption,
                  measurementUnit === "Metric" && { backgroundColor: Colors.primary + '20' }
                ]}
                onPress={() => {
                  setMeasurementUnit("Metric");
                  setShowUnitModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: theme.text }]}>Metric (kilometers, meters)</Text>
                {measurementUnit === "Metric" && (
                  <Ionicons name="checkmark" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowUnitModal(false)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Support Section */}
        <Text style={[styles.sectionHeader, { color: theme.text }]}>Support</Text>

        {/* Share with friends */}
        {/* <TouchableOpacity
          style={[styles.row, { borderBottomColor: theme.borderColor }]}
          onPress={() => router.push("/result")}
        >
          <Text style={[styles.label, { color: theme.text }]}>Share with friends</Text>
        </TouchableOpacity> */}

        <TouchableOpacity onPress={handleAppShare} style={[styles.row, { borderBottomColor: theme.borderColor }]}>
          <Text style={[styles.label, { color: theme.text }]}>Share TrailMate with Friends</Text>
        </TouchableOpacity>

        {/* Feedback */}
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: theme.borderColor }]}
          onPress={() => router.push("/result")}
        >
          <Text style={[styles.label, { color: theme.text }]}>Feedback</Text>
        </TouchableOpacity>

        {/* Rate the app */}
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: theme.borderColor }]}
          onPress={() => router.push("/result")}
        >
          <Text style={[styles.label, { color: theme.text }]}>Rate on App Store</Text>
        </TouchableOpacity>

        {/* Log Out Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.buttonBackground }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: theme.buttonText }]}>Log Out</Text>
        </TouchableOpacity>

        {/* Footer Version */}
        <Text style={[styles.version, { color: theme.icon }]}>1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    padding: 20,
  },
  container: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    ...Typography.text.h1, // 42px, Montserrat, medium weight
  },
  sectionHeader: {
    ...Typography.text.h2, // 25px, Montserrat
    marginTop: 20,
    marginBottom: 10,
  },
  row: {
    borderBottomWidth: 1,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    ...Typography.text.body, // 16px, OpenSans
  },
  value: {
    ...Typography.text.body, // same as label, but with gray override
  },
  logoutButton: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: "center",
  },
  logoutText: {
    ...Typography.text.button, // 18px, Montserrat, bold
  },
  version: {
    ...Typography.text.caption, // 12px, OpenSans
    textAlign: "center",
    marginTop: 20,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    ...Typography.text.h3,
    marginBottom: 20,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 100,
    marginBottom: 10,
  },
  modalOptionText: {
    ...Typography.text.body,
  },
  modalCloseButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 100,
    backgroundColor: Colors.primary,
  },
  modalCloseText: {
    ...Typography.text.button,
    color: "white",
  },
});
