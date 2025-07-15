import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  ImageBackground,
  StyleSheet,
  ViewProps,
  SafeAreaView,
  Alert,
} from "react-native";
import {
  Drawer,
  DrawerItem,
  Layout,
  Text,
  IndexPath,
  Divider,
  Button,
  TopNavigation,
} from "@ui-kitten/components";

import { supabase } from "../lib/supabase";
import LoginScreen from "../Views/Login";
import MapScreen from "../Views/Map";
import ScannerScreen from "../Views/Scanner";

const { Navigator, Screen } = createDrawerNavigator();

const DrawerHeader = (props) => (
  <>
    <ImageBackground
      style={[props.style, styles.header]}
      source={require("../../assets/image-background.jpg")}
    />
    <Divider />
  </>
);

const routeNames = ["Login", "Map", "Scanner"];

const DrawerContent = ({ navigation, state }) => (
  <Layout style={{ flex: 1 }}>
    <Drawer
      header={DrawerHeader}
      selectedIndex={new IndexPath(state.index)}
      onSelect={(index) => {
        navigation.navigate(routeNames[index.row + 1]);
      }}
    >
      <DrawerItem title="Map" />
      <DrawerItem title="Scanner" />
    </Drawer>
  </Layout>
);

const styles = StyleSheet.create({
  header: {
    height: 103,
    flexDirection: "row",
    alignItems: "center",
  },
});

const HeaderRight = ({ navigation }) => {
  return (
    <Button
      appearance="ghost"
      onPress={async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          Alert.alert(error.message);
        }
      }}
    >
      <Text>Logout</Text>
    </Button>
  );
};

const LoadingScreen = ({ navigation }) => {
  const [session, setSession] = React.useState(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigation.navigate("Map");
      } else {
        navigation.navigate("Login");
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigation.navigate("Map");
      } else {
        navigation.navigate("Login");
      }
    });
  }, []);

  return <Text>Loading</Text>;
};
export const TheDrawer = () => {
  const [session, setSession] = React.useState(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <Navigator
      screenOptions={{
        headerTintColor: "white",
        headerStyle: { backgroundColor: "rgba(0,0,0,0.8)" },
      }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Screen
        name="Loading"
        component={LoadingScreen}
        options={{
          title: "Please wait",
          headerLeft: () => null,
        }}
      />
      <Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: "Restoration Specialists",
          headerLeft: () => null,
        }}
      />
      <Screen
        name="Map"
        component={MapScreen}
        options={({ navigation, route }) => ({
          headerRight: () => <HeaderRight navigation={navigation} />,
          headerTitle: () => <Text>{session?.user?.email}</Text>,
        })}
      />
      <Screen
        name="Scanner"
        component={ScannerScreen}
        options={({ navigation, route }) => ({
          headerRight: () => <HeaderRight navigation={navigation} />,
        })}
      />
    </Navigator>
  );
};

export default TheDrawer;
