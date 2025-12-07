import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather } from "@expo/vector-icons";
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
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync();

export default function SignUp() {
  const router = useRouter();
  const { height } = Dimensions.get("window");

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const inputRef = useRef(null);

  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);

  // Google Auth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "<YOUR_EXPO_CLIENT_ID>",
    iosClientId: "<YOUR_IOS_CLIENT_ID>",
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [fontsLoaded]);

  useEffect(() => {
    setIsValidEmail(email.includes("@") && email.includes("."));
  }, [email]);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      console.log("Google login successful:", id_token);
      router.replace("/(main)/index");
    }
  }, [response]);

  if (!fontsLoaded) return null;

  const topOffset = height * 0.2;

  const handleContinue = async () => {
    if (!isValidEmail) {
      Alert.alert("Invalid email");
      return;
    }

    // Pass the email to enterinfo screen
    router.replace({
      pathname: "/(auth)/enterinfo",
      params: { email },
    });
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
            Sign Up
          </Text>

          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 18,
              color: "#8F96AB",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Already have an account?{" "}
            <Text style={{ color: "#FFF" }} onPress={() => router.replace("/(auth)/login")}>
              Log in
            </Text>
          </Text>

          {/* Email input */}
          <TextInput
            ref={inputRef}
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
              marginBottom: 10,
            }}
          />

          {/* Continue button */}
          <TouchableOpacity
            style={{
              width: "100%",
              height: 60,
              borderRadius: 60,
              backgroundColor: isValidEmail ? "#FFF" : "#3A4A63",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 10,
            }}
            onPress={handleContinue}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 22,
                color: isValidEmail ? "#000" : "#FFF",
              }}
            >
              Continue
            </Text>
          </TouchableOpacity>

          {/* OR separator */}
          <View style={{ flexDirection: "row", alignItems: "center", width: "100%", marginVertical: 20 }}>
            <View style={{ flex: 1, height: 2, backgroundColor: "#3A4A63" }} />
            <Text style={{ marginHorizontal: 10, fontSize: 15, fontFamily: "Inter_500Medium", color: "#8F96AB" }}>
              OR
            </Text>
            <View style={{ flex: 1, height: 2, backgroundColor: "#3A4A63" }} />
          </View>

          {/* Apple & Google buttons unchanged */}
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
                console.log("Apple login attempted", appleCredential);
              } catch (err) {
                console.log("Apple Login Error:", err);
              }
            }}
          >
            <Image
              source={require("../../assets/images/apple.png")}
              style={{ width: 22, height: 22, marginRight: 8 }}
            />
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 22, color: "#000" }}>
              Continue with Apple
            </Text>
          </TouchableOpacity>

          {/* GOOGLE LOGIN */}
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
            <Image
              source={require("../../assets/images/google.png")}
              style={{ width: 28, height: 28, marginRight: 8 }}
            />
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 22, color: "#000" }}>
              Continue with Google
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View style={{ position: "absolute", bottom: 65, width: "100%", paddingHorizontal: 28 }}>
          <Text style={{ textAlign: "center", fontSize: 18, color: "#8F96AB", fontFamily: "Inter_500Medium" }}>
            By using Sora you agree to the <Text style={{ color: "#FFF" }}>Terms</Text> &{" "}
            <Text style={{ color: "#FFF" }}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}