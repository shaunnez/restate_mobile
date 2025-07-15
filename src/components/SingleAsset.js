import React, { useEffect, memo } from "react";
import {
  Text,
  Button,
  Card,
  Input,
  Select,
  SelectItem,
  IndexPath,
  CheckBox,
  Datepicker,
} from "@ui-kitten/components";
import moment from "moment";
import { StyleSheet, View } from "react-native";
import axios from "axios";

const statusOptions = [
  "Unknown",
  "In service",
  "Out of service",
  "Maintenance",
  "Obsolete",
];

export const StatusSelect = ({ defaultIndex, callback }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(
    new IndexPath(defaultIndex)
  );
  return (
    <Select
      size="small"
      label="Status"
      selectedIndex={selectedIndex}
      value={statusOptions[selectedIndex - 1]}
      status="primary"
      onSelect={(index) => {
        setSelectedIndex(index);
        callback(index.row);
      }}
    >
      <SelectItem title="Unknown" />
      <SelectItem title="In Service" />
      <SelectItem title="Out of Service" />
      <SelectItem title="Needs Maintenance" />
      <SelectItem title="Obsolute" />
    </Select>
  );
};

const CardFooter = (props) => {
  return (
    <View
      {...props}
      // eslint-disable-next-line react/prop-types
      // style={[props.style, styles.footerContainer]}
    >
      {props.editMode ? (
        <>
          <Button
            style={styles.footerControl}
            size="small"
            status="basic"
            onPress={props.onCancel}
          >
            CANCEL
          </Button>
          <Button
            style={styles.footerControl}
            size="small"
            onPress={props.onSave}
          >
            SAVE
          </Button>
        </>
      ) : (
        <>
          {/* <Button
            style={styles.footerControl}
            size="small"
            status="basic"
            onPress={() => {
              console.log("editing");
              props.onEdit();
            }}
          >
            EDIT
          </Button> */}
          <Button
            // style={styles.footerControl}
            size="small"
            onPress={props.onScan}
          >
            SCAN
          </Button>
        </>
      )}
    </View>
  );
};
export const SingleAsset = ({ item, navigation, editMode, fullList }) => {
  const [formData, setFormData] = React.useState(item);

  const [saving, setSaving] = React.useState(false);
  const [expanded, setExpanded] = React.useState(fullList ? true : false);

  const label = [];
  if (item.make) {
    label.push(item.make);
  }
  if (item.model) {
    label.push(item.model);
  }
  if (item.type) {
    label.push(item.type);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const url =
        "https://restoration-specialists-production.up.railway.app/api/asset_barcode";
      const result = await axios.post(url, {
        id: item.id,
        barcode: formData.barcode,
      });
      if (!result) {
        throw Error();
      }
      Alert.alert("All saved!");
    } catch (ex) {
      Alert.alert(
        "Oh oh",
        "There was a problem saving, please try again or reload the app"
      );
    }
    setSaving(false);
  };
  return (
    <Card
      style={[styles.card]}
      status="primary"
      header={
        <Text
          category="s1"
          onPress={(e) => {
            setExpanded(!expanded);
          }}
        >
          Asset {item.old_id || ""}: {label.join(", ")}{" "}
        </Text>
      }
      footer={
        expanded ? (
          <>
            <Button
              size="small"
              disabled={saving}
              onPress={(e) => {
                handleSave();
                // setSelectedSite(null);
                // storage.removeData("selectedSite");
              }}
            >
              {saving ? "Saving..." : "Update Barcode"}
            </Button>
          </>
        ) : null
      }
    >
      {!expanded ? (
        <></>
      ) : (
        <>
          {editMode ? (
            <>
              <Input
                label="Barcode"
                status="primary"
                size="small"
                value={formData.barcode}
                onChangeText={(nextValue) => {
                  setFormData({ ...formData, barcode: nextValue });
                }}
              />
              <Text style={styles.spacer}> </Text>
            </>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.firstText} category="s1">
                  Barcode:
                </Text>
                <Text style={styles.secondText}>{item.barcode}</Text>
              </View>
            </>
          )}
          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Serial Number:
            </Text>
            <Text style={styles.secondText}>{item.serial_number}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Status:
            </Text>
            <Text style={styles.secondText}>{statusOptions[item.status]}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Site Reference:
            </Text>
            <Text style={styles.secondText}>{item.purchase_order_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Supplier:
            </Text>
            <Text style={styles.secondText}>{item.suppliers?.name}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Tagging Date:
            </Text>
            <Text style={styles.secondText}>
              {" "}
              {moment(item?.tagging_date).isValid()
                ? moment(item?.tagging_date).format("DD/MM/YYYY")
                : ""}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Future Tagging Date:
            </Text>
            <Text style={styles.secondText}>
              {" "}
              {moment(item?.future_tagging_date).isValid()
                ? moment(item?.future_tagging_date).format("DD/MM/YYYY")
                : ""}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Service Date:
            </Text>
            <Text style={styles.secondText}>
              {" "}
              {moment(item?.service_date).isValid()
                ? moment(item?.service_date).format("DD/MM/YYYY")
                : ""}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.firstText} category="s1">
              Future Service Date:
            </Text>
            <Text style={styles.secondText}>
              {" "}
              {moment(item?.future_service_date).isValid()
                ? moment(item?.future_service_date).format("DD/MM/YYYY")
                : ""}
            </Text>
          </View>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 0,
    margin: 5,
    borderColor: "white",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerControl: {
    width: "45%",
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
  },
  firstText: {
    width: "45%",
  },
  secondText: {
    width: "55%",
  },
});

export default memo(SingleAsset);
