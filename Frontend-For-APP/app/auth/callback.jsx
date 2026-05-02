import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { saveToken, saveRefreshToken } from "../../lib/tokenStorage";
import { colors } from "../../lib/theme";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url) => {
      if (!url) return;
      const hash = url.split("#")[1];
      if (!hash) return;
      const params = Object.fromEntries(
        hash.split("&").map((pair) => {
          const [key, ...rest] = pair.split("=");
          return [key, decodeURIComponent(rest.join("="))];
        })
      );
      if (params.access_token) {
        await saveToken(params.access_token);
        if (params.refresh_token) await saveRefreshToken(params.refresh_token);
        router.replace("/(tabs)/workouts");
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const subscription = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
