import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Text, Button, IconButton, Card } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import {
  saveRegistrationData,
  getRegistrationData,
  clearRegistrationData,
} from "@/utils/storage";
import { ProductDetails } from "@/types";
import { router } from "expo-router";

export default function ProductsScreen() {
  const intialData = {
    name: "",
    mrp: "",
    msp: "",
    image1: "",
    image2: "",
    image3: "",
  };
  const [productQuantity, setProductQuantity] = useState<string>("02");
  const [currentProduct, setCurrentProduct] =
    useState<ProductDetails>(intialData);
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductDetails, string>>
  >({});
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Explicitly calculate canSubmit and canAddProduct
  const canSubmit = products.length >= parseInt(productQuantity);
  const canAddProduct = products.length < parseInt(productQuantity);

  useEffect(() => {
    loadSavedData();
    requestPermissions();
  }, []);

  const loadSavedData = async () => {
    const savedData = await getRegistrationData();
    if (savedData?.products) {
      setProducts(savedData.products);
    }
  };

  const requestPermissions = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  };

  const validateFields = (product: ProductDetails) => {
    const errors: Partial<ProductDetails> = {};
    if (!product.name) errors.name = "Product name is required.";
    if (!product.mrp) errors.mrp = "MRP is required.";
    if (!product.msp) errors.msp = "MSP is required.";
    if (!product.image1) errors.image1 = "First image is required.";
    if (!product.image2) errors.image2 = "Second image is required.";
    return errors;
  };

  const validateProduct = (): boolean => {
    const newErrors = validateFields(currentProduct);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePick = async (
    field: keyof ProductDetails,
    useCamera: boolean
  ) => {
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
        setCurrentProduct((prev) => ({
          ...prev,
          [field]: `data:image/jpeg;base64,${base64Image}`,
        }));
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const handleDeleteProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    saveRegistrationData({ products: updatedProducts });
  };

  const handleAddProduct = useCallback(async () => {
    if (validateProduct()) {
      setIsAddingProduct(true); // Start loading state
      try {
        const updatedProducts = [...products, currentProduct];
        const saved = await saveRegistrationData({ products: updatedProducts });

        if (saved) {
          setProducts(updatedProducts);
          setCurrentProduct(intialData);
        }
      } catch (error) {
        console.error("Error adding product:", error);
      } finally {
        setIsAddingProduct(false); // End loading state
      }
    }
  }, [currentProduct, products]);

  const handleSubmitAll = async () => {
    if (!canSubmit) {
      Alert.alert(
        "Error",
        `Add all ${productQuantity} products before submitting.`
      );
      return;
    }

    setIsSubmitting(true); // Start loading state
    try {
      const savedData = await getRegistrationData();

      if (!savedData?.taskerDetails || !savedData?.sellerDetails) {
        Alert.alert("Error", "Complete tasker and seller details first.");
        return;
      }

      savedData.sellerDetails.productCount = products.length;

      const response = await fetch(
        "https://tools.onxtasks.com/api/registration",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskerDetails: savedData.taskerDetails,
            sellerDetails: savedData.sellerDetails,
            products,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        await clearRegistrationData();
        Alert.alert("Success", "Registration submitted successfully.");
        setProducts([]);
        setCurrentProduct(intialData);
        router.push("/");
      } else {
        Alert.alert("Error", "Failed to submit registration.");
        console.error(result);
      }
    } catch (error) {
      Alert.alert("Error", "Network error, try again later.");
      console.error(error);
    } finally {
      setIsSubmitting(false); // End loading state
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Product Details
        </Text>

        <View style={styles.quantitySelector}>
          <Text style={styles.label}>Select Product Quantity:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.quantityScroll}
          >
            {["02", "30", "75", "100", "250", "500", "1000"].map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setProductQuantity(value)}
                style={[
                  styles.quantityButton,
                  productQuantity === value && styles.selectedQuantityButton,
                ]}
              >
                <Text
                  style={[
                    styles.quantityButtonLabel,
                    productQuantity === value
                      ? styles.selectedQuantityLabel
                      : styles.unselectedQuantityLabel,
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.progress}>
          Progress: {Math.min(products.length, parseInt(productQuantity))}/
          {productQuantity} products
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            value={currentProduct.name}
            onChangeText={(text) =>
              setCurrentProduct((prev) => ({ ...prev, name: text }))
            }
            style={styles.input}
            placeholder="Enter product name"
          />
          {errors.name && <Text style={styles.error}>{errors.name}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>MRP</Text>
          <TextInput
            value={currentProduct.mrp}
            onChangeText={(text) =>
              setCurrentProduct((prev) => ({ ...prev, mrp: text }))
            }
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="Enter MRP"
          />
          {errors.mrp && <Text style={styles.error}>{errors.mrp}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>MSP</Text>
          <TextInput
            value={currentProduct.msp}
            onChangeText={(text) =>
              setCurrentProduct((prev) => ({ ...prev, msp: text }))
            }
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="Enter MSP"
          />
          {errors.msp && <Text style={styles.error}>{errors.msp}</Text>}
        </View>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Product Images</Text>
            <Text style={styles.label}>First Image</Text>
            {currentProduct.image1 ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: currentProduct.image1 }}
                  style={styles.image}
                />
                <IconButton
                  icon="delete"
                  onPress={() =>
                    setCurrentProduct((prev) => ({ ...prev, image1: "" }))
                  }
                  style={styles.deleteButton}
                  iconColor="#B00020"
                />
              </View>
            ) : (
              <>
                <View style={styles.buttonGroup}>
                  <Button
                    mode="contained"
                    style={styles.imageButton}
                    onPress={() => handleImagePick("image1", false)}
                  >
                    Choose Image 1
                  </Button>
                  <Button
                    mode="contained"
                    style={styles.imageButton}
                    onPress={() => handleImagePick("image1", true)}
                  >
                    Capture Image 1
                  </Button>
                </View>
              </>
            )}
            <Text style={styles.label}>Second Image</Text>
            {currentProduct.image2 ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: currentProduct.image2 }}
                  style={styles.image}
                />
                <IconButton
                  icon="delete"
                  onPress={() =>
                    setCurrentProduct((prev) => ({ ...prev, image2: "" }))
                  }
                  style={styles.deleteButton}
                  iconColor="#B00020"
                />
              </View>
            ) : (
              <>
                <View style={styles.buttonGroup}>
                  <Button
                    mode="contained"
                    style={styles.imageButton}
                    onPress={() => handleImagePick("image2", false)}
                  >
                    Choose Image 2
                  </Button>
                  <Button
                    mode="contained"
                    style={styles.imageButton}
                    onPress={() => handleImagePick("image2", true)}
                  >
                    Capture Image 2
                  </Button>
                </View>
              </>
            )}
            <Text style={styles.label}>Third Image (Optional)</Text>
            {currentProduct.image3 ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: currentProduct.image3 }}
                  style={styles.image}
                />
                <IconButton
                  icon="delete"
                  onPress={() =>
                    setCurrentProduct((prev) => ({ ...prev, image3: "" }))
                  }
                  style={styles.deleteButton}
                  iconColor="#B00020"
                />
              </View>
            ) : (
              <>
                <View style={styles.buttonGroup}>
                  <Button
                    mode="contained"
                    style={styles.imageButton}
                    onPress={() => handleImagePick("image3", false)}
                  >
                    Choose Image 3
                  </Button>
                  <Button
                    mode="contained"
                    style={styles.imageButton}
                    onPress={() => handleImagePick("image3", true)}
                  >
                    Capture Image 3
                  </Button>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
        <Button
          mode="contained"
          onPress={handleAddProduct}
          disabled={!canAddProduct || isAddingProduct}
          loading={isAddingProduct}
          style={[
            styles.button,
            { backgroundColor: canAddProduct ? "#312e81" : "#ddd" },
          ]}
          labelStyle={[
            styles.buttonLabel,
            { color: canAddProduct ? "#ffffff" : "#666666" },
          ]}
        >
          {isAddingProduct ? "Adding..." : "Add Product"}
        </Button>

        {products.length > 0 && (
          <View style={styles.productsList}>
            <Text style={[styles.label, styles.productsTitle]}>
              Added Products:
            </Text>
            {products.map((product, index) => (
              <View key={index} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text>
                    MRP: ₹{product.mrp} | MSP: ₹{product.msp}
                  </Text>
                </View>
                <IconButton
                  icon="delete"
                  size={25}
                  onPress={() => handleDeleteProduct(index)}
                  iconColor="#B00020"
                />
              </View>
            ))}
          </View>
        )}

        {products.length >= parseInt(productQuantity) && (
          <Button
            mode="contained"
            onPress={handleSubmitAll}
            disabled={isSubmitting}
            loading={isSubmitting}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonText}
          >
            {isSubmitting ? "Submitting..." : "Submit All"}
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20 },
  title: { marginBottom: 32, textAlign: "center" },
  quantitySelector: { marginBottom: 24 },
  progress: { marginBottom: 24, fontSize: 16, fontWeight: "bold" },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 16, marginBottom: 14, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  error: { color: "#B3261E", fontSize: 12, marginTop: 4 },
  imageContainer: { marginBottom: 24 },
  image: { width: "100%", height: 200, borderRadius: 8 },
  deleteButton: { position: "absolute", top: -2, right: -3 },
  productsList: { marginTop: 32 },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 8,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: "bold" },
  productsTitle: {
    marginBottom: 16,
  },
  quantityScroll: {
    flexDirection: "row",
    paddingVertical: 8,
    alignItems: "center",
    gap: 8,
  },
  quantityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#f3f3f3", // Default background
  },
  selectedQuantityButton: {
    backgroundColor: "#312e81", // Highlight selected button
  },
  quantityButtonLabel: {
    fontSize: 14,
  },
  selectedQuantityLabel: {
    color: "#fff", // Selected text color
  },
  unselectedQuantityLabel: {
    color: "#888", // Default text color
  },
  button: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 5,
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: "#312e81",
    opacity: 1,
  },
  disabledButton: {
    backgroundColor: "#ddd",
    opacity: 0.7,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  activeButtonLabel: {
    color: "#ffffff",
  },
  disabledButtonLabel: {
    color: "#666666",
  },
  submitButtonContent: {
    height: 50,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
  card: {
    marginVertical: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  // Title inside the card
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
    textAlign: "center",
  },

  // Grouping buttons for images
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
    gap: 10,
  },

  // Individual buttons for images
  imageButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
  },

  // Button text style (in case customization is needed)
  buttonText: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
});
