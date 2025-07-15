import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import * as eva from "@eva-design/eva";
import { ApplicationProvider, IconRegistry } from "@ui-kitten/components";
import { EvaIconsPack } from "@ui-kitten/eva-icons";
import { NavigationContainer } from "@react-navigation/native";
import { RootSiblingParent } from "react-native-root-siblings";
import * as Location from "expo-location";
import { LocationContextProvider } from "./src/lib/context";
import TabNavigator from "./src/components/TabNavigator";

export default () => {
  return (
    <LocationContextProvider>
      <RootSiblingParent>
        <IconRegistry icons={EvaIconsPack} />
        <ApplicationProvider {...eva} theme={eva.dark}>
          <NavigationContainer>
            <TabNavigator />
          </NavigationContainer>
          <StatusBar style="auto" />
        </ApplicationProvider>
      </RootSiblingParent>
    </LocationContextProvider>
  );
};
