import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Typography } from "../../constants/Typography";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Trip as FirestoreTrip } from "@/types/Types";
import { useColorScheme } from "../../hooks/useColorScheme";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Define the Trip interface for type safety
interface Trip {
  name: string;
  location: string;
  keyFeatures: string;
  facilities: string;
  latitude?: number;
  longitude?: number;
  id?: string;
  bookmarked?: boolean;
  imageUrl?: string;
}

export default function Result() {
  const router = useRouter();
  const { planId: routePlanId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [parsedTrips, setParsedTrips] = useState<Trip[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const UNSPLASH_ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [summaryValue, errorValue, lastPlanId] = await Promise.all([
          AsyncStorage.getItem("tripSummary"),
          AsyncStorage.getItem("tripError"),
          AsyncStorage.getItem("lastPlanId"),
        ]);

        if (errorValue) {
          setError(errorValue);
          setLoading(false);
          return;
        }

        if (summaryValue) {
          setSummary(summaryValue);
        }

        const targetPlanId = routePlanId ? String(routePlanId) : lastPlanId;

        if (targetPlanId) {
          const user = auth().currentUser;
          if (!user) {
            setError("You must be logged in to view recommendations");
            setLoading(false);
            return;
          }

          const tripsCollection = firestore().collection("trips");
          const tripsQuery = tripsCollection.where("planId", "==", targetPlanId);
          const tripsSnapshot = await tripsQuery.get();

          const firestoreTrips: FirestoreTrip[] = [];
          tripsSnapshot.forEach((doc) => {
            firestoreTrips.push({ id: doc.id, ...doc.data() } as FirestoreTrip);
          });

          const tripsForDisplay = firestoreTrips.map((trip) => ({
            id: trip.id,
            name: trip.name,
            location: trip.location,
            keyFeatures: trip.highlights?.join(", ") || "",
            facilities: trip.amenities?.join(", ") || "",
            latitude: trip.coordinates?.latitude,
            longitude: trip.coordinates?.longitude,
            bookmarked: trip.bookmarked || false,
            imageUrl: trip.imageUrl || ""
          }));

          if (tripsForDisplay.length === 0) {
            setError("No valid trip recommendations found. Please try again.");
          } else {
            setParsedTrips(tripsForDisplay);
          }
        } else {
          setError("No trip recommendations found. Please try again.");
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load recommendations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [routePlanId]);

  const handleClose = () => {
    router.push("/(app)/home");
  };

  const handleRetry = () => {
    AsyncStorage.removeItem("tripError")
      .then(() => {
        router.push("/(app)/preferences");
      })
      .catch((err: any) => console.error("Error clearing error state:", err));
  };

  const handleTripPress = (trip: Trip) => {
    router.push({
      pathname: "/trip",
      params: { trip: JSON.stringify(trip) },
    });
  };

  const handleBookmarkPress = async (trip: Trip, index: number) => {
    try {
      const user = auth().currentUser;
      if (!user) {
        console.error("User must be logged in to bookmark trips");
        return;
      }

      if (!trip.id) {
        console.error("Trip ID is missing");
        return;
      }

      const isCurrentlyBookmarked = trip.bookmarked || false;

      const tripRef = firestore().collection("trips").doc(trip.id);
      await tripRef.update({
        bookmarked: !isCurrentlyBookmarked
      });

      const updatedTrips = [...parsedTrips];
      updatedTrips[index] = {
        ...trip,
        bookmarked: !isCurrentlyBookmarked
      };
      setParsedTrips(updatedTrips);
    } catch (error) {
      console.error("Error updating bookmark status:", error);
    }
  };

  const renderTripCard = (trip: Trip, index: number) => {
    const defaultImage =
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=1000";

    // Use stored imageUrl if available, otherwise use default image
    const backgroundImage = trip.imageUrl || defaultImage;

    return (
      <TouchableOpacity
        key={index}
        style={styles.tripCard}
        onPress={() => handleTripPress(trip)}
      >
        <ImageBackground
          source={{ uri: backgroundImage }}
          style={{ width: "100%", height: "100%", justifyContent: "flex-end" }}
          imageStyle={{ borderRadius: 15 }}
        >
          <View style={styles.cardOverlay}>
            <View style={styles.bookmarkContainer}>
              <TouchableOpacity
                onPress={() => handleBookmarkPress(trip, index)}
              >
                <Ionicons
                  name={trip.bookmarked ? "heart" : "heart-outline"}
                  size={30}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.tripName}>{trip.name}</Text>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={18} color="white" />
                <Text style={styles.detailText}>{trip.location}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="leaf-outline" size={18} color="white" />
                <Text style={styles.detailText}>{trip.keyFeatures}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color="white"
                />
                <Text style={styles.detailText}>{trip.facilities}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={40} color={theme.text} />
        </TouchableOpacity>

        {routePlanId ? (
          <>
            <Text style={[styles.title, { color: theme.primary }]}>Your Saved Trip</Text>
            <Text style={[styles.secondTitle, { color: theme.primary }]}>Trip Details</Text>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: theme.primary }]}>Handpicked for you -</Text>
            <Text style={[styles.secondTitle, { color: theme.primary }]}>Select Your Trip!</Text>
          </>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.icon }]}>
                Loading your trip recommendations...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={handleRetry}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : parsedTrips.length > 0 ? (
            <View style={styles.tripsContainer}>
              {parsedTrips.map(renderTripCard)}
            </View>
          ) : summary ? (
            <View style={[styles.section, { backgroundColor: isDarkMode ? '#2C2C2C' : '#f5f5f5' }]}>
              <Text style={[styles.summaryText, { color: theme.text }]}>{summary}</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  closeButton: {
    zIndex: 10,
    marginBottom: 20,
  },
  title: {
    ...Typography.text.h2,
    marginBottom: 5,
    textAlign: "left",
  },
  secondTitle: {
    ...Typography.text.h1,
    fontWeight: "thin",
    textAlign: "left",
  },
  section: {
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    ...Typography.text.h3,
    marginBottom: 10,
  },
  text: {
    ...Typography.text.body,
    lineHeight: 22,
  },
  summaryText: {
    ...Typography.text.body,
    lineHeight: 24,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    ...Typography.text.body,
    marginTop: 10,
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    ...Typography.text.body,
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.text.button,
    color: "white",
  },
  tripsContainer: {
    marginBottom: 30,
  },
  tripCard: {
    marginBottom: 10,
    borderRadius: 20,
    overflow: "hidden",
    height: 210,
    elevation: 4,
  },
  cardOverlay: {
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    position: "relative",
  },
  bookmarkContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
    borderRadius: 10,
    zIndex: 10,
  },
  tripName: {
    ...Typography.text.h2,
    color: "white",
  },
  detailsContainer: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
    gap: 5,
  },
  detailText: {
    ...Typography.text.body,
    color: "white",
    fontSize: 14,
    marginLeft: 10,
  },
  dateContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    zIndex: 10,
  },
  dateText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
});
