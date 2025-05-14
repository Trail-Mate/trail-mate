import firestore from '@react-native-firebase/firestore';
import { Plan, Trip } from "../types/Types";

/**
 * Create a new plan in Firestore
 * @param plan The plan data to create
 * @returns The ID of the created plan
 */
export const createPlan = async (plan: Omit<Plan, "id">): Promise<string> => {
  try {
    const planRef = await firestore().collection("plans").add(plan);
    return planRef.id;
  } catch (error) {
    console.error("Error creating plan:", error);
    throw error;
  }
};

/**
 * Update an existing plan in Firestore
 * @param planId The ID of the plan to update
 * @param planData The plan data to update
 */
export const updatePlan = async (
  planId: string,
  planData: Partial<Plan>
): Promise<void> => {
  try {
    const planRef = firestore().collection("plans").doc(planId);
    await planRef.update(planData);
  } catch (error) {
    console.error("Error updating plan:", error);
    throw error;
  }
};

/**
 * Create a new trip in Firestore
 * @param trip The trip data to create
 * @returns The ID of the created trip
 */
export const createTrip = async (trip: Omit<Trip, "id">): Promise<string> => {
  try {
    const tripRef = await firestore().collection("trips").add(trip);
    return tripRef.id;
  } catch (error) {
    console.error("Error creating trip:", error);
    throw error;
  }
};

/**
 * Get a plan by ID
 * @param planId The ID of the plan to get
 * @returns The plan data
 */
export const getPlan = async (planId: string): Promise<Plan | null> => {
  try {
    const planRef = firestore().collection("plans").doc(planId);
    const planSnap = await planRef.get();
    if (planSnap.exists()) {
      return { id: planSnap.id, ...planSnap.data() } as Plan;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting plan:", error);
    throw error;
  }
};

/**
 * Get all plans for a user
 * @param userId The ID of the user
 * @returns Array of plans
 */
export const getUserPlans = async (userId: string): Promise<Plan[]> => {
  try {
    const plansQuery = firestore().collection("plans").where("userId", "==", userId);
    const querySnapshot = await plansQuery.get();

    const plans: Plan[] = [];
    querySnapshot.forEach((doc) => {
      plans.push({ id: doc.id, ...doc.data() } as Plan);
    });

    return plans;
  } catch (error) {
    console.error("Error getting user plans:", error);
    throw error;
  }
};

/**
 * Get all trips for a plan
 * @param planId The ID of the plan
 * @returns Array of trips
 */
export const getPlanTrips = async (planId: string): Promise<Trip[]> => {
  try {
    const tripsQuery = firestore().collection("trips").where("planId", "==", planId);
    const querySnapshot = await tripsQuery.get();

    const trips: Trip[] = [];
    querySnapshot.forEach((doc) => {
      trips.push({ id: doc.id, ...doc.data() } as Trip);
    });

    return trips;
  } catch (error) {
    console.error("Error getting plan trips:", error);
    throw error;
  }
};

/**
 * Delete a plan and all its trips
 * @param planId The ID of the plan to delete
 */
export const deletePlan = async (planId: string): Promise<void> => {
  try {
    // First, get all trips associated with the plan
    const trips = await getPlanTrips(planId);

    // Delete each trip
    const tripDeletions = trips.map((trip) => {
      if (trip.id) {
        return firestore().collection("trips").doc(trip.id).delete();
      }
    });

    // Wait for all trip deletions to complete
    await Promise.all(tripDeletions);

    // Then delete the plan
    await firestore().collection("plans").doc(planId).delete();
  } catch (error) {
    console.error("Error deleting plan:", error);
    throw error;
  }
};
