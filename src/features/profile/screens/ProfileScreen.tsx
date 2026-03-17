import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APPWRITE_CONFIG, databases } from "../../../api/client/appwrite";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { APP_CONFIG } from "../../../constants/config";
import { useTheme } from "../../../providers/AuthProvider";
import { User } from "../../../types";
import {
    MainTabParamList,
    RootStackParamList,
} from "../../../types/navigation";
import authService from "../../auth/services/authService";

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "ProfileTab">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

interface RestaurantInfo {
  name: string;
  address: string;
  phone: string;
  timing: string;
  location: string;
  description: string;
}

const EMPTY_RESTAURANT_INFO: RestaurantInfo = {
  name: "",
  address: "",
  phone: "",
  timing: "",
  location: "",
  description: "",
};

const LOCAL_USER_KEY = "userData";

const toTitleCase = (value?: string) => {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const getAvatarLabel = (name?: string) => {
  const normalizedName = toTitleCase(name);
  if (!normalizedName) {
    return "R";
  }

  const parts = normalizedName.split(" ").filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { setThemeMode, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = (insets.top > 0 ? insets.top : 20) + 96;

  const [userData, setUserData] = useState<User | null>(null);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>(
    EMPTY_RESTAURANT_INFO,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const ownerName = toTitleCase(userData?.name) || "Owner";
  const restaurantName =
    toTitleCase(restaurantInfo.name || userData?.restaurantName) ||
    "Restaurant";
  const avatarLabel = getAvatarLabel(userData?.name || restaurantName);
  const headerSubtitle =
    ownerName.toLowerCase() === restaurantName.toLowerCase()
      ? "Restaurant Profile"
      : restaurantName;

  useEffect(() => {
    void loadUserData();
  }, []);

  const completionCount = useMemo(
    () =>
      Object.values(restaurantInfo).filter((value) => value.trim().length > 0)
        .length,
    [restaurantInfo],
  );

  const normalizeRestaurantInfo = (
    response: Record<string, any>,
    user: User,
  ): RestaurantInfo => ({
    name: String(response.name || user.restaurantName || ""),
    address: String(response.address || ""),
    phone: String(response.phone || response.phoneNumber || ""),
    timing: String(response.timing || response.operatingHours || ""),
    location: String(response.location || ""),
    description: String(response.description || ""),
  });

  const loadUserData = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const user = await authService.getCurrentUser();
      if (!user) {
        navigation.replace("Login");
        return;
      }

      setUserData(user);
      await loadRestaurantInfo(user);
    } catch (error) {
      console.error("Load profile error:", error);
      navigation.replace("Login");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const loadRestaurantInfo = async (user: User) => {
    try {
      const response = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.restaurantsCollectionId,
        user.restaurantId,
      );

      setRestaurantInfo(
        normalizeRestaurantInfo(response as Record<string, any>, user),
      );
    } catch (error) {
      console.error("Load restaurant info error:", error);
      setRestaurantInfo({
        ...EMPTY_RESTAURANT_INFO,
        name: user.restaurantName || "",
      });
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadUserData(false);
    } finally {
      setRefreshing(false);
    }
  };

  const updateField = (field: keyof RestaurantInfo, value: string) => {
    setRestaurantInfo((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!userData) {
      return;
    }

    const trimmedName = restaurantInfo.name.trim();
    if (!trimmedName) {
      Alert.alert("Validation Error", "Restaurant name is required.");
      return;
    }

    const payload = {
      name: trimmedName,
      address: restaurantInfo.address.trim(),
      phoneNumber: restaurantInfo.phone.trim(),
      operatingHours: restaurantInfo.timing.trim(),
      location: restaurantInfo.location.trim(),
      description: restaurantInfo.description.trim(),
    };

    try {
      setSaving(true);

      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.restaurantsCollectionId,
        userData.restaurantId,
        payload,
      );

      const updatedUserData: User = {
        ...userData,
        restaurantName: trimmedName,
      };

      await AsyncStorage.setItem(
        LOCAL_USER_KEY,
        JSON.stringify(updatedUserData),
      );
      setUserData(updatedUserData);
      setRestaurantInfo((current) => ({
        ...current,
        name: trimmedName,
      }));

      Alert.alert("Saved", "Restaurant settings updated successfully.");
    } catch (error: any) {
      console.error("Save profile error:", error);
      Alert.alert(
        "Save Failed",
        error?.message || "Unable to update restaurant settings right now.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!userData?.email) {
      Alert.alert("Missing Email", "No account email was found for this user.");
      return;
    }

    try {
      setSendingReset(true);
      await authService.sendPasswordResetEmail(userData.email);
      Alert.alert(
        "Reset Email Sent",
        `We sent a password reset email to ${userData.email}.`,
      );
    } catch (error: any) {
      console.error("Password reset error:", error);
      Alert.alert(
        "Reset Failed",
        error?.message || "Unable to send the reset email right now.",
      );
    } finally {
      setSendingReset(false);
    }
  };

  const handleOpenWebsite = async () => {
    try {
      await Linking.openURL(APP_CONFIG.WEB_URL);
    } catch (error) {
      Alert.alert("Unavailable", "Could not open the website on this device.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await authService.logout();
            navigation.replace("Login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8480A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={[styles.header, { height: HEADER_HEIGHT }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerEyebrow}>Profile Settings</Text>
              <Text style={styles.headerTitle}>{ownerName}</Text>
              <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
            </View>

            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{avatarLabel}</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: HEADER_HEIGHT + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.summaryCardWrap}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryPrimaryValue}>
                  {completionCount}/6
                </Text>
                <Text style={styles.summaryLabel}>Profile Complete</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summarySecondaryValue} numberOfLines={1}>
                  {formatCompactText(userData?.email)}
                </Text>
                <Text style={styles.summaryLabel}>Account Email</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Business Profile</Text>
              <Text style={styles.sectionSubtitle}>
                Keep restaurant details accurate for your admin account.
              </Text>
            </View>

            <Input
              label="Restaurant Name"
              value={restaurantInfo.name}
              onChangeText={(value) => updateField("name", value)}
              placeholder="Enter restaurant name"
              required
            />
            <Input
              label="Address"
              value={restaurantInfo.address}
              onChangeText={(value) => updateField("address", value)}
              placeholder="Enter full address"
              multiline
              numberOfLines={3}
            />
            <Input
              label="Phone"
              value={restaurantInfo.phone}
              onChangeText={(value) => updateField("phone", value)}
              placeholder="Enter contact number"
              keyboardType="phone-pad"
            />
            <Input
              label="Business Hours"
              value={restaurantInfo.timing}
              onChangeText={(value) => updateField("timing", value)}
              placeholder="Example: 10:00 AM - 11:00 PM"
            />
            <Input
              label="Location"
              value={restaurantInfo.location}
              onChangeText={(value) => updateField("location", value)}
              placeholder="City / area / landmark"
            />
            <Input
              label="Description"
              value={restaurantInfo.description}
              onChangeText={(value) => updateField("description", value)}
              placeholder="Short restaurant description"
              multiline
              numberOfLines={4}
            />

            <View style={styles.buttonRow}>
              <Button
                title="Refresh"
                onPress={handleRefresh}
                variant="outline"
                disabled={saving || refreshing}
                style={styles.secondaryButton}
              />
              <Button
                title="Save Changes"
                onPress={handleSaveProfile}
                loading={saving}
                disabled={refreshing}
                style={styles.primaryButton}
              />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Workspace</Text>
              <Text style={styles.sectionSubtitle}>
                Jump to the tools you use most often.
              </Text>
            </View>

            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionTile}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("DashboardTab")}
              >
                <Text style={styles.actionTitle}>Manage Dishes</Text>
                <Text style={styles.actionSubtitle}>
                  Add, edit, and organize menu items.
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionTile}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("QRTab")}
              >
                <Text style={styles.actionTitle}>Generate Menu</Text>
                <Text style={styles.actionSubtitle}>
                  Create QR pages and export PDF menus.
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Preferences & Security</Text>
              <Text style={styles.sectionSubtitle}>
                Manage account appearance and access.
              </Text>
            </View>

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceTextWrap}>
                <Text style={styles.preferenceTitle}>Appearance</Text>
                <Text style={styles.preferenceSubtitle}>
                  {isDark ? "Dark mode is active" : "Light mode is active"}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => setThemeMode(isDark ? "light" : "dark")}
                trackColor={{ false: "#E2E8F0", true: "#F5B39B" }}
                thumbColor={isDark ? "#E8480A" : "#FFFFFF"}
              />
            </View>

            <TouchableOpacity
              style={styles.preferenceRow}
              activeOpacity={0.85}
              onPress={handlePasswordReset}
              disabled={sendingReset}
            >
              <View style={styles.preferenceTextWrap}>
                <Text style={styles.preferenceTitle}>Password Reset</Text>
                <Text style={styles.preferenceSubtitle}>
                  Send a reset email to {userData?.email || "your account"}.
                </Text>
              </View>
              <Text style={styles.preferenceActionText}>
                {sendingReset ? "Sending..." : "Send Email"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.preferenceRow, styles.preferenceRowLast]}
              activeOpacity={0.85}
              onPress={handleOpenWebsite}
            >
              <View style={styles.preferenceTextWrap}>
                <Text style={styles.preferenceTitle}>Website</Text>
                <Text style={styles.preferenceSubtitle}>
                  Open {APP_CONFIG.WEB_URL.replace("https://", "")}
                </Text>
              </View>
              <Text style={styles.preferenceActionText}>Open</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerSection}>
            <Button
              title="Logout"
              onPress={handleLogout}
              variant="danger"
              style={styles.logoutButton}
            />
            <Text style={styles.versionText}>
              {APP_CONFIG.NAME} v{APP_CONFIG.VERSION}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const formatCompactText = (value?: string) => {
  if (!value) {
    return "Not set";
  }

  return value.length > 20 ? `${value.slice(0, 20)}...` : value;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: "#E8480A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 15,
    justifyContent: "flex-end",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  headerEyebrow: {
    fontSize: 12,
    color: "rgba(255,255,255,0.82)",
    marginBottom: 4,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.95)",
    marginTop: 4,
    fontWeight: "500",
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFF4EF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.38)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    color: "#C53D09",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  summaryCardWrap: {
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  summaryItem: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 14,
  },
  summaryPrimaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  summarySecondaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  sectionCard: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    marginLeft: 6,
  },
  secondaryButton: {
    flex: 1,
    marginRight: 6,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionTile: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFF4EF",
    borderWidth: 1,
    borderColor: "#F9D3C5",
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#9A3412",
    marginBottom: 6,
  },
  actionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#7C2D12",
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  preferenceRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  preferenceTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
  },
  preferenceActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E8480A",
  },
  footerSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  logoutButton: {
    borderRadius: 16,
  },
  versionText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 14,
  },
});

export default ProfileScreen;
