import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync();

export default function Login() {
  const router = useRouter();
  const { height } = Dimensions.get("window");

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);

  const topOffset = height * 0.2;

  // Google Auth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "<YOUR_EXPO_CLIENT_ID>",
    iosClientId: "<YOUR_IOS_CLIENT_ID>",
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
    setTimeout(() => emailRef.current?.focus(), 150);
  }, [fontsLoaded]);

  useEffect(() => {
    setIsValidEmail(email.includes("@") && email.includes("."));
  }, [email]);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      supabase.auth.signInWithIdToken({ provider: "google", token: id_token })
        .then(({ error }) => {
          if (error) {
            Alert.alert("Google login failed", error.message);
            return;
          }
          router.replace("/");
        });
    }
  }, [response]);

  if (!fontsLoaded) return null;

  const handleLogin = async () => {
    if (!isValidEmail || password.length < 6) {
      Alert.alert("Invalid input", "Please enter a valid email and password.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Login failed", error.message);
      return;
    }

    router.replace("/"); // successfully logged in
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {/* Back Button */}
        <TouchableOpacity
          style={{ position: "absolute", top: 50, left: 17 }}
          onPress={() => router.replace("/(auth)/welcome")}
          activeOpacity={1}
        >
          <Feather name="chevron-left" size={30} color="#FFF" />
        </TouchableOpacity>

        {/* Main Content */}
        <View style={{ marginTop: topOffset, alignItems: "center", paddingHorizontal: 28 }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 40, color: "#FFF", marginBottom: 10 }}>
            Log In
          </Text>

          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 18, color: "#8F96AB", textAlign: "center", marginBottom: 20 }}>
            Don't have an account?{" "}
            <Text
              style={{ color: "#FFF" }}
              onPress={() => router.replace("/(auth)/signup")}
            >
              Sign Up
            </Text>
          </Text>

          {/* Email input */}
          <TextInput
            ref={emailRef}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#FFF"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              width: "100%",
              height: 60,
              borderRadius: 60,
              borderWidth: 2,
              borderColor: "#FFF",
              color: "#FFF",
              paddingHorizontal: 20,
              fontSize: 18,
              fontFamily: "Inter_500Medium",
              marginBottom: 15,
            }}
          />

          {/* Password input */}
          <View
            style={{
              width: "100%",
              height: 60,
              borderRadius: 60,
              borderWidth: 2,
              borderColor: "#FFF",
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#FFF"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={{
                flex: 1,
                color: "#FFF",
                fontSize: 18,
                fontFamily: "Inter_500Medium",
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={24}
                color={showPassword ? "#FFF" : "#3A4A63"}
              />
            </TouchableOpacity>
          </View>

          {/* Log In button */}
          <TouchableOpacity
            onPress={handleLogin}
            style={{
              width: "100%",
              height: 60,
              borderRadius: 60,
              backgroundColor: isValidEmail && password.length >= 6 ? "#FFF" : "#3A4A63",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 22,
                color: isValidEmail && password.length >= 6 ? "#000" : "#FFF",
              }}
            >
              Log In
            </Text>
          </TouchableOpacity>

          <Text style={{ fontFamily: "Inter_500Medium", fontSize: 18, color: "#8F96AB", marginBottom: 20 }}>
            Forgot Password?
          </Text>

          {/* OR separator */}
          <View style={{ flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 20 }}>
            <View style={{ flex: 1, height: 2, backgroundColor: "#3A4A63" }} />
            <Text style={{ marginHorizontal: 10, fontSize: 15, fontFamily: "Inter_500Medium", color: "#8F96AB" }}>
              OR
            </Text>
            <View style={{ flex: 1, height: 2, backgroundColor: "#3A4A63" }} />
          </View>

          {/* Apple Login */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              height: 60,
              borderRadius: 60,
              backgroundColor: "#FFF",
              marginBottom: 18,
              width: "100%",
              paddingHorizontal: 20,
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
                console.log("Apple Login Error:", err);
              }
            }}
          >
            <Image source={require("../../assets/images/apple.png")} style={{ width: 22, height: 22, marginRight: 8 }} />
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 22, color: "#000" }}>Continue with Apple</Text>
          </TouchableOpacity>

          {/* Google Login */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              height: 60,
              borderRadius: 60,
              backgroundColor: "#FFF",
              marginBottom: 18,
              width: "100%",
              paddingHorizontal: 20,
            }}
            disabled={!request}
            onPress={() => promptAsync()}
          >
            <Image source={require("../../assets/images/google.png")} style={{ width: 28, height: 28, marginRight: 8 }} />
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 22, color: "#000" }}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View style={{ position: "absolute", bottom: 65, width: "100%", paddingHorizontal: 28 }}>
          <Text style={{ textAlign: "center", fontSize: 18, color: "#8F96AB", fontFamily: "Inter_500Medium" }}>
            By using Sora you agree to the <Text style={{ color: "#FFF" }}>Terms</Text> & <Text style={{ color: "#FFF" }}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
