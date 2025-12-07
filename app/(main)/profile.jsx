import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { AntDesign, Entypo, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function Profile() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load fonts at top
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // 1) Load session on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) console.log("getSession error:", sessionError.message);
        const sessionUser = sessionData?.session?.user ?? null;

        if (!sessionUser) {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user && mounted) setUser(userData.user);
        } else {
          if (mounted) setUser(sessionUser);
        }
      } catch (err) {
        console.log("session init error:", err);
        if (mounted) setUser(null);
      } finally {
        if (mounted && !user) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 2) Subscribe to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 3) Fetch profile and user-specific image
  useEffect(() => {
    if (!user) return;

    let mounted = true;
    const fetchProfileAndImage = async () => {
      setLoading(true);
      try {
        // Fetch display name from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();

        if (!profileError && profileData?.display_name) {
          if (mounted) {
            setDisplayName(profileData.display_name);
            setUsername(profileData.display_name.replace(/\s+/g, "").toLowerCase());
          }
        } else {
          const metaName =
            user.user_metadata?.display_name ||
            [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(" ") ||
            user.email ||
            "User";
          if (mounted) {
            setDisplayName(metaName);
            setUsername(metaName.replace(/\s+/g, "").toLowerCase());
          }
        }

        // Load profile image specific to this user
        const localImage = await AsyncStorage.getItem(`profile_image_${user.id}`);
        if (mounted && localImage) setProfileImage(localImage);
      } catch (err) {
        console.log("fetchProfileAndImage error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfileAndImage();
    return () => { mounted = false; };
  }, [user]);

  // 4) Pick image and store per user
  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      const uri = result?.assets?.[0]?.uri ?? result?.uri ?? null;
      const cancelled = result?.canceled ?? result?.cancelled ?? false;
      if (!cancelled && uri) {
        setProfileImage(uri);
        if (user?.id) {
          await AsyncStorage.setItem(`profile_image_${user.id}`, uri);
        }
      }
    } catch (err) {
      console.log("pickImage error:", err);
    }
  };

  // 5) Share app
  const shareApp = async () => {
    try {
      await Share.share({ message: "Check out this awesome app!" });
    } catch (err) {
      console.log("share error:", err);
    }
  };

  // Render loading
  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#000" }} contentContainerStyle={{ padding: 20, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
      {/* Top bar with username and menu */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 30 }}>
        <View style={{ width: 28 }} />
        <Text style={{ color: "#FFF", fontSize: 21, fontFamily: "Inter_500Medium", textAlign: "center" }}>
          {username}
        </Text>
        <TouchableOpacity onPress={() => console.log("Menu pressed")}>
          <Entypo name="menu" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Profile image */}
      <View style={{ alignItems: "center", marginTop: 30, position: "relative" }}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: "#8F96AB" }} />
        ) : (
          <FontAwesome5 name="user-circle" size={120} color="#8F96AB" />
        )}
        <TouchableOpacity onPress={pickImage} style={{ position: "absolute", bottom: 0, right: 0 }}>
          <MaterialCommunityIcons name="pencil-circle-outline" size={32} color="#8F96AB" />
        </TouchableOpacity>
      </View>

      {/* Display name */}
      <Text style={{ fontSize: 30, color: "#FFF", textAlign: "center", marginTop: 15, fontFamily: "Inter_600SemiBold" }}>
        {displayName}
      </Text>

      {/* Two centered blocks side by side */}
      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "flex-start", marginTop: 15, gap: 40 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 33, color: "#FFF", fontFamily: "Inter_700Bold" }}>0</Text>
          <Text style={{ fontSize: 17, color: "#FFF", fontFamily: "Inter_600SemiBold", marginTop: 5 }}>Creations</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 33, color: "#FFF", fontFamily: "Inter_700Bold" }}>23/11/25</Text>
          <Text style={{ fontSize: 17, color: "#FFF", fontFamily: "Inter_600SemiBold", marginTop: 5 }}>Account Created</Text>
        </View>
      </View>

      {/* Share / Create */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 40, gap: 160 }}>
        <TouchableOpacity onPress={shareApp}>
          <Text style={{ fontSize: 22, color: "#FFF", fontFamily: "Inter_600SemiBold" }}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(main)/")}>
          <Text style={{ fontSize: 22, color: "#FFF", fontFamily: "Inter_600SemiBold" }}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Creations header */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 50, alignItems: "center" }}>
        <AntDesign name="play-square" size={22} color="#FFF" />
        <Text style={{ color: "#FFF", fontSize: 22, marginLeft: 7, fontFamily: "Inter_600SemiBold" }}>Creations</Text>
      </View>
    </ScrollView>
  );
}
