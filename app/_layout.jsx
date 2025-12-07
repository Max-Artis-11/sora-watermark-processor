// app/_layout.jsx
import { Inter_400Regular, useFonts } from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { createContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../lib/supabase";

SplashScreen.preventAutoHideAsync();

export const SessionContext = createContext(null);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular });
  const [session, setSession] = useState(undefined); // undefined = loading session

  useEffect(() => {
    if (!fontsLoaded) return;

    async function init() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null); // If no stored session, null
      SplashScreen.hideAsync();
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, sess) => setSession(sess ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, [fontsLoaded]);

  // Don't render navigation until session is loaded
  if (!fontsLoaded || session === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      <Stack screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="(main)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
      </Stack>
    </SessionContext.Provider>
  );
}