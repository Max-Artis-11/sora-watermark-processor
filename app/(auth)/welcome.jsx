import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts
} from "@expo-google-fonts/inter";

import { Octicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Alert, Dimensions, Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

SplashScreen.preventAutoHideAsync();
WebBrowser.maybeCompleteAuthSession();

export default function Welcome() {
  const router = useRouter();
  const { height } = Dimensions.get("window");

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Google Auth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "551372277226-jrqf2r5416e2bmrnb1qemhn3ohvg1l3d.apps.googleusercontent.com",
    iosClientId: "551372277226-tdmpb5i63dm4ogf6nafc4nibaptunroe.apps.googleusercontent.com",
  });

  // Redirect automatically if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        router.replace("/(main)/index");
      }
    };
    checkSession();
  }, []);

  // Handle Google login response
  useEffect(() => {
    const handleGoogleLogin = async () => {
      if (response?.type === "success") {
        const { id_token } = response.params;
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: id_token,
        });

        if (error) {
          console.log("Supabase Google Login Error:", error);
          Alert.alert("Google login failed: " + error.message);
          return;
        }

        router.replace("/(main)/index");
      }
    };
    handleGoogleLogin();
  }, [response]);

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const soraTop = height * 0.28;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Gear Icon */}
      <View style={{ position: "absolute", top: 60, right: 20 }}>
        <Octicons name="gear" size={26} color="#FFF" />
      </View>

      {/* App Title */}
      <View style={{ marginTop: soraTop, alignItems: "center" }}>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 60, color: "#FFF" }}>Sora</Text>
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            fontSize: 28,
            color: "#FFF",
            marginTop: 12,
            textAlign: "center"
          }}
        >
          Watermark Adder & Remover
        </Text>
      </View>

      {/* Buttons */}
      <View style={{ position: "absolute", bottom: 65, width: "100%", paddingHorizontal: 28 }}>
        
        {/* APPLE LOGIN */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            height: 60,
            borderRadius: 60,
            backgroundColor: "#FFF",
            marginBottom: 18,
          }}
          onPress={async () => {
            if (Platform.OS === "ios" && !(await AppleAuthentication.isAvailableAsync())) {
              Alert.alert("Apple login not available on this device");
              return;
            }
            try {
              const appleCredential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                  AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                  AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
              });
              if (Platform.OS === "ios") {
                const { data, error } = await supabase.auth.signInWithIdToken({
                  provider: "apple",
                  token: appleCredential.identityToken,
                });
                if (error) {
                  Alert.alert("Apple login failed: " + error.message);
                  return;
                }
              }
              router.replace("/(main)/index");
            } catch (err) {
              conaaole.log("Apple Login Error:", err);
            }
          }}
        >
          <Image source={require("../../assets/images/apple.png")} style={{ width: 22, height: 22, marginRight: 8 }} />
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 22, color: "#000" }}>Continue with Apple</Text>
        </TouchableOpacity>

        {/* GOOGLE LOGIN */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            height: 60,
            borderRadius: 60,
            backgroundColor: "#3A4A63",
            marginBottom: 18,
          }}
          disabled={!request}
          onPress={() => {
            promptAsync();
          }}
        >
          <Image source={require("../../assets/images/google.png")} style={{ width: 28, height: 28, marginRight: 8 }} />
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 22, color: "#FFF" }}>Continue with Google</Text>
        </TouchableOpacity>

        {/* SIGN UP / LOGIN */}
        <TouchableOpacity
          style={{
            height: 60,
            borderRadius: 60,
            backgroundColor: "#3A4A63",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 18
          }}
          onPress={() => router.replace("/(auth)/signup")}
        >
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 22, color: "#FFF" }}>
            Sign Up
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            height: 60,
            borderRadius: 60,
            borderWidth: 2,
            borderColor: "#3A4A63",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 40,
          }}
          onPress={() => router.replace("/(auth)/login")} // navigate to login.jsx inside (auth)
        >
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 22, color: "#FFF" }}>
            Log In
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={{ textAlign: "center", fontSize: 18, color: "#8F96AB", fontFamily: "Inter_500Medium" }}>
          By using Sora you agree to the <Text style={{ color: "#FFF" }}>Terms</Text> & <Text style={{ color: "#FFF" }}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}
