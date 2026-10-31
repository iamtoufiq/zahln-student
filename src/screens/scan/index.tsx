import { CameraView } from "expo-camera";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { useT } from "@/hooks/use-t";
import { Button, COLORS, RADIUS, Screen, SPACE, TAP_MIN, TYPE } from "@/ui";

import { useScan } from "./use-scan";

const QR_ONLY = { barcodeTypes: ["qr" as const] };

export function ScanScreen() {
  const { t } = useT();
  const scan = useScan();

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>
        {t("scan.title")}
      </Text>
      <View style={styles.cameraBox}>
        {scan.granted ? (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={QR_ONLY}
            onBarcodeScanned={scan.onScanned}
            accessibilityLabel={t("scan.title")}
          />
        ) : (
          <View style={styles.permission}>
            <Text style={styles.body}>{t("scan.permission")}</Text>
            {scan.canAsk ? (
              <Button label={t("scan.allowCamera")} onPress={scan.requestPermission} />
            ) : null}
          </View>
        )}
      </View>
      <Text style={styles.label}>{t("scan.manual")}</Text>
      <TextInput
        testID="scan-code"
        value={scan.code}
        onChangeText={scan.setCode}
        placeholder={t("scan.manualPlaceholder")}
        placeholderTextColor={COLORS.muted}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={t("scan.manual")}
        onSubmitEditing={scan.submitCode}
        style={styles.input}
      />
      {scan.invalid ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {t("scan.invalid")}
        </Text>
      ) : null}
      <Button
        testID="scan-submit"
        label={t("scan.manualSubmit")}
        variant="secondary"
        onPress={scan.submitCode}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...TYPE.title, color: COLORS.text },
  cameraBox: { flex: 1, borderRadius: RADIUS.lg, overflow: "hidden", backgroundColor: COLORS.text },
  camera: { flex: 1 },
  permission: {
    flex: 1,
    padding: SPACE.xl,
    gap: SPACE.lg,
    justifyContent: "center",
    backgroundColor: COLORS.primaryTint,
  },
  body: { ...TYPE.body, color: COLORS.text },
  label: { ...TYPE.bodyStrong, color: COLORS.text },
  input: {
    ...TYPE.body,
    minHeight: TAP_MIN,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACE.lg,
    color: COLORS.text,
  },
  error: { ...TYPE.body, color: COLORS.danger },
});
