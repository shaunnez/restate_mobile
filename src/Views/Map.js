import React from "react";
import { Layout, CheckBox } from "@ui-kitten/components";
import { LocationContext } from "../lib/context";

import { StyleSheet, View, Alert } from "react-native";
import { Marker, Circle } from "react-native-maps";
import MapView from "react-native-map-clustering";
import storage from "../lib/storage";
import { supabase } from "../lib/supabase";

const statusToColor = {
  0: "blue",
  1: "blue",
  2: "yellow",
  3: "green",
  4: "red",
};

export const MapScreen = ({ navigation }) => {
  const [selectedStatusList, setSelectedStatusList] = React.useState([1, 2]);
  const { location, nearbySites } = React.useContext(LocationContext);

  const [mapRegion, setMapRegion] = React.useState({
    latitude: -36.8509,
    longitude: 174.7645,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
    setViaLocation: false,
  });

  const [markers, setMarkers] = React.useState([]);

  const filteredMarkers = markers.filter((x) => {
    if (selectedStatusList.indexOf(x.status) > -1) {
      return true;
    } else {
      return false;
    }
  });

  const handleChangeStatus = (val) => {
    const clone = [].concat(selectedStatusList);
    const pos = clone.indexOf(val);
    if (pos > -1) {
      clone.splice(pos, 1);
    } else {
      clone.push(val);
    }
    setSelectedStatusList(clone);
  };

  const handleMarkerClick = (marker) => {
    const { job_id } = marker.fullData;
    const closeEnough = nearbySites.find((x) => x.job_id === job_id);
    if (closeEnough) {
      storage.storeData("selectedSite", marker.fullData);
      navigation.navigate("Sites");
    }
  };

  React.useEffect(() => {
    new Promise(async (resolve) => {
      const { data } = await supabase
        .from("sites")
        .select(
          `*, categories(name), customers(name), addresses(description, lat, lng), assets(*)`
        );

      const newMarkers = [];
      data.forEach((x, i) => {
        if (x.addresses) {
          newMarkers.push({
            identifier: x.id,
            latLng: {
              latitude: x.addresses.lat,
              longitude: x.addresses.lng,
            },
            title: `Job ${x.job_id}`,
            description: `${x.addresses.description}`,
            pinColor: statusToColor[x.status],
            status: x.status,
            fullData: x,
          });
        }
      });
      setMarkers(newMarkers);
    });
  }, []);

  React.useEffect(() => {
    if (!mapRegion.setViaLocation && location?.latitude) {
      setMapRegion({
        ...mapRegion,
        latitude: location.latitude,
        longitude: location.longitude,
        setViaLocation: true,
      });
    }
  }, [location]);

  return (
    <Layout styles={styles.container}>
      <View style={styles.innerContainer}>
        <CheckBox
          style={styles.checkbox}
          checked={selectedStatusList.indexOf(1) > -1}
          status="info"
          onChange={() => {
            handleChangeStatus(1);
          }}
        >
          W/O
        </CheckBox>
        <CheckBox
          style={styles.checkbox}
          checked={selectedStatusList.indexOf(2) > -1}
          status="warning"
          onChange={() => {
            handleChangeStatus(2);
          }}
        >
          Quote
        </CheckBox>
        <CheckBox
          style={styles.checkbox}
          checked={selectedStatusList.indexOf(3) > -1}
          status="success"
          onChange={() => {
            handleChangeStatus(3);
          }}
        >
          Completed
        </CheckBox>
        <CheckBox
          style={styles.checkbox}
          checked={selectedStatusList.indexOf(4) > -1}
          status="danger"
          onChange={() => {
            handleChangeStatus(4);
          }}
        >
          Unsuccessful
        </CheckBox>
      </View>
      <MapView
        style={styles.map}
        region={mapRegion}
        initialRegion={mapRegion}
        showsUserLocation={true}
        loadingEnabled={markers.length === 0}
      >
        {filteredMarkers.map((marker, index) => (
          <Marker
            key={index}
            identifier={marker.identifier}
            coordinate={marker.latLng}
            title={marker.title}
            description={marker.description}
            pinColor={marker.pinColor}
            data={marker}
            onCalloutPress={(e) => {
              handleMarkerClick(marker);
            }}
          />
        ))}

        {location?.latitude && (
          <Circle
            identifier="Your Location"
            radius={200}
            center={location}
            strokeColor={"rgba(40,67,135,1)"}
            fillColor={"rgba(40, 67, 135, 0.5)"}
            strokeWidth={1}
          />
        )}
      </MapView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    padding: 10,
    flexDirection: "row",
  },
  checkbox: {
    margin: 2,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default MapScreen;
