import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Linking, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firestore from "@react-native-firebase/firestore";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { useTemperatureUnit } from "../../../hooks/useTemperatureUnit";
import { Colors } from "../../../constants/Colors";
import { Typography } from "../../../constants/Typography";
import { getCachedWeatherData, cacheWeatherData, getCachedTrailData, cacheTrailData } from '../../../services/cacheService';

interface InfoTabProps {
  tripId?: string;
  tripData?: any;
}

const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
if (!apiKey) {
  throw new Error(
    "EXPO_PUBLIC_GEMINI_API_KEY is not defined in environment variables"
  );
}

const getDisplayUrl = (url: string) => {
  try {
    const { hostname } = new URL(url);
    return hostname.replace("www.", "");
  } catch {
    return url;
  }
};

const getDifficultyIcon = (difficulty: string) => {
  if (!difficulty) return "star";

  const level = difficulty.toLowerCase();
  if (level.includes("easy")) return "leaf";
  if (level.includes("moderate")) return "footsteps";
  if (level.includes("hard") || level.includes("difficult")) return "trending-up";
  if (level.includes("extreme")) return "warning";
  return "star";
};

// Info Tab Component
export default function InfoTab({ tripId, tripData }: InfoTabProps) {
  const { colorScheme } = useColorScheme();
  const { temperatureUnit, convertTemperature } = useTemperatureUnit();
  const theme = Colors[colorScheme];

  const [tripInfo, setTripInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const fetchTripInfo = async () => {
      setLoading(true);
      try {
        let currentTripId = tripId;

        if (!currentTripId && tripData?.id) {
          currentTripId = tripData.id;
        }

        if (currentTripId) {
          await AsyncStorage.setItem("selectedTripId", currentTripId);
        } else {
          const storedTripId = await AsyncStorage.getItem("selectedTripId");
          if (storedTripId) {
            currentTripId = storedTripId;
          }
        }

        if (tripData?.schedule && Array.isArray(tripData.schedule)) {
          setTripInfo(tripData);
          setLoading(false);
          return;
        }

        if (currentTripId) {
          // Try cache first
          const cached = await getCachedTrailData(currentTripId);
          if (cached) {
            console.log('Trail data loaded from CACHE for InfoTab:', currentTripId);
            setTripInfo(cached);
          } else {
            const tripDoc = await firestore().collection("trips").doc(currentTripId).get();
            if (tripDoc.exists()) {
              console.log('Trail data loaded from FIREBASE for InfoTab:', currentTripId);
              setTripInfo(tripDoc.data());
              await cacheTrailData(currentTripId, tripDoc.data());
            } else {
              setError("Trip not found.");
            }
          }
        } else {
          setError("No trip ID available.");
        }
      } catch (err) {
        console.error("Error loading trip info:", err);
        setError("Failed to load trip info.");
      } finally {
        setLoading(false);
      }
    };

    fetchTripInfo();
  }, [tripId, tripData]);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!tripInfo?.coordinates.latitude || !tripInfo?.coordinates.longitude) return;

      const lat = tripInfo.coordinates.latitude;
      const lon = tripInfo.coordinates.longitude;
      const date = tripInfo.dateRange?.startDate || '';
      const cacheKey = `${lat},${lon},${date}`;

      // Try cache first
      const cached = await getCachedWeatherData(cacheKey);
      let data;
      if (cached) {
        data = cached;
        console.log("-------Successfully fetched weather data from CACHE-------");
      } else {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&date=${date}&appid=${apiKey}&units=imperial`;
        try {
          const response = await fetch(url);
          data = await response.json();
          console.log("-------Successfully fetched weather data from API-------");
          await cacheWeatherData(cacheKey, data);
        } catch (error) {
          console.error("Failed to fetch weather:", error);
          return;
        }
      }

      try {
        const iconCode = data.weather[0].icon.slice(0, -1) + 'd';
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        });
        const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        });

        // Convert temperatures based on user preference
        const temp = convertTemperature(data.main.temp);
        const high = convertTemperature(data.main.temp_max);
        const low = convertTemperature(data.main.temp_min);
        const feels_like = convertTemperature(data.main.feels_like);

        setWeather({
          temperature: `${temp.value}${temp.unit}`,
          status: (data.weather[0].description.split(" ") as string[])
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          precipitation: data.rain?.["1h"] ? `${data.rain["1h"]} mm` : "0 mm",
          high: `${high.value}${high.unit}`,
          low: `${low.value}${low.unit}`,
          feels_like: `${feels_like.value}${feels_like.unit}`,
          humidity: `${data.main.humidity}%`,
          seaLevel: data.main.sea_level ? `${data.main.sea_level} Ft` : "N/A",
          sunrise,
          sunset,
          iconUrl,
        });
      } catch (error) {
        console.error("Failed to process weather data:", error);
      }
    };

    fetchWeather();
  }, [tripInfo, temperatureUnit]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading trip info...</Text>
      </View>
    );
  }

  if (error || !tripInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.text }]}>{error || "No trip data available."}</Text>
      </View>
    );
  }

  // Get icons for amenities
  const getAmenityIcon = (amenity: string) => {
    const name = amenity.toLowerCase();
    if (name.includes("restroom") || name.includes("bathroom")) return "transgender";
    if (name.includes("parking")) return "car";
    if (name.includes("water")) return "water";
    if (name.includes("picnic")) return "restaurant";
    if (name.includes("camp")) return "bonfire";
    if (name.includes("wifi")) return "wifi";
    if (name.includes("view")) return "eye";
    if (name.includes("pet") || name.includes("dog")) return "paw";
    if (name.includes("cafe") || name.includes("coffee")) return "cafe";
    if (name.includes("bike") || name.includes("biking")) return "bicycle";
    if (name.includes("boat")) return "boat";
    return "trail-sign";
  };

  // Get icons for highlights
  const getHighlightIcon = (highlight: string) => {
    const name = highlight.toLowerCase();
    if (name.includes("view") || name.includes("scenic")) return "eye";
    if (name.includes("water") || name.includes("lake") || name.includes("river")) return "water";
    if (name.includes("wildlife") || name.includes("animal") || name.includes("pet")) return "paw";
    if (name.includes("photo")) return "camera";
    if (name.includes("forest") || name.includes("tree")) return "leaf";
    if (name.includes("historic")) return "time";
    if (name.includes("quiet")) return "volume-mute";
    if (name.includes("wildflower") || name.includes("flower")) return "flower";
    if (name.includes("moderate") || name.includes("difficult")) return "footsteps";
    if (name.includes("easy")) return "leaf";
    if (name.includes("difficult") || name.includes("extreme")) return "warning";
    if (name.includes("hard")) return "trending-up";
    if (name.includes("morning") || name.includes("sunset")) return "sunny";
    if (name.includes("evening") || name.includes("night")) return "moon";
    if (name.includes("snow")) return "snow";
    if (name.includes("shade")) return "umbrella";
    if (name.includes("challenge") || name.includes("challenging")) return "alert-circle";
    if (name.includes("bike") || name.includes("biking")) return "bicycle";
    return "star";
  };

  // Function to render amenities with icons
  const renderAmenities = () => {
    if (!Array.isArray(tripInfo.amenities) || tripInfo.amenities.length === 0) {
      return <Text style={[styles.bodyText, { color: theme.text }]}>N/A</Text>;
    }

    return (
      <View style={styles.iconGrid}>
        {tripInfo.amenities.map((amenity: string, index: number) => (
          <View key={`amenity-${index}`} style={styles.iconItem}>
            <Ionicons
              name={getAmenityIcon(amenity)}
              size={28}
              color={theme.tint}
              style={styles.featureIcon}
            />
            <Text style={[styles.iconLabel, { color: theme.text }]}>
              {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Function to render highlights with icons
  const renderHighlights = () => {
    if (!Array.isArray(tripInfo.highlights) || tripInfo.highlights.length === 0) {
      return <Text style={[styles.bodyText, { color: theme.text }]}>N/A</Text>;
    }

    return (
      <View style={styles.iconGrid}>
        {tripInfo.highlights.map((highlight: string, index: number) => (
          <View key={`highlight-${index}`} style={styles.iconItem}>
            <Ionicons
              name={getHighlightIcon(highlight)}
              size={28}
              color={theme.tint}
              style={styles.featureIcon}
            />
            <Text style={[styles.iconLabel, { color: theme.text }]}>
              {highlight.charAt(0).toUpperCase() + highlight.slice(1)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Simple Header */}
      <View style={styles.headerSection}>
        <Text style={[styles.tripName, { color: theme.text }]}>{tripInfo.name}</Text>
        <View style={styles.locationWrapper}>
          <Ionicons name="location" size={18} color={theme.tint} />
          <Text style={[styles.locationText, { color: theme.text }]}>{tripInfo.location}</Text>
        </View>
        <Text style={[styles.difficultyText, { color: theme.icon }]}>
          {/* {tripInfo.difficultyLevel?.slice(0, -1)} Difficulty */}
          {tripInfo.difficultyLevel?.split(" ")[0].replace(/[^\w]/g, "")} Difficulty
        </Text>
      </View>

      {/* Summary with Icon */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Ionicons name="information-circle" size={34} color={theme.tint} style={styles.sectionIcon} />
        <Text style={[styles.bodyText, { color: theme.text }]}>{tripInfo.description}</Text>
      </View>

      {/* Contact Information - Simplified */}
      <View style={styles.quickInfoRow}>
        <TouchableOpacity
          style={[styles.quickInfoItem, { backgroundColor: theme.card }]}
          onPress={() => Linking.openURL(`tel:${tripInfo.parkContact}`)}
        >
          <Ionicons name="call" size={32} color={theme.tint} />
          <Text style={[styles.quickInfoLabel, { color: theme.text }]}>Call Park</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickInfoItem, { backgroundColor: theme.card }]}
          onPress={() => Linking.openURL(tripInfo.parkWebsite)}
        >
          <Ionicons name="globe" size={32} color={theme.tint} />
          <Text style={[styles.quickInfoLabel, { color: theme.text }]}>Website</Text>
        </TouchableOpacity>
      </View>

      {/* Cell Service Info */}
      <View style={[styles.cellServiceCard, { backgroundColor: theme.card }]}>
        <Ionicons
          name={tripInfo.cellService.toLowerCase().includes("no") ? "close-circle" : "cellular"}
          size={32}
          color={tripInfo.cellService.toLowerCase().includes("no") ? theme.inactive : theme.tint}
          style={styles.cellServiceIcon}
        />
        <Text style={[styles.cellServiceText, { color: theme.text }]} numberOfLines={2}>
          Cell Service: {tripInfo.cellService}
        </Text>
      </View>

      {/* Weather Display with Large Icon */}
      <View style={[styles.weatherSection, { backgroundColor: theme.card }]}>
        <Text style={[styles.weatherSectionTitle, { color: theme.text }]}>Weather on Trip Date</Text>

        {/* Top weather overview */}
        <View style={styles.weatherOverview}>
          <View style={styles.weatherMainInfo}>
            <Text style={[styles.tempText, { color: theme.text }]}>{weather?.temperature ?? "--"}</Text>
            <Text style={[styles.weatherStatus, { color: theme.text }]}>{weather?.status ?? "--"}</Text>
            <Text style={[styles.weatherFeelsLike, { color: theme.icon }]}>
              Feels like: {weather?.feels_like ?? "--"}
            </Text>
          </View>

          <View style={styles.weatherIconWrapper}>
            {weather?.iconUrl ? (
              <Image
                source={{ uri: weather.iconUrl }}
                style={styles.largeWeatherIcon}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="partly-sunny" size={70} color={theme.tint} />
            )}
            <Text style={[styles.highLowText, { color: theme.icon }]}>
              H: {weather?.high ?? "--"} • L: {weather?.low ?? "--"}
            </Text>
          </View>
        </View>

        <View style={[styles.weatherDivider, { backgroundColor: theme.borderColor }]} />

        {/* Weather details grid */}
        <View style={styles.weatherDetailsGrid}>
          <View style={styles.weatherDetailItem}>
            <Ionicons name="water" size={22} color={theme.tint} />
            <View style={styles.weatherDetailContent}>
              <Text style={[styles.weatherDetailLabel, { color: theme.icon }]}>Humidity</Text>
              <Text style={[styles.weatherDetailValue, { color: theme.text }]}>{weather?.humidity ?? "--"}</Text>
            </View>
          </View>

          <View style={styles.weatherDetailItem}>
            <Ionicons name="rainy" size={22} color={theme.tint} />
            <View style={styles.weatherDetailContent}>
              <Text style={[styles.weatherDetailLabel, { color: theme.icon }]}>Precipitation</Text>
              <Text style={[styles.weatherDetailValue, { color: theme.text }]}>{weather?.precipitation ?? "--"}</Text>
            </View>
          </View>

          <View style={styles.weatherDetailItem}>
            <Ionicons name="sunny" size={22} color={theme.tint} />
            <View style={styles.weatherDetailContent}>
              <Text style={[styles.weatherDetailLabel, { color: theme.icon }]}>Sunrise</Text>
              <Text style={[styles.weatherDetailValue, { color: theme.text }]}>{weather?.sunrise ?? "--"}</Text>
            </View>
          </View>

          <View style={styles.weatherDetailItem}>
            <Ionicons name="moon" size={22} color={theme.tint} />
            <View style={styles.weatherDetailContent}>
              <Text style={[styles.weatherDetailLabel, { color: theme.icon }]}>Sunset</Text>
              <Text style={[styles.weatherDetailValue, { color: theme.text }]}>{weather?.sunset ?? "--"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Trail Features with Icons */}
      <View style={styles.featuresContainer}>
        {/* Amenities */}
        <Text style={[styles.featureTitle, { color: theme.text }]}>Amenities</Text>
        {renderAmenities()}

        {/* Highlights */}
        <Text style={[styles.featureTitle, { color: theme.text }]}>Highlights</Text>
        {renderHighlights()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    ...Typography.text.bodySmall,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    ...Typography.text.body,
    textAlign: "center",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  difficultyBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tripName: {
    ...Typography.text.h3,
    textAlign: "center",
    marginBottom: 8,
  },
  locationWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    ...Typography.text.body,
    marginLeft: 6,
  },
  difficultyText: {
    ...Typography.text.caption,
    marginTop: 4,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionIcon: {
    alignSelf: "center",
    marginBottom: 12,
  },
  bodyText: {
    ...Typography.text.body,
    lineHeight: 22,
    textAlign: "center",
  },
  quickInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  quickInfoItem: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickInfoLabel: {
    ...Typography.text.caption,
    marginTop: 8,
    textAlign: "center",
  },
  cellServiceCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cellServiceIcon: {
    marginRight: 12,
    flexShrink: 0,
  },
  cellServiceText: {
    ...Typography.text.body,
    flex: 1,
    flexWrap: 'wrap',
  },
  weatherSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  weatherSectionTitle: {
    ...Typography.text.h4,
    marginBottom: 16,
  },
  weatherOverview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  weatherMainInfo: {
    flex: 1,
  },
  weatherIconWrapper: {
    alignItems: "center",
  },
  largeWeatherIcon: {
    width: 70,
    height: 70,
    marginBottom: 6,
  },
  tempText: {
    ...Typography.text.h2,
    fontWeight: "600",
  },
  weatherStatus: {
    ...Typography.text.body,
    fontWeight: "500",
    marginTop: 2,
  },
  weatherFeelsLike: {
    ...Typography.text.caption,
    marginTop: 4,
  },
  highLowText: {
    ...Typography.text.caption,
    textAlign: "center",
  },
  weatherDivider: {
    height: 1,
    marginBottom: 16,
  },
  weatherDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  weatherDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 12,
  },
  weatherDetailContent: {
    marginLeft: 12,
  },
  weatherDetailLabel: {
    ...Typography.text.caption,
  },
  weatherDetailValue: {
    ...Typography.text.body,
    marginTop: 2,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureTitle: {
    ...Typography.text.h4,
    marginBottom: 16,
    marginTop: 8,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  iconItem: {
    width: "33%",
    alignItems: "center",
    marginBottom: 16,
  },
  featureIcon: {
    marginBottom: 8,
  },
  iconLabel: {
    ...Typography.text.caption,
    textAlign: "center",
    paddingHorizontal: 4,
  },
});
