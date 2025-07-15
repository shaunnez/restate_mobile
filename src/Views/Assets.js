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
  IndexPath,
  Select,
  SelectItem,
} from "@ui-kitten/components";
import moment from "moment";
import { StyleSheet, Alert, View } from "react-native";
import { supabase } from "../lib/supabase";
import storage from "../lib/storage";
import { useIsFocused } from "@react-navigation/native";
import SingleAsset from "../components/SingleAsset";

const statusOptions = [
  "Unknown",
  "In service",
  "Out of service",
  "Needs Maintenance",
  "Obsolete",
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
      value={statusOptions[selectedIndex]}
      status="primary"
      onSelect={(index) => {
        setSelectedIndex(index);
        callback(index.row);
      }}
    >
      <SelectItem title="Status: In Service" />
      <SelectItem title="Status: Out of Service" />
      <SelectItem title="Status: Needs Maintenance" />
      <SelectItem title="Status: Obsolute" />
      <SelectItem title="Status: All" />
    </Select>
  );
};

export const AssetsScreen = ({ navigation }) => {
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [assets, setAssets] = React.useState([]);
  const [selectedAsset, setSelectedAsset] = React.useState(null);
  const [filterStatus, setFilterStatus] = React.useState(4);
  const isFocused = useIsFocused();

  const filteredAssets = assets.filter((x, i) => {
    // if (filterStatus < 4) {
    //   if (x.status !== filterStatus + 1) {
    //     return false;
    //   }
    // }
    const text = `${x.job_id} ${x.make} ${x.model} ${x.category} ${
      x.classification
    } ${x.old_id} ${x.serial_number} ${x.barcode} ${x.type} ${
      x.customers?.name || ""
    } ${x.categories?.name || ""} ${x.addresses?.description || ""} ${
      statusOptions[x.status]
    }`.toLowerCase();

    if (!search || text.indexOf(search?.toLowerCase()) > -1) {
      return true;
    }
    return false;
  });

  filteredAssets.sort((a, b) => {
    return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
  });

  React.useEffect(() => {
    setLoading(true);
    new Promise(async (resolve) => {
      // const searchText = `'%${search}%'`;
      const { data } = await supabase
        .from("assets")
        .select(`*, suppliers(name), sites(name)`);
      // .textSearch("name", searchText, {
      //   type: "websearch",
      // });
      setAssets(data || []);
      const temp = await storage.getData("selectedAsset");
      if (temp) {
        setSelectedAsset(temp);
      }
      setLoading(false);
    });

    return () => {
      setLoading(true);
    };
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

  return (
    <Layout style={styles.layout} level="1">
      {!selectedAsset && (
        <Input
          placeholder="Search..."
          value={search}
          onChangeText={(nextValue) => setSearch(nextValue)}
          style={styles.input}
          size="large"
        />
      )}

      {!selectedAsset && (
        <StatusSelect
          defaultIndex={filterStatus}
          status="primary"
          callback={(newStatus) => {
            setFilterStatus(newStatus);
          }}
        />
      )}

      <List
        style={styles.container}
        data={selectedAsset ? [selectedAsset] : filteredAssets.slice(0, 100)}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={Divider}
        renderItem={(info) => {
          return (
            <SingleAsset
              item={info.item}
              navigation={navigation}
              fullList={true}
              editMode={true}
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

export default AssetsScreen;
