import React, { useEffect } from "react";
import {
  Layout,
  Text,
  Button,
  Card,
  Divider,
  List,
  Input,
  Spinner,
} from "@ui-kitten/components";
import moment from "moment";
import { StyleSheet, Alert, View } from "react-native";
import { supabase } from "../lib/supabase";
import storage from "../lib/storage";
import { useIsFocused } from "@react-navigation/native";
import { LocationContext } from "../lib/context";
import SingleAsset from "../components/SingleAsset";

const siteStatus = [
  "Unknown",
  "Work Order",
  "Quote",
  "Completed",
  "Unsuccessful",
];

export const VehiclesScreen = ({ navigation }) => {
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [sites, setSites] = React.useState([]);
  const [selectedVehicle, setSelectedVehicle] = React.useState(null);
  const isFocused = useIsFocused();

  const { location, nearbySites } = React.useContext(LocationContext);

  const filteredSites = sites.filter((x, i) => {
    const text = `${x.job_id} ${x.customers?.name || ""} ${
      x.categories?.name || ""
    } ${x.addresses?.description || ""} ${siteStatus[x.status]}`.toLowerCase();

    if (!search || (text.indexOf(search?.toLowerCase()) > -1 && x.job_id)) {
      return true;
    }
    return false;
  });

  filteredSites.sort((a, b) => {
    return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
  });

  React.useEffect(() => {
    setLoading(true);
    new Promise(async (resolve) => {
      // const searchText = `'%${search}%'`;
      const { data } = await supabase
        .from("sites")
        .select(
          `*, categories(name), customers(name), addresses(description, lat, lng), assets(*)`
        );
      // .textSearch("name", searchText, {
      //   type: "websearch",
      // });
      const vehicleSites =
        data.filter(
          (x) => x.customers?.name?.toLowerCase().indexOf("vehicle") > -1
        ) || [];

      setSites(vehicleSites);
      const temp = await storage.getData("selectedVehicle");

      if (temp) {
        setSelectedVehicle(vehicleSites.find((x) => x.id === temp.id));
      }
      setLoading(false);
    });
    return () => {
      setLoading(true);
    };
  }, [isFocused]);

  if (loading) {
    return (
      <Layout level="1" style={styles.layout}>
        <View style={styles.loader}>
          <Spinner size="large" />
        </View>
      </Layout>
    );
  }

  if (selectedVehicle) {
    return (
      <Layout level="1" style={styles.layout}>
        <Card
          style={styles.card}
          status="primary"
          header={
            <Text category="s1">{`Job ${selectedVehicle.job_id}: ${selectedVehicle.customers?.name}`}</Text>
          }
          footer={
            <>
              <Button
                size="small"
                onPress={(e) => {
                  setSelectedVehicle(null);
                  storage.removeData("selectedVehicle");
                }}
              >
                Unselect
              </Button>
            </>
          }
        >
          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Address:
            </Text>
            <Text style={styles.secondText}>
              {selectedVehicle.addresses?.description}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Assets with Vehicle:
            </Text>
            <Text style={styles.secondText}>
              {selectedVehicle.assets?.length}
            </Text>
          </View>
        </Card>

        {selectedVehicle && (
          <List
            style={styles.container}
            data={selectedVehicle.assets}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={Divider}
            editMode={true}
            renderItem={(info) => {
              return (
                <SingleAsset
                  item={info.item}
                  navigation={navigation}
                  fullList={false}
                  editMode={true}
                />
              );
            }}
          />
        )}
      </Layout>
    );
  }
  return (
    <Layout level="1" style={styles.layout}>
      <Input
        placeholder="Search..."
        value={search}
        onChangeText={(nextValue) => setSearch(nextValue)}
        style={styles.input}
        size="large"
      />

      <List
        style={styles.container}
        data={filteredSites.slice(0, 100)}
        ItemSeparatorComponent={Divider}
        keyExtractor={(item) => item.id}
        renderItem={(info) => {
          return (
            <Card
              style={styles.card}
              status="primary"
              header={
                <Text category="s1">{`Job ${info.item.job_id}: ${info.item.customers?.name}`}</Text>
              }
              footer={
                <>
                  <Button
                    size="small"
                    onPress={(e) => {
                      if (info.item?.id === selectedVehicle?.id) {
                        setSelectedVehicle(null);
                        storage.removeData("selectedVehicle");
                      } else {
                        setSelectedVehicle(info.item);
                        storage.storeData("selectedVehicle", info.item);
                        // const closeEnough = nearbySites.find(
                        //   (x) => x.job_id === info.item.job_id
                        // );
                        // if (closeEnough) {
                        //   setSelectedVehicle(info.item);
                        //   storage.storeData("selectedVehicle", info.item);
                        //   Alert.alert(
                        //     "Vehicle " + info.item.job_id + " selected"
                        //   );
                        // } else {
                        //   Alert.alert(
                        //     "You are not close enough to select this site"
                        //   );
                        // }
                      }
                    }}
                  >
                    {selectedVehicle?.id === info.item?.id
                      ? "Selected"
                      : "Select"}
                  </Button>
                </>
              }
            >
              <View style={styles.row}>
                <Text style={styles.firstText} category="s1">
                  Address:
                </Text>
                <Text style={styles.secondText}>
                  {info.item.addresses?.description}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.firstText} category="s1">
                  Assets:
                </Text>
                <Text style={styles.secondText}>
                  {info.item.assets?.length}
                </Text>
              </View>
            </Card>
          );
        }}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  layout: {
    flex: 1,
  },
  card: {
    flex: 0,
    margin: 5,
    borderColor: "white",
  },
  input: {
    backgroundColor: "#333",
    color: "grey",
  },
  spacer: {
    marginTop: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    flexWrap: "wrap",
  },
  firstText: {
    width: "33%",
  },
  secondText: {
    width: "67%",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default VehiclesScreen;
