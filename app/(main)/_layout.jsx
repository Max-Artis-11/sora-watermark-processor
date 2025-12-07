import { Stack } from "expo-router";
import TabBar from "./tabbar";

export default function MainLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <TabBar />
    </>
  );
}