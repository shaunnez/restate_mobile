import React, { useEffect, memo } from "react";
import { Text, Button, Card } from "@ui-kitten/components";
import { StyleSheet, View, Alert } from "react-native";
import prompt from "react-native-prompt-android";
import storage from "../lib/storage";

const siteStatus = [
  "Unknown",
  "Work Order",
  "Quote",
  "Completed",
  "Unsuccessful",
  "All",
];
export const SingleSite = ({
  item,
  selectedSite,
  setSelectedSite,
  navigation,
  editMode,
  fullList,
}) => {
  const [formData, setFormData] = React.useState(item);
  const [saving, setSaving] = React.useState(false);
  return (
    <Card
      style={styles.card}
      status="primary"
      header={
        <Text category="s1">{`Job ${item.job_id}: ${item.addresses?.description}`}</Text>
      }
      footer={
        <>
          <Button
            size="small"
            onPress={(e) => {
              if (item?.id === selectedSite?.id) {
                item.selectedReference = null;
                setSelectedSite(null);
                storage.removeData("selectedSite");
              } else {
                if (item?.purchase_order_numbers?.split(",").length > 1) {
                  prompt(
                    "Choose enter in one of the references",
                    item.purchase_order_numbers,
                    [
                      {
                        text: "Cancel",
                        onPress: () => console.log("Cancel Pressed"),
                        style: "cancel",
                      },
                      {
                        text: "OK",
                        onPress: (result) => {
                          if (
                            item.purchase_order_numbers.indexOf(
                              result.toUpperCase()
                            ) === -1
                          ) {
                            return Alert.alert(
                              "Oh oh",
                              "This is not a valid reference, please try again"
                            );
                          }
                          setSelectedSite({
                            ...item,
                            selectedReference: result.toUpperCase(),
                          });
                          storage.storeData("selectedSite", {
                            ...item,
                            selectedReference: result.toUpperCase(),
                          });
                        },
                      },
                    ],
                    {
                      type: "plain-text",
                      defaultValue: "",
                      placeholder: "",
                    }
                  );
                } else {
                  setSelectedSite(item);
                  storage.storeData("selectedSite", item);
                }

                // const closeEnough = nearbySites.find(
                //   (x) => x.job_id === item.job_id
                // );
                // if (closeEnough) {
                //   setSelectedSite(item);
                //   storage.storeData("selectedSite", item);
                //   Alert.alert("Job " + item.job_id + " selected");
                // } else {
                //   Alert.alert(
                //     "You are not close enough to select this site"
                //   );
                // }
              }
            }}
          >
            {selectedSite?.id === item?.id ? "Selected" : "Select"}
          </Button>
        </>
      }
    >
      <View style={styles.row}>
        <Text style={styles.firstText} category="s1">
          Customer:
        </Text>
        <Text style={styles.secondText}>{item.customers?.name}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.firstText} category="s1">
          Category:
        </Text>
        <Text style={styles.secondText}>{item.categories?.name}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.firstText} category="s1">
          Assets on Site:
        </Text>
        <Text style={styles.secondText}>{item.assets?.length || 0}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.firstText} category="s1">
          References:
        </Text>
        <Text style={styles.secondText}>{item?.purchase_order_numbers}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.firstText} category="s1">
          Status:
        </Text>
        <Text style={styles.secondText}>{siteStatus[item.status]}</Text>
      </View>
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

export default memo(SingleSite);
