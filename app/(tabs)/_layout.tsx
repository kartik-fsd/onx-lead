import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#f4511e",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Tasker Details",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="seller"
        options={{
          title: "Seller Details",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="products"
        options={{
          title: "Products Details",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
