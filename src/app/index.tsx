import { Redirect } from "expo-router";

import { PickUserScreen } from "@/screens/pick-user";
import { useSessionStore } from "@/stores/session-store";

export default function Index() {
  const user = useSessionStore((s) => s.user);
  return user ? <Redirect href="/home" /> : <PickUserScreen />;
}
