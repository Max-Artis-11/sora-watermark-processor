import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function EnterInfo() {
  const router = useRouter();
  const { email } = useLocalSearchParams(); // get email from signup
  const { height } = Dimensions.get("window");

  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef(null);
  const topOffset = height * 0.2;

  useEffect(() => {
    setTimeout(() => {
      passwordRef.current?.focus();
    }, 300);
  }, []);

  const handleContinue = async () => {
    if (!firstName || !lastName) {
      Alert.alert("Error", "Please enter your name.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    try {
      // 1) Sign up the user with metadata (display_name included)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`,
          },
        },
      });

      if (signUpError) {
        Alert.alert("Error", signUpError.message);
        return;
      }

      // 2) Immediately sign in to ensure a session is created (some Supabase setups require explicit sign-in)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        Alert.alert("Login failed", signInError.message);
        return;
      }

      // 3) Give Supabase a short moment to persist the session to AsyncStorage
      // This avoids a race where Profile loads before the session is available.
      await new Promise((resolve) => setTimeout(resolve, 400));

      // 4) Get the current session & user
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.log("Session error:", sessionError.message);
      }

      const currentUser = sessionData?.session?.user ?? signInData?.user ?? signUpData?.user ?? null;
      if (!currentUser) {
        Alert.alert("Error", "Could not retrieve user session. Try logging in.");
        return;
      }

      // 5) Ensure there's a profile row for this user in 'profiles' table
      // If your table has RLS or unique constraints, handle accordingly.
      try {
        // upsert is safer than insert in case a profile already exists
        const displayName = `${firstName} ${lastName}`;
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert({ id: currentUser.id, display_name: displayName }, { onConflict: "id" });

        if (upsertError) {
          console.log("Profile upsert error:", upsertError.message);
          // not fatal — continue to navigation
        }
      } catch (err) {
        console.log("Profile insert unexpected error:", err);
      }

      // 6) Navigation to main area (profile screen)
      // Use replace so back button doesn't return to signup flow
      router.replace("/(main)/");
    } catch (err) {
      // Generic catch for unexpected issues
      Alert.alert("Error", err?.message ?? String(err));
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {/* Back Button */}
        <TouchableOpacity
          style={{ position: "absolute", top: 50, left: 17 }}
          onPress={() => router.replace("/(auth)/signup")}
          activeOpacity={1}
        >
          <Feather name="chevron-left" size={30} color="#FFF" />
        </TouchableOpacity>

        {/* Main Content */}
        <View style={{ marginTop: topOffset, alignItems: "center", paddingHorizontal: 28 }}>
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 40,
              color: "#FFF",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            Create your account
          </Text>

          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 18,
              color: "#8F96AB",
              textAlign: "center",
              marginBottom: 25,
            }}
          >
            Input your <Text style={{ color: "#FFF" }}>name</Text> and{" "}
            <Text style={{ color: "#FFF" }}>choose a password</Text>
          </Text>

          <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between", marginBottom: 15 }}>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor="#FFF"
              autoCapitalize="words"
              style={{
                width: "48%",
                height: 60,
                borderRadius: 60,
                borderWidth: 2,
                borderColor: "#FFF",
                color: "#FFF",
                paddingHorizontal: 20,
                fontSize: 18,
                fontFamily: "Inter_500Medium",
              }}
            />
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor="#FFF"
              autoCapitalize="words"
              style={{
                width: "48%",
                height: 60,
                borderRadius: 60,
                borderWidth: 2,
                borderColor: "#FFF",
                color: "#FFF",
                paddingHorizontal: 20,
                fontSize: 18,
                fontFamily: "Inter_500Medium",
              }}
            />
          </View>

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

          <TouchableOpacity
            onPress={handleContinue}
            style={{
              width: "100%",
              height: 60,
              borderRadius: 60,
              backgroundColor: password.length >= 6 ? "#FFF" : "#3A4A63",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 22,
                color: password.length >= 6 ? "#000" : "#FFF",
              }}
            >
              Continue
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ position: "absolute", bottom: 65, width: "100%", paddingHorizontal: 28 }}>
          <Text
            style={{
              textAlign: "center",
              fontSize: 18,
              color: "#8F96AB",
              fontFamily: "Inter_500Medium",
            }}
          >
            By using Sora you agree to the <Text style={{ color: "#FFF" }}>Terms</Text> &{" "}
            <Text style={{ color: "#FFF" }}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}