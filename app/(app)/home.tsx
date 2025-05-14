import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  Animated,
  Easing,
  Alert,
  BackHandler,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Colors } from "../../constants/Colors";
import { Typography } from "../../constants/Typography";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState, useEffect, useRef } from "react";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import { Plan as PlanType, Trip as TripType } from "../../types/Types";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "../../hooks/useColorScheme";
import { deleteCachedTrailData, deleteCachedChatMessages } from '../../services/cacheService';

// Define types for the data
interface Trip extends TripType {
  image: string;
}

// Extend Plan type to include the image we'll add
interface Plan extends PlanType {
  image: string;
}

// Placeholder image for plans and trips
const placeholderImage =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop";

// --- Reusable Jiggle Animation Hook ---
const useJiggleAnimation = (isEditing: boolean, maxDelayMs: number = 0) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animationSequence: Animated.CompositeAnimation | null = null;
    let isMounted = true; // Helper to prevent state updates on unmounted component

    if (isEditing) {
      const calculatedDelay = maxDelayMs > 0 ? Math.random() * maxDelayMs : 0;

      // Sequence: Delay -> Loop
      animationSequence = Animated.sequence([
        Animated.delay(calculatedDelay), // Apply the random delay first
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotation, {
              toValue: 1.5,
              duration: 150,
              useNativeDriver: true,
              easing: Easing.out(Easing.ease),
            }),
            Animated.timing(rotation, {
              toValue: -1.5,
              duration: 150,
              useNativeDriver: true,
              easing: Easing.out(Easing.ease),
            }),
            // Add rotation back to 0 for smoother elastic loop
            Animated.timing(rotation, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
          ])
        ),
      ]);
      animationSequence.start();
    } else {
      // Stop any existing animation and reset smoothly
      rotation.stopAnimation(() => {
        // Check if component is still mounted and not editing before resetting
        if (isMounted && !isEditing) {
          Animated.timing(rotation, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
            easing: Easing.ease,
          }).start();
        }
      });
    }

    // Cleanup function to stop animation on unmount or when isEditing becomes false
    return () => {
      isMounted = false;
      animationSequence?.stop(); // Stop the sequence (delay or loop)
      rotation.stopAnimation(); // Ensure rotation itself stops
    };
  }, [isEditing, rotation]);

  const animatedStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [-1, 1],
          outputRange: ["-1deg", "1deg"],
        }),
      },
    ],
  };

  return animatedStyle;
};

// --- TripBox Component ---
interface TripBoxProps {
  item: Trip;
  tripDate: string;
  isEditing: boolean;
  onPress: (item: Trip) => void;
  onDelete: (id: string) => void;
  animationDelay?: number;
  theme: any;
}

const TripBox: React.FC<TripBoxProps> = ({
  item,
  tripDate,
  isEditing,
  onPress,
  onDelete,
  animationDelay = 0,
  theme,
}) => {
  const animatedStyle = useJiggleAnimation(isEditing, animationDelay);

  let dateText = "No date";
  if (tripDate) {
    try {
      const dateObj = new Date(tripDate);
      dateText = dateObj.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      dateText = tripDate; // Fallback to the raw date string if parsing fails
    }
  }

  return (
    <Animated.View style={[styles.animatedBox, animatedStyle]}>
      {isEditing && (
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.background }]}
          onPress={() => item.id && onDelete(item.id)}
        >
          <Ionicons name="remove-outline" size={28} color={theme.text} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.planBox}
        onPress={() => onPress(item)}
        disabled={isEditing}
      >
        <Image source={{ uri: item.image }} style={styles.planImage} />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.3)", "rgba(0,0,0,1)"]}
          style={styles.planOverlay}
          locations={[0, 0.4, 1]}
        />
        <View style={[styles.dateContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.dateText, { color: theme.text }]}>{dateText}</Text>
        </View>
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{item.name}</Text>
          <View style={styles.planMetaRow}>
            <Text style={styles.planDetails}>{item.location}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- PlanBox Component ---
interface PlanBoxProps {
  item: Plan;
  isEditing: boolean;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
  animationDelay?: number;
  theme: any;
}

const PlanBox: React.FC<PlanBoxProps> = ({
  item,
  isEditing,
  onPress,
  onDelete,
  animationDelay = 0,
  theme,
}) => {
  const animatedStyle = useJiggleAnimation(isEditing, animationDelay);

  const location = item.preferences?.location || "No location";
  let dateText = "No date";
  if (item.preferences?.dateRange?.startDate) {
    try {
      const dateObj = new Date(item.preferences.dateRange.startDate);
      dateText = dateObj.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      dateText = item.preferences.dateRange.startDate; // Fallback
    }
  }

  return (
    <Animated.View style={[styles.animatedBox, animatedStyle]}>
      {isEditing && (
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.background }]}
          onPress={() => item.id && onDelete(item.id)}
        >
          <Ionicons name="remove-outline" size={28} color={theme.text} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.planBox}
        onPress={() => onPress(item.id || "")}
        disabled={isEditing}
      >
        <Image source={{ uri: item.image }} style={styles.planImage} />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.3)", "rgba(0,0,0,1)"]}
          style={styles.planOverlay}
          locations={[0, 0.5, 1]}
        />
        <View style={[styles.dateContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.dateText, { color: theme.text }]}>{dateText}</Text>
        </View>
        <View style={styles.planInfo}>
          <View style={styles.planMetaRow}>
            <Text style={styles.planLocation}>{location}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- Home Screen Component ---
export default function Home() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [userName, setUserName] = useState("");
  const [ecoPoints, setEcoPoints] = useState(0); // Add state for eco points
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripDates, setTripDates] = useState<{ [tripId: string]: string }>({});
  const [isPlansEditing, setIsPlansEditing] = useState(false);
  const [isTripsEditing, setIsTripsEditing] = useState(false);

  const handleTripPress = (trip: Trip) => {
    router.push({
      pathname: "/(app)/trip",
      params: {
        trip: JSON.stringify({
          id: trip.id,
          name: trip.name,
          location: trip.location,
          keyFeatures: trip.highlights?.join(", ") || "",
          facilities: trip.amenities?.join(", ") || "",
          latitude: trip.coordinates?.latitude,
          longitude: trip.coordinates?.longitude,
          bookmarked: trip.bookmarked || false,
        }),
      },
    });
  };

  // Replace fetchUserName with fetchUserData
  const fetchUserData = async () => {
    const user = auth().currentUser;
    if (user) {
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserName(userData?.firstname || '');
        // Get eco points from Firestore
        const pointsValue = userData?.ecoPoints !== undefined ? userData.ecoPoints : 0;
        setEcoPoints(pointsValue);
      }
    }
  };

  const fetchPlans = async () => {
    try {
      const user = auth().currentUser;
      if (user) {
        const plansSnapshot = await firestore()
          .collection('plans')
          .where('userId', '==', user.uid)
          .get();
        const plansList = plansSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          image: doc.data().imageUrl || placeholderImage,
        })) as Plan[];
        // Sort plans by date (newest first)
        const sortedPlans = plansList.sort((a, b) => {
          const dateA = a.preferences?.dateRange?.startDate
            ? new Date(a.preferences.dateRange.startDate).getTime()
            : 0;
          const dateB = b.preferences?.dateRange?.startDate
            ? new Date(b.preferences.dateRange.startDate).getTime()
            : 0;
          return dateB - dateA;
        });
        setPlans(sortedPlans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchTrips = async () => {
    try {
      const user = auth().currentUser;
      if (user) {
        // Fetch trips that are bookmarked AND belong to the current user
        const tripsSnapshot = await firestore()
          .collection('trips')
          .where('bookmarked', '==', true)
          .where('userId', '==', user.uid)
          .get();
        const tripsList = tripsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          image: doc.data().imageUrl || placeholderImage,
        })) as Trip[];
        // Fetch dates for trips from plans collection
        const dates: { [tripId: string]: string } = {};
        const plansSnapshot = await firestore()
          .collection('plans')
          .where('userId', '==', user.uid)
          .get();
        plansSnapshot.docs.forEach((planDoc) => {
          const planData = planDoc.data();
          if (planData.tripIds && planData.preferences?.dateRange?.startDate) {
            planData.tripIds.forEach((tripId: string) => {
              dates[tripId] = planData.preferences.dateRange.startDate;
            });
          }
        });
        setTripDates(dates);
        // Sort trips by date (newest first)
        const sortedTrips = tripsList.sort((a, b) => {
          const dateA = dates[a.id || ''] ? new Date(dates[a.id || '']).getTime() : 0;
          const dateB = dates[b.id || ''] ? new Date(dates[b.id || '']).getTime() : 0;
          return dateB - dateA;
        });
        setTrips(sortedTrips);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      console.error('Error fetching plans:', error);
    }
  };

  // Update the useFocusEffect to use fetchUserData instead of fetchUserName
  useFocusEffect(
    useCallback(() => {
      fetchUserData(); // Replace fetchUserName with fetchUserData
      fetchTrips();
      fetchPlans();
      // Reset edit modes when screen focuses
      setIsPlansEditing(false);
      setIsTripsEditing(false);
    }, [])
  );

  const goToSettings = () => router.push("/(app)/settings");
  const goToTripPlanning = () => router.push("/(app)/preferences");
  const goToTrip = (id: string) =>
    router.push({
      pathname: "/(app)/result",
      params: { planId: id },
    });

  // --- Deletion Handlers ---
  const handleDeleteTrip = async (tripId: string) => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete only the trip document
              await firestore().collection('trips').doc(tripId).delete();
              // Update local trips state
              setTrips((prevTrips) => prevTrips.filter((trip) => trip.id !== tripId));
            } catch (error) {
              console.error('Error deleting trip:', error);
              Alert.alert('Error', 'Could not delete trip.');
            }
          },
        },
      ]
    );
  };

  // --- Plan Deletion Handler ---
  const handleDeletePlan = async (planId: string) => {
    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this plan and its associated trips? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Fetch the plan document to get tripIds
              const planDocRef = firestore().collection('plans').doc(planId);
              const planDocSnap = await planDocRef.get();
              if (planDocSnap.exists()) {
                const planData = planDocSnap.data();
                const tripIdsToDelete = planData?.tripIds as string[] | undefined;
                // 2. Delete associated trips if they exist
                if (tripIdsToDelete && Array.isArray(tripIdsToDelete)) {
                  const deletePromises = tripIdsToDelete.map((tripId) =>
                    firestore().collection('trips').doc(tripId).delete()
                  );
                  await Promise.all(deletePromises);
                  // --- Delete cache for each trip ---
                  for (const tripId of tripIdsToDelete) {
                    await deleteCachedTrailData(tripId);
                    await deleteCachedChatMessages(tripId);
                  }
                  // --- End cache deletion ---
                  // 3. Update local trips state
                  setTrips((prevTrips) =>
                    prevTrips.filter((trip) => !tripIdsToDelete.includes(trip.id || ''))
                  );
                }
              }
              // 4. Delete the plan document itself
              await planDocRef.delete();
              // 5. Update local plans state
              setPlans((prevPlans) => prevPlans.filter((plan) => plan.id !== planId));
            } catch (error) {
              console.error('Error deleting plan and associated trips:', error);
              Alert.alert('Error', 'Could not delete plan or its trips.');
            }
          },
        },
      ]
    );
  };

  const EmptyPlansComponent = () => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
      <Ionicons
        name="map-outline"
        size={35}
        color={Colors.inactive}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyText, { color: theme.icon }]}>No items found</Text>
      <Text style={[styles.emptySubtext, { color: theme.icon }]}>
        Start planning your first adventure!
      </Text>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <View>
          <View style={styles.nameRow}>
            <Text style={[styles.username, { color: theme.primary }]}>Hello, </Text>
            <Text
              style={[styles.username, { color: theme.primary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {userName}
            </Text>
          </View>
          <View style={styles.ecoPointsRow}>
            <Text style={styles.ecoPoints}>Eco-Points: </Text>
            <Text style={styles.ecoPointsNum}>{ecoPoints}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={goToSettings}>
          <Ionicons name="settings-outline" size={32} color={theme.icon} />
        </TouchableOpacity>
      </View>

      {/* Plan a Trip Button */}
      <TouchableOpacity
        style={[styles.planButton, { backgroundColor: theme.card, shadowColor: isDarkMode ? 'rgba(0,0,0,0.3)' : '#000' }]}
        onPress={goToTripPlanning}
      >
        <View style={styles.planButtonContent}>
          <Ionicons
            name="map-outline"
            size={19}
            color={theme.text}
            style={styles.planButtonIcon}
          />
          <Text style={[styles.planButtonText, { color: theme.text }]}>Plan a Trip</Text>
        </View>
      </TouchableOpacity>

      {/* Your Trips Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Favorite Trips</Text>
        <TouchableOpacity
          onPress={() => {
            setIsTripsEditing(!isTripsEditing);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text style={[styles.editButtonText, { color: theme.icon }]}>
            {isTripsEditing ? "Done" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        data={trips}
        keyExtractor={(item) => item.id || String(Math.random())}
        renderItem={(
          { item } // Use the new TripBox component
        ) => (
          <TripBox
            item={item}
            tripDate={tripDates[item.id || ""]}
            isEditing={isTripsEditing}
            onPress={handleTripPress}
            onDelete={handleDeleteTrip}
            animationDelay={300} // Max 300ms random delay
            theme={theme}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tripList}
        ListEmptyComponent={EmptyPlansComponent}
      />

      {/* Your Plans Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Plans</Text>
        <TouchableOpacity
          onPress={() => {
            setIsPlansEditing(!isPlansEditing);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text style={[styles.editButtonText, { color: theme.icon }]}>
            {isPlansEditing ? "Done" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        data={plans}
        keyExtractor={(item) => item.id || String(Math.random())}
        renderItem={(
          { item } // Use the new PlanBox component
        ) => (
          <PlanBox
            item={item}
            isEditing={isPlansEditing}
            onPress={goToTrip}
            onDelete={handleDeletePlan}
            animationDelay={300} // Max 300ms random delay
            theme={theme}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tripList}
        ListEmptyComponent={EmptyPlansComponent}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 80,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20, // Add padding at the bottom
  },
  infoPanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    width: "90%",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    ...Typography.text.h1,
    maxWidth: 200, // Limit width to prevent overflow
  },
  ecoPointsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ecoPoints: {
    ...Typography.text.caption,
    color: "green",
    marginTop: 5,
    fontSize: 15,
  },
  ecoPointsNum: {
    color: "green",
    marginTop: 5,
    fontSize: 15,
    fontWeight: "800",
  },
  planButton: {
    paddingVertical: 20,
    borderRadius: 100,
    alignItems: "center",
    marginBottom: 25,
    width: "90%",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  planButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  planButtonIcon: {
    marginRight: 8,
  },
  planButtonText: {
    ...Typography.text.button,
    fontWeight: "500",
    fontSize: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
    paddingLeft: 3,
    marginBottom: 5,
    marginTop: 10, // Add margin top to separate sections
  },
  sectionTitle: {
    ...Typography.text.h3,
    fontSize: 25,
  },
  editButtonText: {
    ...Typography.text.button,
    fontSize: 16,
    fontWeight: "500",
    paddingLeft: 40,
    paddingVertical: 10,
  },
  tripList: {
    minWidth: "100%",
    minHeight: 260,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
  },
  animatedBox: {
    marginRight: 30,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  planBox: {
    width: 240,
    height: 240,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "lightGray",
  },
  planImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  planOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  planInfo: {
    position: "absolute",
    bottom: 15,
    left: 15,
    right: 15,
  },
  planMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  planLocation: {
    ...Typography.text.h2,
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  planName: {
    ...Typography.text.h3,
    color: "white",
    marginBottom: 5,
    fontWeight: "600",
  },
  planDetails: {
    ...Typography.text.caption,
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
  },
  dateContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    borderBottomLeftRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyContainer: {
    width: "90%",
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginLeft: 10,
  },
  emptyIcon: {
    marginBottom: 15,
  },
  emptyText: {
    ...Typography.text.h3,
    marginBottom: 5,
    textAlign: "center",
  },
  emptySubtext: {
    ...Typography.text.body,
    textAlign: "center",
  },
  deleteButton: {
    position: "absolute",
    top: -8,
    left: -8,
    zIndex: 10,
    opacity: 0.8,
    borderRadius: 15,
    padding: 2,
  },
});
