//frontend/app/(auth)/sign-in

import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="notifikasi" options={{headerShown: false}}/>
      <Stack.Screen name="change-password" options={{headerShown: false}}/>
      <Stack.Screen name="faq" options={{headerShown: false}}/>
      <Stack.Screen name="booking-room" options={{headerShown: false}}/>
      <Stack.Screen name="booking-transport" options={{headerShown: false}}/>
      <Stack.Screen name="detail-bookingRoom" options={{headerShown: false}}/>
      <Stack.Screen name="detail-bookingTransport" options={{headerShown: false}}/>
      <Stack.Screen name="detail" options={{headerShown: false}}/>
      <Stack.Screen name="reschedule-booking" options={{headerShown: false}}/>
    </Stack>
  );
};

export default Layout;
