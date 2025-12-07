import { Entypo, Feather, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Video } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, Modal, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { SessionContext } from "../_layout";

export default function Index() {
  const router = useRouter();
  const { session } = useContext(SessionContext);

  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWatermark, setSelectedWatermark] = useState(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!session) {
      router.replace("/(auth)/welcome");
      return;
    }
    openPicker();
  }, [session]);

  const openPicker = async () => {
    let permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    while (!permission.granted) {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      quality: 1,
    });
    while (result.canceled) {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: false,
        quality: 1,
      });
    }
    const asset = result.assets[0];
    setSelected(asset);
    setModalVisible(true);
  };

  if (!session) return null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/welcome");
  };

  const uploadToSupabase = async (localUri) => {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const extMatch = localUri.match(/\.\w+$/);
    const ext = extMatch ? extMatch[0] : ".mp4";
    const fileName = `uploads/${Date.now()}${ext}`;

    const { data, error } = await supabase.storage.from("videos").upload(fileName, blob, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) throw error;
    return data.path;
  };

  const processAndExport = async ({ inputUri }) => {
    try {
      setProcessing(true);
      setResult(null);

      const uploadPath = await uploadToSupabase(inputUri);

      const fnRes = await supabase.functions.invoke("watermark", {
        method: "POST",
        body: JSON.stringify({
          filePath: uploadPath,
          watermarkType: selectedWatermark === "add" ? "add" : "remove",
        }),
      });

      if (!fnRes || fnRes.error) {
        throw fnRes.error || new Error("Function invocation failed");
      }

      const json = fnRes.data ? (typeof fnRes.data === "string" ? JSON.parse(fnRes.data) : fnRes.data) : null;
      if (!json || !json.success) throw new Error(json?.error || "Processing failed");

      const processedUrl = json.url;
      if (!processedUrl) throw new Error("No processed URL returned");

      const outFilename = `sora_export_${Date.now()}.mp4`;
      const outPath = `${FileSystem.documentDirectory}${outFilename}`;

      const downloadRes = await FileSystem.downloadAsync(processedUrl, outPath);
      if (!downloadRes || !downloadRes.uri) throw new Error("Download failed");

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") throw new Error("MediaLibrary permission not granted");
      const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);

      setProcessing(false);
      setResult({ success: true, outputPath: downloadRes.uri, asset });
      return { success: true, outputPath: downloadRes.uri, asset };
    } catch (err) {
      setProcessing(false);
      console.error("processAndExport error:", err);
      setResult({ success: false, error: String(err) });
      return { success: false, error: String(err) };
    }
  };

  const onExport = async () => {
    if (!selected || !selectedWatermark) return;
    await processAndExport({ inputUri: selected.uri });
  };

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Video Preview */}
      <View style={{ position: "relative" }}>
        <Video
          source={require("./assets/mysticliquids.mp4")}
          style={{ width: screenWidth, height: screenWidth * (9 / 16) * 1.5 }}
          resizeMode="cover"
          isLooping
          shouldPlay
        />
        <LinearGradient
          colors={["transparent", "#000"]}
          style={{ position: "absolute", bottom: 0, width: screenWidth, height: screenWidth * (9 / 16) * 0.7 }}
        />
      </View>

      {/* Header Icon */}
      <View style={{ position: "absolute", top: 55, right: 20 }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(60, 60, 60, 0.5)", justifyContent: "center", alignItems: "center" }}>
          <MaterialIcons name="token" size={22} color="#FFFFFF" />
          <View style={{ position: "absolute", top: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: "red" }} />
        </View>
      </View>

      {/* Title */}
      <View style={{ position: "absolute", top: 220, left: 15 }}>
        <Text style={{ color: "#e6e6e6", fontSize: 20, fontWeight: "600" }}>All you need for video edits</Text>
        <Text style={{ marginTop: 3, color: "#FFF", fontSize: 33, fontWeight: "700" }}>New watermark editor</Text>
      </View>

      {/* Add/Remove Watermark Buttons */}
      <View style={{ paddingHorizontal: 20, marginTop: -50 }}>
        <TouchableOpacity onPress={openPicker} style={{ width: "100%", height: 130, backgroundColor: "#B4C8FA", borderRadius: 20, justifyContent: "center", alignItems: "center" }}>
          <View style={{ alignItems: "center" }}>
            <FontAwesome name="plus-square" size={35} color="#000000" style={{ marginBottom: 5 }} />
            <Text style={{ color: "#000000", fontSize: 25, fontWeight: "500" }}>New video</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "#101010", paddingTop: 20, alignItems: "center" }}>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={{ position: "absolute", top: 50, left: 15 }}>
            <Feather name="x" size={27} color="#FFFFFF" />
          </TouchableOpacity>

          {selected && (
            <View style={{ width: "100%", alignItems: "center", marginTop: 150 }}>
              {selected.type === "video" ? (
                <VideoPreview uri={selected.uri} width={screenWidth - 220} height={(screenWidth - 220) * (selected.height / selected.width)} />
              ) : (
                <Image source={{ uri: selected.uri }} style={{ width: screenWidth - 220, height: (screenWidth - 220) * (selected.height / selected.width), borderRadius: 10 }} resizeMode="contain" />
              )}
            </View>
          )}

          <View style={{ marginTop: 30, width: "100%", alignItems: "center" }}>
            <TouchableOpacity onPress={() => setSelectedWatermark("add")} style={{ flexDirection: "row", alignItems: "center", marginBottom: 15, padding: 10, borderWidth: 3, borderColor: selectedWatermark === "add" ? "#FFFFFF" : "#767676", borderRadius: 12 }}>
              <Image source={require("./assets/soralogo.png")} style={{ width: 36, height: 36 }} resizeMode="contain" />
              <Text style={{ marginLeft: 9, fontSize: 27, fontWeight: "600", color: "#FFF" }}>Add Sora Watermark</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSelectedWatermark("remove")} style={{ flexDirection: "row", alignItems: "center", marginBottom: 0, padding: 10, borderWidth: 3, borderColor: selectedWatermark === "remove" ? "#FFFFFF" : "#767676", borderRadius: 12 }}>
              <View style={{ width: 36, height: 36, justifyContent: "center", alignItems: "center" }}>
                <Image source={require("./assets/soralogo.png")} style={{ width: 36, height: 36 }} resizeMode="contain" />
                <Entypo name="cross" size={36} color="#FF5A5F" style={{ position: "absolute" }} />
              </View>
              <Text style={{ marginLeft: 9, fontSize: 27, fontWeight: "600", color: "#FFF" }}>Remove Sora Watermark</Text>
            </TouchableOpacity>
          </View>

          {selectedWatermark && (
            <TouchableOpacity onPress={() => setExportModalVisible(true)} style={{ marginTop: 40, padding: 16, backgroundColor: "#B4C8FA", borderRadius: 10 }}>
              <Text style={{ fontSize: 20, fontWeight: "600" }}>Proceed to Export</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      <Modal visible={exportModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "#101010", paddingTop: 20, alignItems: "center", justifyContent: "center" }}>
          <TouchableOpacity onPress={() => setExportModalVisible(false)} style={{ position: "absolute", top: 20, left: 20 }}>
            <Feather name="x" size={28} color="#fff" />
          </TouchableOpacity>

          {processing ? (
            <ActivityIndicator size="large" color="#FFF" />
          ) : (
            <TouchableOpacity onPress={onExport} style={{ padding: 16, backgroundColor: "#B4C8FA", borderRadius: 10 }}>
              <Text style={{ fontSize: 20, fontWeight: "600" }}>Export</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  );
}

function VideoPreview({ uri, width, height }) {
  const player = useVideoPlayer(uri);
  if (!player) return null;
  return <VideoView player={player} style={{ width, height, borderRadius: 10 }} contentFit="contain" allowsFullscreen />;
}
