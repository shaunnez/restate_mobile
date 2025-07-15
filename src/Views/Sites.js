import React, { useEffect } from "react";
import {
  Layout,
  Text,
  Button,
  Card,
  Divider,
  List,
  Input,
  Select,
  SelectItem,
  IndexPath,
  CheckBox,
  Spinner,
} from "@ui-kitten/components";
import moment from "moment";
import { StyleSheet, Alert, View } from "react-native";
import { supabase } from "../lib/supabase";
import storage from "../lib/storage";
import { useIsFocused } from "@react-navigation/native";
import { LocationContext } from "../lib/context";
import SingleAsset from "../components/SingleAsset";
import SingleSite from "../components/SingleSite";

const siteStatus = [
  "Unknown",
  "Work Order",
  "Quote",
  "Completed",
  "Unsuccessful",
  "All",
];

export const StatusSelect = ({ defaultIndex, callback }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(
    new IndexPath(defaultIndex)
  );
  return (
    <Select
      size="small"
      selectedIndex={selectedIndex}
      value={siteStatus[selectedIndex]}
      status="primary"
      onSelect={(index) => {
        setSelectedIndex(index);
        callback(index.row);
      }}
    >
      <SelectItem title="Status: Work Order" />
      <SelectItem title="Status: Quote" />
      <SelectItem title="Status: Completed" />
      <SelectItem title="Status: Unsuccessful" />
      <SelectItem title="Status: All" />
    </Select>
  );
};

export const SitesScreen = ({ navigation }) => {
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [sites, setSites] = React.useState([]);
  const [selectedSite, setSelectedSite] = React.useState(null);
  const isFocused = useIsFocused();

  const [filterStatus, setFilterStatus] = React.useState(4);
  const { location, nearbySites } = React.useContext(LocationContext);

  const filteredSites = sites.filter((x, i) => {
    if (filterStatus < 4) {
      if (x.status !== filterStatus + 1) {
        return false;
      }
    }
    const text = `${x.job_id} ${x.customers?.name || ""} ${
      x.categories?.name || ""
    } ${x.addresses?.description || ""} ${siteStatus[x.status]} ${
      x.purchase_order_numbers
    }`.toLowerCase();
    if (!search || (text.indexOf(search?.toLowerCase()) > -1 && x.job_id)) {
      return true;
    }
    return false;
  });
  // filteredSites.sort((a, b) => {
  // return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
  // });

  React.useEffect(() => {
    setLoading(true);
    new Promise(async (resolve) => {
      // const searchText = `'%${search}%'`;
      const { data } = await supabase
        .from("sites")
        .select(
          `*, categories(name), customers(name), addresses(description, lat, lng), assets(*)`
        )
        .order("job_id", { ascending: false });
      // .textSearch("name", searchText, {
      //   type: "websearch",
      // });
      const nonVehicleSites =
        data.filter(
          (x) => x.customers?.name?.toLowerCase().indexOf("vehicle") === -1
        ) || [];
      setSites(nonVehicleSites);

      const temp = await storage.getData("selectedSite");
      if (temp) {
        setSelectedSite(nonVehicleSites.find((x) => x.id === temp.id));
      }
      setLoading(false);
      return () => {
        setLoading(true);
      };
    });
  }, [isFocused]);

  if (loading) {
    return (
      <Layout style={styles.layout} level="1">
        <View style={styles.loader}>
          <Spinner size="large" />
        </View>
      </Layout>
    );
  }
  if (selectedSite) {
    return (
      <Layout style={styles.layout} level="1">
        <Card
          style={styles.card}
          status="primary"
          header={
            <Text category="s1">
              {`Job ${selectedSite.job_id}: ${selectedSite.addresses?.description}`}
            </Text>
          }
          footer={
            <>
              <Button
                size="small"
                onPress={(e) => {
                  setSelectedSite(null);
                  storage.removeData("selectedSite");
                }}
              >
                Unselect
              </Button>
            </>
          }
        >
          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Customer:
            </Text>
            <Text style={styles.secondText}>
              {selectedSite.customers?.name}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Category:
            </Text>
            <Text style={styles.secondText}>
              {selectedSite.categories?.name}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Assets on Site:
            </Text>
            <Text style={styles.secondText}>
              {selectedSite.assets?.length || 0}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              References:
            </Text>
            <Text style={styles.secondText}>
              {selectedSite?.purchase_order_numbers?.split(",").map((x, i) => {
                return (
                  <Text
                    style={{
                      color:
                        selectedSite?.selectedReference === x ? "yellow" : "",
                    }}
                  >
                    {x}
                    {i <
                    selectedSite?.purchase_order_numbers?.split(",").length - 1
                      ? ", "
                      : ""}
                  </Text>
                );
              })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Status:
            </Text>
            <Text style={styles.secondText}>
              {siteStatus[selectedSite.status]}
            </Text>
          </View>
        </Card>

        {selectedSite && (
          <List
            style={styles.container}
            data={selectedSite.assets}
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
    <Layout style={styles.layout} level="1">
      <Input
        placeholder="Search..."
        value={search}
        onChangeText={(nextValue) => setSearch(nextValue)}
        style={styles.input}
        size="large"
      />

      <StatusSelect
        defaultIndex={filterStatus}
        status="primary"
        callback={(newStatus) => {
          setFilterStatus(newStatus);
        }}
      />

      <List
        style={styles.container}
        data={filteredSites.slice(0, 100)}
        ItemSeparatorComponent={Divider}
        keyExtractor={(item) => item.id}
        renderItem={(info) => {
          return (
            <SingleSite
              item={info.item}
              selectedSite={selectedSite}
              setSelectedSite={setSelectedSite}
            />
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

export default SitesScreen;
