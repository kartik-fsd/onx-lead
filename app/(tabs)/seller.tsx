import React, { useEffect, useState } from "react";
import { View, TextInput, StyleSheet, ScrollView, Image } from "react-native";
import { router } from "expo-router";
import { Text, Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { saveRegistrationData, getRegistrationData } from "@/utils/storage";
import { SellerDetails } from "@/types";

export default function SellerDetailsScreen() {
  const [sellerDetails, setSellerDetails] = useState<SellerDetails>({
    sellerName: "",
    shopName: "",
    shopImage: "",
    gstNumber: "",
    sellerPhoneNumber: "",
    productCount: 0,
  });
  const [errors, setErrors] = useState<Partial<SellerDetails>>({});

  useEffect(() => {
    loadSavedData();
    requestPermissions();
  }, []);

  const loadSavedData = async () => {
    const savedData = await getRegistrationData();
    if (savedData?.sellerDetails) {
      setSellerDetails(savedData.sellerDetails);
    }
  };

  const requestPermissions = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
      if (!result.canceled) {
        const base64Image = await FileSystem.readAsStringAsync(
          result.assets[0].uri,
          {
            encoding: FileSystem.EncodingType.Base64,
          }
        );
        setSellerDetails({
          ...sellerDetails,
          shopImage: `data:image/jpeg;base64,${base64Image}`,
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const validateForm = () => {
    const gstRegex =
      /^([0-9]{2})([A-Z]{5})([0-9]{4})([A-Z]{1})([1-9A-Z]{1})(Z)([0-9A-Z]{1})$/;
    const newErrors: Partial<SellerDetails> = {};

    if (!sellerDetails.sellerName)
      newErrors.sellerName = "Seller name is required";
    if (!sellerDetails.shopName) newErrors.shopName = "Shop name is required";
    if (!sellerDetails.shopImage)
      newErrors.shopImage = "Shop image is required";
    if (!sellerDetails.gstNumber) {
      newErrors.gstNumber = "GST number is required";
    } else if (!gstRegex.test(sellerDetails.gstNumber)) {
      newErrors.gstNumber = "Invalid GST number";
    }
    if (!sellerDetails.sellerPhoneNumber) {
      newErrors.sellerPhoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(sellerDetails.sellerPhoneNumber)) {
      newErrors.sellerPhoneNumber = "Invalid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const saved = await saveRegistrationData({ sellerDetails });
      if (saved) {
        router.push("/products");
      }
    }
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Seller Details
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Seller Name</Text>
          <TextInput
            value={sellerDetails.sellerName}
            onChangeText={(text) =>
              setSellerDetails({ ...sellerDetails, sellerName: text })
            }
            style={styles.input}
            placeholder="Seller Name"
          />
          {errors.sellerName && (
            <Text style={styles.error}>{errors.sellerName}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Shop Name</Text>
          <TextInput
            value={sellerDetails.shopName}
            onChangeText={(text) =>
              setSellerDetails({ ...sellerDetails, shopName: text })
            }
            style={styles.input}
            placeholder="Shop name"
          />
          {errors.shopName && (
            <Text style={styles.error}>{errors.shopName}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>GST Number</Text>
          <TextInput
            value={sellerDetails.gstNumber}
            onChangeText={(text) =>
              setSellerDetails({ ...sellerDetails, gstNumber: text })
            }
            style={styles.input}
            placeholder="22AAAAA0000A1Z5"
          />
          {errors.gstNumber && (
            <Text style={styles.error}>{errors.gstNumber}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={sellerDetails.sellerPhoneNumber}
            onChangeText={(text) =>
              setSellerDetails({ ...sellerDetails, sellerPhoneNumber: text })
            }
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
            placeholder="Phone Number"
          />
          {errors.sellerPhoneNumber && (
            <Text style={styles.error}>{errors.sellerPhoneNumber}</Text>
          )}
        </View>

        <View style={styles.imageContainer}>
          <Text style={styles.label}>Shop Image</Text>
          {sellerDetails.shopImage ? (
            <View>
              <Image
                source={{ uri: sellerDetails.shopImage }}
                style={styles.image}
              />
              <Button
                mode="outlined"
                onPress={() =>
                  setSellerDetails({ ...sellerDetails, shopImage: "" })
                }
                style={styles.deleteButton}
                textColor="#B3261E"
              >
                Delete Image
              </Button>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text>No image selected</Text>
            </View>
          )}
          <View style={styles.imageButtons}>
            <Button
              mode="contained"
              onPress={() => pickImage(false)}
              style={styles.imageButton}
              buttonColor="#312e81"
            >
              Upload Image
            </Button>
            <Button
              mode="contained"
              onPress={() => pickImage(true)}
              style={styles.imageButton}
              buttonColor="#312e81"
            >
              Take Photo
            </Button>
          </View>
          {errors.shopImage && (
            <Text style={styles.error}>{errors.shopImage}</Text>
          )}
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          buttonColor="#312e81"
        >
          Next
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#1c1c1c",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 5,
    fontSize: 16,
  },
  error: {
    color: "#B3261E",
    fontSize: 12,
    marginTop: 4,
  },
  imageContainer: {
    marginBottom: 24,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  imageButtons: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
  },
  deleteButton: {
    marginTop: 10,
    borderColor: "#B3261E",
    borderWidth: 1,
  },
  imageButton: {
    flex: 1,
  },
  button: {
    marginTop: 32,
  },
});
