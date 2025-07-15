import React from "react";
import { StyleSheet, Alert, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, Button, Icon, Layout, Spinner } from "@ui-kitten/components";
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import getDistance from "geolib/es/getDistance";
import { LocationContext } from "../lib/context";
import axios from "axios";

import storage from "../lib/storage";
import { supabase } from "../lib/supabase";

import LoginScreen from "../Views/Login";
import MapScreen from "../Views/Map";
import ScannerScreen from "../Views/Scanner";
import SitesScreen from "../Views/Sites";
import VehiclesScreen from "../Views/Vehicles";
import AssetsScreen from "../Views/Assets";

const LOCATION_TASK_NAME = "LOCATION_TASK_NAME";
let foregroundSubscription = null;

// Define the background task for location tracking
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    // Extract location coordinates from data
    const { locations } = data;
    const location = locations[0];
    if (location) {
      console.log("Location in background", location.coords);
    }
  }
});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HeaderRight = ({ navigation }) => {
  return (
    <Button
      appearance="ghost"
      onPress={async () => {
        await supabase.auth.signOut();
        navigation.navigate("Login");
      }}
    >
      <Text>Logout</Text>
    </Button>
  );
};

const SyncComponent = () => {
  return (
    <Layout style={styles.layout}>
      <View style={styles.loader}>
        <Text category="h5" style={{ marginBottom: 20 }}>
          Syncing...
        </Text>
        <Spinner size="large" />
      </View>
    </Layout>
  );
};

export function AuthenticatedScreen({ navigation }) {
  const { location, setLocation, nearbySites, setNearbySites } =
    React.useContext(LocationContext);
  const [sites, setSites] = React.useState([]);
  const [syncing, setSyncing] = React.useState(false);

  // Start location tracking in foreground
  const startForegroundUpdate = async () => {
    // Check if foreground permission is granted
    const { granted } = await Location.getForegroundPermissionsAsync();
    if (!granted) {
      console.log("location tracking denied");
      return;
    }

    // Make sure that foreground location tracking is not running
    foregroundSubscription?.remove();

    // Start watching position in real-time
    foregroundSubscription = await Location.watchPositionAsync(
      {
        // For better logs, we set the accuracy to the most sensitive option
        accuracy: Location.Accuracy.Highest,
      },
      (location) => {
        setLocation(location.coords);
      }
    );
  };
  // Stop location tracking in foreground
  const stopForegroundUpdate = () => {
    foregroundSubscription?.remove();
    setLocation(null);
  };
  // Start location tracking in background
  const startBackgroundUpdate = async () => {
    // Don't track position if permission is not granted
    const { granted } = await Location.getBackgroundPermissionsAsync();
    if (!granted) {
      console.log("location tracking denied");
      return;
    }

    // Make sure the task is defined otherwise do not start tracking
    const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
    if (!isTaskDefined) {
      console.log("Task is not defined");
      return;
    }

    // Don't track if it is already running in background
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );
    if (hasStarted) {
      console.log("Already started");
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      // For better logs, we set the accuracy to the most sensitive option
      accuracy: Location.Accuracy.BestForNavigation,
      // Make sure to enable this notification if you want to consistently track in the background
      showsBackgroundLocationIndicator: false,
      foregroundService: {
        notificationTitle: "Location",
        notificationBody: "Location tracking in background",
        notificationColor: "#fff",
      },
    });
  };

  // Stop location tracking in background
  const stopBackgroundUpdate = async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    );
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log("Location tacking stopped");
    }
  };

  const syncSites = async () => {
    if (syncing) {
      return;
    }
    setSyncing(true);
    try {
      const url =
        "https://restoration-specialists-production.up.railway.app/api/jobs?sync=current";
      const result = await axios.get(url);
      if (!result) {
        throw Error();
      }
      new Promise(async (resolve) => {
        const { data } = await supabase
          .from("sites")
          .select(`id, job_id, addresses(description, lat, lng), assets(id)`);
        setSites(data.filter((x) => x.addresses?.lat));
      });
      Alert.alert("All synced!");
    } catch (ex) {
      Alert.alert(
        "Oh oh",
        "There was a problem syncing, please try again or reload the app"
      );
    }
    setSyncing(false);
  };

  React.useEffect(() => {
    new Promise(async (resolve) => {
      const { data } = await supabase
        .from("sites")
        .select(`id, job_id, addresses(description, lat, lng), assets(id)`);
      setSites(data.filter((x) => x.addresses?.lat));
    });

    const requestPermissions = async () => {
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (foreground.granted) {
        // await Location.requestBackgroundPermissionsAsync();
        startForegroundUpdate();
      }
    };
    requestPermissions();
  }, []);

  const addDistanceToSites = () => {
    const clone = [].concat(sites);
    const nearby = [];
    const geo = { latitude: location.latitude, longitude: location.longitude };
    sites.forEach((x, i) => {
      const innerGeo = {
        latitude: x?.addresses?.lat,
        longitude: x?.addresses?.lng,
      };
      const distance = getDistance(geo, innerGeo);
      if (distance < 500) {
        nearby.push({ ...x, distance: distance });
      }
    });
    nearby.sort((a, b) => {
      return a.distance > b.distance ? 1 : a.distance < b.distance ? -1 : 0;
    });
    setNearbySites(nearby);
  };

  React.useEffect(() => {
    if (sites.length > 0 && location?.latitude) {
      addDistanceToSites();
    }
  }, [sites, location]);

  React.useEffect(() => {
    // new Promise(async (resolve) => {
    //   const theSelectedSite = await storage.getData("selectedSite");
    //   const match = nearbySites.find(
    //     (x) => x?.job_id === theSelectedSite?.job_id
    //   );
    //   if (!match) {
    //     storage.removeData("selectedSite");
    //   }
    // });
  }, [nearbySites]);

  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={{
        tabBarActiveTintColor: "blue",
      }}
    >
      <Tab.Screen
        name="Map"
        component={syncing ? SyncComponent : MapScreen}
        options={{
          tabBarLabel: "Map",
          headerLeft: (props) => {
            return (
              <Button
                appearance="ghost"
                status="danger"
                onPress={() => {
                  syncSites();
                }}
              >
                <Text>Sync</Text>
              </Button>
            );
          },
          headerRight: (props) => {
            return <HeaderRight navigation={navigation} />;
          },
        }}
      />
      <Tab.Screen
        name="Sites"
        component={SitesScreen}
        options={{
          tabBarLabel: "Sites",
          headerRight: (props) => {
            return <HeaderRight navigation={navigation} />;
          },
        }}
      />
      <Tab.Screen
        name="Vehicles"
        component={VehiclesScreen}
        options={{
          tabBarLabel: "Vehicles",
          headerRight: (props) => {
            return <HeaderRight navigation={navigation} />;
          },
        }}
      />
      <Tab.Screen
        name="Assets"
        component={AssetsScreen}
        options={{
          tabBarLabel: "Assets",
          headerRight: (props) => {
            return <HeaderRight navigation={navigation} />;
          },
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: "Scanner",
          headerRight: (props) => {
            return <HeaderRight navigation={navigation} />;
          },
        }}
      />
    </Tab.Navigator>
  );
}

export function TabNavigator() {
  const [loading, setLoading] = React.useState(true);
  const [session, setSession] = React.useState(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <Text>Loading</Text>;
  }

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        tabBarActiveTintColor: "blue",
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Authenticated" component={AuthenticatedScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TabNavigator;
