import { FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export default function TabBar() {
  const [active, setActive] = useState("explore");

  const explore = useSharedValue(1);
  const profile = useSharedValue(0);

  const activate = (key) => {
    setActive(key);

    explore.value = withTiming(key === "explore" ? 1 : 0, { duration: 350 });
    profile.value = withTiming(key === "profile" ? 1 : 0, { duration: 350 });
  };

  const exploreStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      explore.value,
      [0, 1],
      ["#8F96AB", "white"]
    ),
  }));

  const profileStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      profile.value,
      [0, 1],
      ["#8F96AB", "white"]
    ),
  }));

  return (
    <View
      style={{
        position: "absolute",
        bottom: 35,
        width: "100%",
        height: 70,
        backgroundColor: "#000000",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 35,
        borderTopWidth: 0.5,
        borderTopColor: "#000000",
      }}
    >
      <TouchableOpacity
        style={{ flex: 1, alignItems: "center" }}
        onPress={() => {
          activate("explore");
          router.push("(main)/share");
        }}
      >
        <Animated.Text style={exploreStyle}>
          <FontAwesome6 name="share-from-square" size={30} />
        </Animated.Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ flex: 1, alignItems: "center" }}
        onPress={() => router.push("(main)")}
      >
        <View
          style={{
            width: 55,
            height: 40,
            backgroundColor: "white",
            borderRadius: 24,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <FontAwesome6 name="plus" size={22} color="black" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ flex: 1, alignItems: "center" }}
        onPress={() => {
          activate("profile");
          router.push("(main)/profile");
        }}
      >
        <Animated.Text style={profileStyle}>
          <FontAwesome5 name="user-circle" size={40} />
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}
