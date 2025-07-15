import React from "react";
import { StyleSheet, Alert, View, Vibration } from "react-native";
import {
  Layout,
  Text,
  Button,
  List,
  ListItem,
  Card,
  IndexPath,
  Select,
  SelectItem,
  Divider,
  Input,
  Modal,
  Toggle,
} from "@ui-kitten/components";
import axios from "axios";

import { BarCodeScanner } from "expo-barcode-scanner";
import storage from "../lib/storage";
import { useIsFocused } from "@react-navigation/native";

import { supabase } from "../lib/supabase";
import { LocationContext } from "../lib/context";
import moment from "moment";

const statusOptions = [
  "",
  "In service",
  "Out of service",
  "Needs Maintenance",
  "Obsolete",
  "Ignored",
];

const serviceDateOptions = [
  "",
  "3 months",
  "6 months",
  "12 months",
  "24 months",
];

const tagOrServiceOptions = ["", "Service", "Tagging"];

export const StatusSelect = ({ defaultIndex, callback }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(
    new IndexPath(defaultIndex)
  );
  return (
    <Select
      label="Status"
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
    </Select>
  );
};

export const TagOrService = ({ defaultIndex, callback }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(
    new IndexPath(defaultIndex)
  );
  return (
    <Select
      label="Service Type"
      size="small"
      selectedIndex={selectedIndex}
      value={tagOrServiceOptions[selectedIndex]}
      status="primary"
      onSelect={(index) => {
        setSelectedIndex(index);
        callback(index.row);
      }}
    >
      <SelectItem title="Service" />
      <SelectItem title="Tagging" />
    </Select>
  );
};

export const NextServiceDate = ({ defaultIndex, callback }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(
    new IndexPath(defaultIndex)
  );
  return (
    <Select
      label="Next Service Date"
      size="small"
      selectedIndex={selectedIndex}
      value={serviceDateOptions[selectedIndex]}
      status="primary"
      onSelect={(index) => {
        setSelectedIndex(index);
        callback(index.row);
      }}
    >
      <SelectItem title="3 months" />
      <SelectItem title="6 months" />
      <SelectItem title="12 months" />
      <SelectItem title="24 months" />
    </Select>
  );
};

const CardFooter = (props) => (
  <View
    {...props}
    // eslint-disable-next-line react/prop-types
    style={[props.style, styles.cardFooter]}
  >
    <Button
      style={styles.cardFooterButton}
      size="small"
      status="basic"
      onPress={() => {
        props.onCancel();
      }}
    >
      CANCEL
    </Button>
    <Button
      style={styles.cardFooterButton}
      size="small"
      onPress={() => {
        props.onCreate();
      }}
    >
      CREATE
    </Button>
  </View>
);

const ConfirmModal = ({ visible, setVisible, handleIgnore, handleService }) => {
  const [step, setStep] = React.useState("start");
  const [ignoreReason, setIgnoreReason] = React.useState("");
  const [serviceReason, setServiceReason] = React.useState("");
  const [materialCosts, setMaterialCosts] = React.useState("");
  const [costsIncurred, setCostsIncurred] = React.useState("");
  const [status, setStatus] = React.useState(0);
  const [serviceDate, setServiceDate] = React.useState(0);
  const [tagOrService, setTagOrService] = React.useState(0);

  React.useEffect(() => {
    if (!visible && step !== "start") {
      setStep("start");
      setIgnoreReason("");
      setServiceReason("");
      setMaterialCosts("");
      setCostsIncurred("");
      setStatus(0);
      setServiceDate(0);
      setTagOrService(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      style={styles.modal}
      backdropStyle={styles.backdrop}
      onBackdropPress={() => setVisible(false)}
    >
      <Card disabled={true}>
        {step === "start" && (
          <Text>
            This asset is in need of service/tagging, would you like to ignore,
            service now, or cancel?
          </Text>
        )}

        {step === "ignore" && (
          <Text>
            Please enter in an ignore reason and confirm it is safe to use.
          </Text>
        )}

        {step === "service" && (
          <Text>Please enter in an service reason and choose the status</Text>
        )}

        <Text style={styles.spacer}> </Text>
        {step === "ignore" && (
          <>
            <Input
              label="Ignore Reason"
              status="primary"
              size="small"
              value={ignoreReason}
              onChangeText={(nextValue) => {
                setIgnoreReason(nextValue);
              }}
            />
            <Text style={styles.spacer}> </Text>
          </>
        )}

        {step === "service" && (
          <>
            <TagOrService
              defaultIndex={tagOrService}
              callback={(newTagOrService) => {
                setTagOrService(newTagOrService);
              }}
            />
            <Text style={styles.spacer}> </Text>
            <StatusSelect
              defaultIndex={status}
              callback={(newStatus) => {
                setStatus(newStatus);
              }}
            />
            <Text style={styles.spacer}> </Text>
            <Input
              label="Description of work"
              status="primary"
              size="small"
              value={serviceReason}
              onChangeText={(nextValue) => {
                setServiceReason(nextValue);
              }}
            />
            <Text style={styles.spacer}> </Text>
            <Input
              label="Costs Incurred (exernal)"
              status="primary"
              size="small"
              value={costsIncurred}
              onChangeText={(nextValue) => {
                setCostsIncurred(nextValue);
              }}
            />
            <Text style={styles.spacer}> </Text>
            <Input
              label="Material Costs"
              status="primary"
              size="small"
              value={materialCosts}
              onChangeText={(nextValue) => {
                setMaterialCosts(nextValue);
              }}
            />
            <Text style={styles.spacer}> </Text>
            <NextServiceDate
              defaultIndex={serviceDate}
              callback={(newServiceDate) => {
                setServiceDate(newServiceDate);
              }}
            />
            <Text style={styles.spacer}> </Text>
          </>
        )}
        <View styles={[styles.modalButtons]}>
          {step === "start" && (
            <>
              <Button
                size="small"
                status="basic"
                onPress={() => setVisible(false)}
                styles={styles.modalButton}
              >
                Cancel
              </Button>
              <Text style={styles.spacer}> </Text>
              <Button
                size="small"
                status="danger"
                onPress={() => setStep("ignore")}
                styles={styles.modalButton}
              >
                Ignore
              </Button>
              <Text style={styles.spacer}> </Text>
              <Button
                size="small"
                onPress={() => setStep("service")}
                styles={styles.modalButton}
              >
                Service Now
              </Button>
            </>
          )}

          {step === "ignore" && (
            <>
              <Button
                size="small"
                status="basic"
                onPress={() => setVisible(false)}
                styles={styles.modalButton}
              >
                Cancel
              </Button>
              <Text style={styles.spacer}> </Text>
              <Button
                size="small"
                status="success"
                onPress={() => {
                  handleIgnore(ignoreReason);
                  setVisible(false);
                }}
                styles={styles.modalButton}
              >
                Save
              </Button>
            </>
          )}
          {step === "service" && (
            <>
              <Button
                size="small"
                onPress={() => setVisible(false)}
                status="basic"
              >
                Cancel
              </Button>
              <Text style={styles.spacer}> </Text>
              <Button
                size="small"
                onPress={() => {
                  setVisible(false);
                  handleService(
                    tagOrService,
                    status,
                    serviceReason,
                    costsIncurred,
                    materialCosts,
                    serviceDate
                  );
                }}
                status="success"
              >
                Save
              </Button>
            </>
          )}
        </View>
      </Card>
    </Modal>
  );
};

let barcodeScanTimeout = null;
export const ScannerScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const { location, nearbySites } = React.useContext(LocationContext);
  const [hasPermission, setHasPermission] = React.useState(null);
  const [selectedSite, setSelectedSite] = React.useState(null);
  const [selectedVehicle, setSelectedVehicle] = React.useState(null);
  const [showList, setShowList] = React.useState(false);
  const [scanList, setScanList] = React.useState([]);
  const [scanned, setScanned] = React.useState(false);
  const [showAssetForm, setShowAssetForm] = React.useState(false);
  const [showAssetFormBarcode, setShowAssetFormBarcode] = React.useState("");
  const [modalBarcode, setModalBarcode] = React.useState("");
  const [modalVisible, setModalVisible] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [session, setSession] = React.useState(null);

  const [checked, setChecked] = React.useState(true);

  const onCheckedChange = (isChecked) => {
    setChecked(isChecked);
  };

  const cloneIdx = scanList.findIndex(
    (x) => x.data.barcode === showAssetFormBarcode
  );
  const formData = cloneIdx >= 0 ? scanList[cloneIdx] : null;

  const buttons = [
    {
      text: "Close",
      style: "close",
      onPress: () => {
        setScanned(false);
      },
    },
  ];

  const validateAsset = (asset) => {
    if (asset?.status === undefined || asset?.status === null) {
      return false;
    }
    const assetStatus = statusOptions[asset.status];
    if (assetStatus !== "In service" && assetStatus !== "Unknown") {
      return false;
    }
    if (
      moment(asset.future_service_date).isValid() &&
      moment(asset.future_service_date).isBefore(moment())
    ) {
      return false;
    }
    if (
      moment(asset.false).isValid() &&
      moment(asset.false).isBefore(moment())
    ) {
      return false;
    }
    if (!asset || asset.label === "New") {
      return false;
    }
    return true;
  };

  const updateNewAssetItem = (barcode, data) => {
    const clone = [].concat(scanList);
    const cloneIdx = scanList.findIndex((x) => x.data.barcode === barcode);
    const item = cloneIdx >= 0 ? scanList[cloneIdx] : null;
    item.data.asset[data.key] = data.value;
    clone[cloneIdx] = item;
    setScanList(clone);
  };

  const handleCreate = () => {
    const clone = [].concat(scanList);
    const cloneIdx = scanList.findIndex(
      (x) => x.data.barcode === showAssetFormBarcode
    );
    const item = clone[cloneIdx];
    const { asset } = item.data;
    let isValid = true;
    if (!asset?.old_id) {
      isValid = false;
    }
    if (!asset.serial_number) {
      isValid = false;
    }
    if (!asset?.barcode) {
      isValid = false;
    }
    if (!asset?.make) {
      isValid = false;
    }

    if (!isValid) {
      item.data.asset.status = 0;
      item.data.asset.confirmed = false;
    } else {
      item.data.asset.status = 1;
      item.data.asset.confirmed = true;
    }

    item.label = checked
      ? `(New) Moving to Site: ${selectedSite.job_id} ${
          selectedSite.selectedReference
            ? `(${selectedSite.selectedReference})`
            : ""
        }`
      : "(New) Moving to Vehicle: " + selectedVehicle?.customers?.name;
    clone[cloneIdx] = item;
    setScanList(clone);

    if (isValid) {
      setShowAssetForm(false);
      setShowAssetFormBarcode("");
    } else {
      Alert.alert(
        "Oh oh",
        "You must enter in atleast a PNumber, Serial Number, Barcode and Make"
      );
    }
  };

  const confirmAsset = (barcode) => {
    const clone = [].concat(scanList);
    const cloneIdx = scanList.findIndex((x) => x.data.barcode === barcode);
    const item = cloneIdx >= 0 ? scanList[cloneIdx] : null;
    if (item.type === "new") {
      item.site_id = selectedSite?.id;
      setShowAssetFormBarcode(barcode);
      setShowAssetForm(true);
      return;
    }
    if (item?.data?.asset) {
      const confirmed = item.data?.asset?.confirmed ? true : false;
      if (!confirmed) {
        if (item.data?.asset?.isValid) {
          item.data.asset.confirmed = true;
          clone[cloneIdx] = item;
          setScanList(clone);
        } else {
          setModalBarcode(barcode);
          setModalVisible(true);
        }
      } else {
        item.data.asset.confirmed = false;
        // clone[cloneIdx] = item;
        setScanList(clone);
      }
    }
  };

  const handleIgnore = (reason) => {
    const clone = [].concat(scanList);
    const cloneIdx = scanList.findIndex((x) => x.data.barcode === modalBarcode);
    const item = cloneIdx >= 0 ? scanList[cloneIdx] : null;
    item.data.asset.status = 2;
    item.data.asset.metadata = {
      type: "ignore",
      reason: reason,
      email: session?.user?.email,
    };
    item.data.asset.confirmed = true;
    clone[cloneIdx] = item;
    setScanList(clone);
    setModalBarcode("");
  };

  const handleService = (
    tagOrService,
    status,
    serviceReason,
    costsIncurred,
    materialCosts,
    serviceDate
  ) => {
    const clone = [].concat(scanList);
    const cloneIdx = scanList.findIndex((x) => x.data.barcode === modalBarcode);
    const item = cloneIdx >= 0 ? scanList[cloneIdx] : null;
    if (tagOrService === 0) {
      item.data.asset.service_date = moment().toISOString();
      const monthsToAdd = Number(
        serviceDateOptions[serviceDate + 1].replace(" months", "")
      );
      item.data.asset.future_service_date = moment()
        .add(monthsToAdd, "months")
        .startOf("day")
        .toISOString();
    } else {
      item.data.asset.tagging_date = moment().toISOString();
      const monthsToAdd = Number(
        serviceDateOptions[serviceDate + 1].replace(" months", "")
      );
      item.data.asset.future_tagging_date = moment()
        .add(monthsToAdd, "months")
        .startOf("day")
        .toISOString();
    }
    // if (tagOrService === 0)
    item.data.asset.status = status;
    item.data.asset.metadata = {
      type: tagOrService === 0 ? "service" : "tagging",
      reason: serviceReason,
      costsIncurred: costsIncurred,
      materialCosts: materialCosts,
      email: session?.user?.email,
    };
    item.data.asset.confirmed = true;
    clone[cloneIdx] = item;
    setScanList(clone);
    setModalBarcode("");
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) {
      return;
    }
    setScanned(true);

    if (!selectedSite || !selectedVehicle) {
      return Alert.alert(
        "Oh oh!",
        "You must select a site or a vehicle to scan the asset to.",
        buttons
      );
    }
    Vibration.vibrate();
    // const closeEnoughSite = nearbySites.find(
    //   (x) => x.job_id === selectedSite?.job_id
    // );
    // if (!closeEnoughSite) {
    //   return Alert.alert(
    //     "Oh oh!",
    //     "You are not close enough to the site selected to scan items to it",
    //     buttons
    //   );
    // }

    const { data: theData } = await supabase
      .from("assets")
      .select(`*, suppliers(name), sites(*)`)
      .eq("barcode", `${data.toString()}`);

    if (theData?.length > 0) {
      const theAsset = theData[0];

      const matchSite = theAsset.site_id === selectedSite.id;
      const matchVehicle = theAsset.site_id === selectedVehicle.id;
      if (matchSite) {
        const clone = [].concat(scanList);
        if (clone.find((x) => x.id === data)) {
          // do nothing
        } else {
          clone.push({
            id: data,
            type: "move_to_vehicle",
            label: "Moving to Vehicle: " + selectedVehicle?.customers?.name,
            data: {
              barcode: data,
              asset: { ...theAsset, site_id: selectedVehicle.id },
            },
          });
          setScanList(clone);
        }
      } else if (matchVehicle) {
        const clone = [].concat(scanList);
        if (clone.find((x) => x.id === data)) {
          // do nothing
        } else {
          clone.push({
            id: data,
            type: "move_to_site",
            label: `Moving to Site: ${selectedSite.job_id} ${
              selectedSite.selectedReference
                ? `(${selectedSite.selectedReference})`
                : ""
            }`,
            data: {
              barcode: data,
              asset: { ...theAsset, site_id: selectedSite.id },
            },
          });
          setScanList(clone);
        }
      } else {
        Alert.alert(
          "Error",
          `Asset: ${data} does not belong to either the selected site or vehicle. Please check and try again.`,
          buttons
        );
      }
    } else {
      const clone = [].concat(scanList);
      if (clone.find((x) => x.id === data)) {
        Alert.alert("This asset has already been scanned");
        // setScanned(false);
      } else {
        clone.push({
          id: data,
          type: "new",
          label: "New Asset",
          data: { barcode: data, asset: { confirmed: false, isValid: false } },
        });
        setScanList(clone);
      }
    }
  };

  const handleSaveScannedItems = async () => {
    setSaving(true);
    const url =
      "https://restoration-specialists-production.up.railway.app/api/mobile_asset";
    const promises = [];
    scanList.forEach((x, i) => {
      const { asset } = x.data;
      promises.push(
        new Promise(async (resolve) => {
          try {
            const result = await axios.post(url, asset);
            if (!result) {
              throw Error();
            }
            resolve(true);
          } catch (ex) {
            resolve(false);
          }
        })
      );
    });
    const results = await Promise.all(promises);
    if (results.find((x) => x.toString() === "false")) {
      Alert.alert(
        "Oh oh!",
        "There was a problem batch updating. Please try again, or remove items and process individually"
      );
    } else {
      Alert.alert("All done!");
      setScanList([]);
      setShowList(false);
      setScanned(false);
    }
    setSaving(false);
  };

  React.useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getBarCodeScannerPermissions();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  React.useEffect(() => {
    if (isFocused) {
      // setShowList(false);
      // setScanList([]);
    }

    new Promise(async (resolve) => {
      const theSelectedSite = await storage.getData("selectedSite");
      setSelectedSite(theSelectedSite);
      const theSelectedVehicle = await storage.getData("selectedVehicle");
      setSelectedVehicle(theSelectedVehicle);
    });
  }, [isFocused]);

  React.useEffect(() => {
    scanList.forEach((x) => {
      x.data.asset.isValid = validateAsset(x.data.asset);
    });
  }, [scanList]);

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  if (showAssetForm) {
    return (
      <Layout style={styles.layout3}>
        <Card
          style={styles.layout3}
          status="primary"
          header={<Text category="s1">Asset {showAssetFormBarcode}</Text>}
          footer={
            <CardFooter
              onCancel={() => {
                setShowAssetForm(false);
                setShowAssetFormBarcode("");
              }}
              onCreate={() => {
                handleCreate();
              }}
            />
          }
        >
          <Toggle
            style={{ justifyContent: "flex-start" }}
            checked={checked}
            onChange={(isChecked) => {
              onCheckedChange(isChecked);
              if (isChecked) {
                updateNewAssetItem(showAssetFormBarcode, {
                  key: "site_id",
                  value: selectedSite.id,
                });
              } else {
                updateNewAssetItem(showAssetFormBarcode, {
                  key: "site_id",
                  value: selectedSite.vehicle,
                });
              }
            }}
          >
            {`Moving to: ${checked ? "Selected Site" : "Selected Vehicle"}`}
          </Toggle>
          <Text style={styles.spacer}> </Text>
          <Input
            label="PNumber *"
            status="primary"
            size="small"
            value={formData.data?.asset?.old_id}
            onChangeText={(nextValue) => {
              updateNewAssetItem(showAssetFormBarcode, {
                key: "old_id",
                value: nextValue,
              });
            }}
          />

          <Text style={styles.spacer}> </Text>
          <Input
            label="Serial Number *"
            status="primary"
            size="small"
            value={formData.data?.asset?.serial_number}
            onChangeText={(nextValue) => {
              updateNewAssetItem(showAssetFormBarcode, {
                key: "serial_number",
                value: nextValue,
              });
            }}
          />
          <Text style={styles.spacer}> </Text>
          <Input
            label="Barcode *"
            status="primary"
            size="small"
            value={formData.data?.asset?.barcode}
            onChangeText={(nextValue) => {
              updateNewAssetItem(showAssetFormBarcode, {
                key: "barcode",
                value: nextValue,
              });
            }}
          />
          <Text style={styles.spacer}> </Text>
          <Input
            label="Make *"
            status="primary"
            size="small"
            value={formData.data?.asset?.make}
            onChangeText={(nextValue) => {
              updateNewAssetItem(showAssetFormBarcode, {
                key: "make",
                value: nextValue,
              });
            }}
          />

          <Text style={styles.spacer}> </Text>
          <Input
            label="Model"
            status="primary"
            size="small"
            value={formData.data?.asset?.model}
            onChangeText={(nextValue) => {
              updateNewAssetItem(showAssetFormBarcode, {
                key: "model",
                value: nextValue,
              });
            }}
          />
          <Text style={styles.spacer}> </Text>
          <Input
            label="Category"
            status="primary"
            size="small"
            value={formData.data?.asset?.category}
            onChangeText={(nextValue) => {
              updateNewAssetItem(showAssetFormBarcode, {
                category: "serial_number",
                value: nextValue,
              });
            }}
          />
          <Text style={styles.spacer}> </Text>
          <Input
            label="Type"
            status="primary"
            size="small"
            value={formData.data?.asset?.type}
            onChangeText={(nextValue) => {
              updateNewAssetItem(showAssetFormBarcode, {
                key: "type",
                value: nextValue,
              });
            }}
          />
          <Text style={styles.spacer}> </Text>
          <Input
            label="Classification"
            status="primary"
            size="small"
            value={formData.data?.asset?.classification}
            onChangeText={(nextValue) => {
              updateNewAssetItem(showAssetFormBarcode, {
                key: "classification",
                value: nextValue,
              });
            }}
          />
        </Card>
      </Layout>
    );
  }

  if (showList) {
    return (
      <Layout style={styles.layout2}>
        <View style={styles.summary}>
          <Text category="s1" style={styles.text}>
            Summary: {scanList.length} item{scanList.length > 1 ? "s" : ""}{" "}
            scanned
          </Text>
          <Text style={styles.text}>
            New Items: {scanList.filter((x) => x.type === "new").length}
          </Text>
          <Text style={styles.text}>
            Moving to Site:{" "}
            {scanList.filter((x) => x.type === "move_to_site").length}
          </Text>
          <Text style={styles.text}>
            Moving to Vehicle:{" "}
            {scanList.filter((x) => x.type === "move_to_vehicle").length}
          </Text>
        </View>
        <List
          style={styles.container}
          data={scanList}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={Divider}
          renderItem={(info) => {
            const { asset, barcode } = info.item.data;
            const label = [];
            if (asset) {
              if (asset.make) {
                label.push(asset.make);
              }
              if (asset.model) {
                label.push(asset.model);
              }
              if (asset.type) {
                label.push(asset.type);
              }
            }
            if (label.length === 0) {
              label.push("New");
            }
            return (
              <ListItem
                title={`Asset ${asset.old_id || ""} (${barcode}): ${label.join(
                  ", "
                )}`}
                description={info.item.label}
              >
                <View style={styles.listItem}>
                  <Text category="s2">{`Asset ${
                    asset.old_id || ""
                  } (${barcode}): ${label.join(", ")}`}</Text>
                  <Text category="p2">{info.item.label}</Text>
                  <View style={styles.listItemButtons}>
                    <Button
                      style={[styles.listItemButton]}
                      size="small"
                      disabled={saving}
                      status={
                        asset.confirmed
                          ? "success"
                          : asset.isValid
                          ? "primary"
                          : "danger"
                      }
                      onPress={() => {
                        confirmAsset(barcode);
                        // viewDetails();
                      }}
                    >
                      {asset.confirmed ? "Confirmed" : "Confirm"}
                    </Button>
                    <Button
                      style={[styles.listItemButton]}
                      status="basic"
                      size="small"
                      disabled={saving}
                      onPress={() => {
                        const clone = [].concat(scanList);
                        const idx = scanList.findIndex(
                          (x) => x.data.barcode === barcode
                        );
                        if (idx > -1) {
                          clone.splice(idx, 1);
                          setScanList(clone);
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </View>
                </View>
              </ListItem>
            );
          }}
        />

        <View style={styles.footer}>
          <Button
            style={[styles.footerButton, styles.noMargin]}
            status="basic"
            size="small"
            disabled={saving}
            onPress={() => {
              setShowList(false);
            }}
          >
            Scan more
          </Button>
          <Button
            style={[styles.footerButton]}
            size="small"
            disabled={
              scanList.find((x) => x.data?.asset?.confirmed !== true) || saving
                ? true
                : false
            }
            onPress={() => {
              handleSaveScannedItems();
            }}
          >
            {saving ? "Saving..." : "Complete"}
          </Button>
        </View>

        <ConfirmModal
          visible={modalVisible}
          setVisible={setModalVisible}
          handleIgnore={handleIgnore}
          handleService={handleService}
        />
      </Layout>
    );
  }
  return (
    <Layout style={styles.layout}>
      <BarCodeScanner
        onBarCodeScanned={handleBarCodeScanned}
        style={styles.barcode}
      />

      {scanned > 0 && (
        <Button
          style={styles.message}
          size="small"
          onPress={() => {
            setScanned(false);
          }}
        >
          Tap to scan something else
        </Button>
      )}
      {scanList.length > 0 && (
        <View style={styles.footer}>
          <Text>Scanned {scanList.length} unique items </Text>
          <Button
            style={[styles.footerButton]}
            size="small"
            onPress={() => {
              setShowList(true);
            }}
          >
            Review
          </Button>
          <Button
            style={[styles.footerButton]}
            status="basic"
            size="small"
            onPress={() => {
              setScanList([]);
              setScanned(false);
            }}
          >
            Clear
          </Button>
        </View>
      )}

      {/* <View style={styles.overlay}>Scanned serial numbers</View> */}
    </Layout>
  );
};

const styles = StyleSheet.create({
  layout3: {
    flex: 1,
  },
  layout: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  layout2: {
    flex: 1,
    paddingBottom: 40,
  },
  summary: {
    flex: 0,
    padding: 8,
    backgroundColor: "white",
    margin: 8,
    border: "1px solid black",
    borderRadius: 8,
  },
  text: {
    color: "black",
  },
  heading: {
    marginTop: 20,
  },
  barcode: {
    width: "100%",
    height: "100%",
  },
  message: {
    position: "absolute",
    zIndex: 1,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listItem: {
    flexDirection: "column",
    flex: 1,
  },
  listItemButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listItemButton: {
    flexGrow: 10,
    marginTop: 10,
    borderRadius: 0,
    marginRight: 5,
    marginLeft: 5,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardFooterButton: {
    flex: 1,
    flexGrow: 1,
    marginRight: 5,
    marginLeft: 5,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    backgroundColor: "#333",
    padding: 10,
    justifyContent: "center",
    textAlign: "center",
    alignItems: "center",
    width: "100%",
  },
  footerButton: {
    marginTop: 10,
    width: "100%",
  },
  noMargin: {
    marginTop: 0,
  },
  container: {
    flex: 1,
  },
  card: {
    flex: 0,
    margin: 5,
    borderColor: "white",
  },
  buttonWrapper: {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
  },
  heading: {
    backgroundColor: "#333",
    padding: 10,
    textAlign: "center",
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalButtons: {
    flex: 1,
    marginTop: 5,
  },
  modalButton: {
    flex: 1,
    flexGrow: 1,
    marginRight: 5,
    marginLeft: 5,
  },
});

export default ScannerScreen;
