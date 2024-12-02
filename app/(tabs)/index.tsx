import React, { useEffect, useState } from "react";
import { View, TextInput, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { Text, Button } from "react-native-paper";
import { TaskerDetails } from "@/types";
import { getRegistrationData, saveRegistrationData } from "@/utils/storage";

export default function TaskerDetailsScreen() {
  const [taskerDetails, setTaskerDetails] = useState<TaskerDetails>({
    name: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<TaskerDetails>>({});

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    const savedData = await getRegistrationData();
    if (savedData?.taskerDetails) {
      setTaskerDetails(savedData.taskerDetails);
    }
  };

  const validateForm = () => {
    const newErrors: Partial<TaskerDetails> = {};
    if (!taskerDetails.name) newErrors.name = "Name is required";
    if (!taskerDetails.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(taskerDetails.phone)) {
      newErrors.phone = "Invalid phone number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const saved = await saveRegistrationData({ taskerDetails });
      if (saved) {
        router.push("/seller");
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Tasker Details
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={taskerDetails.name}
            onChangeText={(text) =>
              setTaskerDetails({ ...taskerDetails, name: text })
            }
          />
          {errors.name && <Text style={styles.error}>{errors.name}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={taskerDetails.phone}
            onChangeText={(text) =>
              setTaskerDetails({ ...taskerDetails, phone: text })
            }
            keyboardType="phone-pad"
            maxLength={10}
          />
          {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}
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
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 5,
    fontSize: 16,
  },
  error: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    marginTop: 30,
  },
});
