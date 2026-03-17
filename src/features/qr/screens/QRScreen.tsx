import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import RNPrint from "react-native-print";
import QRCode from "react-native-qrcode-svg";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import Share from "react-native-share";
import ViewShot from "react-native-view-shot";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    DownloadIcon,
    ShareIcon,
} from "../../../components/common/Icons";
import { APP_CONFIG } from "../../../constants/config";
import { Dish, User } from "../../../types";
import {
    MainTabParamList,
    RootStackParamList,
} from "../../../types/navigation";
import authService from "../../auth/services/authService";
import dishService from "../../dishes/services/dishService";

type QRScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "QRTab">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: QRScreenNavigationProp;
}

const { width } = Dimensions.get("window");
const PAGE_WIDTH = width - 16;
const PAGE_HEIGHT = PAGE_WIDTH * 1.414;
const DISHES_PER_PAGE = 4;

type MenuTemplateId = "pizzaFrame" | "lunch" | "herbal";

const MENU_TEMPLATES: Array<{
  id: MenuTemplateId;
  name: string;
  description: string;
}> = [
  {
    id: "pizzaFrame",
    name: "Pizza Frame",
    description: "From Pizza Frame Menu.svg",
  },
  { id: "lunch", name: "Lunch", description: "From Lunch Menu.svg" },
  { id: "herbal", name: "Herbal", description: "From Herbal Menu.svg" },
];

const QRScreen: React.FC<Props> = ({ navigation }) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [availableDishes, setAvailableDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTemplate, setSelectedTemplate] =
    useState<MenuTemplateId>("pizzaFrame");

  const viewShotRef = useRef<ViewShot>(null);
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = (insets.top > 0 ? insets.top : 20) + 90;

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchDishes();
    }
  }, [userData]);

  const loadUserData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserData(user);
      } else {
        navigation.replace("Login");
      }
    } catch (error) {
      console.error("Load user error:", error);
      navigation.replace("Login");
    }
  };

  const fetchDishes = async () => {
    if (!userData) return;

    try {
      setLoading(true);
      const fetchedDishes = await dishService.getDishes(userData.restaurantId);
      const active = fetchedDishes.filter((d: Dish) => d.isAvailable);
      setAvailableDishes(active);
    } catch (error) {
      console.error("Fetch dishes error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPrimaryImageUrl = (images?: string): string => {
    if (!images) return "";

    return (
      images
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean)[0] || ""
    );
  };

  const pages: Dish[][] = [];
  for (let i = 0; i < availableDishes.length; i += DISHES_PER_PAGE) {
    pages.push(availableDishes.slice(i, i + DISHES_PER_PAGE));
  }

  const previewTheme = {
    pizzaFrame: {
      pageBackground: "#D9741C",
      headerBorder: "#FAD82D",
      titleColor: "#FFFEF7",
      subtitleColor: "#FAD82D",
      rowBorder: "rgba(250, 216, 45, 0.3)",
      categoryColor: "#FAD82D",
      priceColor: "#FFFEF7",
      qrTextColor: "#FAD82D",
      footerBorder: "rgba(255, 254, 247, 0.3)",
      websiteColor: "#FAD82D",
    },
    lunch: {
      pageBackground: "#F2EFE9",
      headerBorder: "#C42929",
      titleColor: "#C42929",
      subtitleColor: "#1A1A1A",
      rowBorder: "#E7DDD1",
      categoryColor: "#C42929",
      priceColor: "#C42929",
      qrTextColor: "#64748B",
      footerBorder: "#E7DDD1",
      websiteColor: "#C42929",
    },
    herbal: {
      pageBackground: "#EAF2FA",
      headerBorder: "#1D427C",
      titleColor: "#1D427C",
      subtitleColor: "#64748B",
      rowBorder: "#D7E4F4",
      categoryColor: "#1D427C",
      priceColor: "#1D427C",
      qrTextColor: "#64748B",
      footerBorder: "#D7E4F4",
      websiteColor: "#1D427C",
    },
  }[selectedTemplate];

  const generateFullMenuPDF = async () => {
    try {
      setGenerating(true);

      const templateStyles = {
        pizzaFrame: {
          bodyBackground: "#D9741C",
          headerBackground: "linear-gradient(135deg, #B94D0F 0%, #8A3508 100%)",
          headerTextColor: "#FFFEF7",
          cardBackground: "rgba(40, 16, 8, 0.35)",
          cardBorder: "1px solid rgba(250, 216, 45, 0.35)",
          cardShadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
          categoryBackground: "rgba(250, 216, 45, 0.18)",
          categoryBorder: "1px solid rgba(250, 216, 45, 0.45)",
          footerBackground: "rgba(40, 16, 8, 0.35)",
          footerBorder: "1px solid rgba(250, 216, 45, 0.35)",
          nameColor: "#FFFEF7",
          priceColor: "#FFFEF7",
          noteColor: "#FAD82D",
          qrBorder: "1px solid rgba(255, 254, 247, 0.45)",
          categoryColor: "#FAD82D",
          subtitleColor: "rgba(255, 254, 247, 0.9)",
          headerShadow: "0 8px 20px rgba(0, 0, 0, 0.22)",
        },
        lunch: {
          bodyBackground: "#F2EFE9",
          headerBackground: "transparent",
          headerTextColor: "#C42929",
          cardBackground: "#F7F2E8",
          cardBorder: "1px solid #E2D7C8",
          cardShadow: "none",
          categoryBackground: "transparent",
          categoryBorder: "none",
          footerBackground: "transparent",
          footerBorder: "none",
          nameColor: "#C42929",
          priceColor: "#C42929",
          noteColor: "#333333",
          qrBorder: "1px solid #D3D3D3",
          categoryColor: "#C42929",
          subtitleColor: "#303030",
          headerShadow: "none",
        },
        herbal: {
          bodyBackground: "#D9CFCF",
          headerBackground: "linear-gradient(135deg, #EAF2FA 0%, #DCEBFA 100%)",
          headerTextColor: "#1D427C",
          cardBackground: "rgba(255, 255, 255, 0.92)",
          cardBorder: "1px solid #D8E4F4",
          cardShadow: "none",
          categoryBackground: "#EEF4FC",
          categoryBorder: "1px solid #CFDDF1",
          footerBackground: "rgba(255, 255, 255, 0.92)",
          footerBorder: "1px solid #D8E4F4",
          nameColor: "#1D427C",
          priceColor: "#1D427C",
          noteColor: "#64748B",
          qrBorder: "1px solid #CFDDF1",
          categoryColor: "#1D427C",
          subtitleColor: "#64748B",
          headerShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
        },
      }[selectedTemplate];

      const isLunchTemplate = selectedTemplate === "lunch";

      let htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @page {
                margin: ${isLunchTemplate ? "0" : "20px"};
              }
              body {
                font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
                margin: 0;
                padding: 0;
                background: ${templateStyles.bodyBackground};
                color: #1E293B;
              }
              .page {
                page-break-after: always;
                padding: ${isLunchTemplate ? "20px" : "18px"};
                min-height: ${isLunchTemplate ? "1122px" : "auto"};
                box-sizing: border-box;
              }
              .page:last-child {
                page-break-after: auto;
              }
              .header {
                background: ${templateStyles.headerBackground};
                border-radius: 16px;
                color: ${templateStyles.headerTextColor};
                padding: ${isLunchTemplate ? "0 0 10px 0" : "18px 20px"};
                margin-bottom: ${isLunchTemplate ? "10px" : "16px"};
                border-bottom: ${
                  isLunchTemplate ? "2px solid #C42929" : "none"
                };
                text-align: ${isLunchTemplate ? "center" : "left"};
                box-shadow: ${templateStyles.headerShadow};
              }
              .restaurant-name {
                font-size: ${isLunchTemplate ? "44px" : "26px"};
                font-weight: 800;
                color: ${templateStyles.headerTextColor};
                text-transform: uppercase;
                letter-spacing: ${isLunchTemplate ? "2px" : "1px"};
                margin: 0 0 ${isLunchTemplate ? "4px" : "8px"} 0;
              }
              .subtitle {
                font-size: 12px;
                color: ${templateStyles.subtitleColor};
                margin: 0;
                letter-spacing: 0.3px;
                font-style: ${isLunchTemplate ? "italic" : "normal"};
              }
              .dish-list {
                margin: 0;
                padding: 0;
              }
              .dish-card {
                display: flex;
                align-items: center;
                background: ${templateStyles.cardBackground};
                border: ${templateStyles.cardBorder};
                border-radius: ${isLunchTemplate ? "12px" : "14px"};
                margin-bottom: ${isLunchTemplate ? "10px" : "12px"};
                padding: ${isLunchTemplate ? "10px" : "12px"};
                page-break-inside: avoid;
                box-shadow: ${templateStyles.cardShadow};
              }
              .dish-image {
                width: ${isLunchTemplate ? "84px" : "92px"};
                height: ${isLunchTemplate ? "84px" : "92px"};
                border-radius: 12px;
                object-fit: cover;
                margin-right: 12px;
                background-color: #EEF2F7;
              }
              .dish-details {
                flex: 1;
              }
              .dish-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 6px;
              }
              .dish-name {
                font-size: ${isLunchTemplate ? "32px" : "17px"};
                font-weight: 700;
                color: ${templateStyles.nameColor};
                margin: 0;
              }
              .dish-category {
                font-size: ${isLunchTemplate ? "13px" : "10px"};
                color: ${templateStyles.categoryColor};
                background: ${templateStyles.categoryBackground};
                border: ${templateStyles.categoryBorder};
                padding: 2px 8px;
                border-radius: 999px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.6px;
                margin: 0;
                display: inline-block;
              }
              .dish-price {
                font-size: ${isLunchTemplate ? "34px" : "18px"};
                font-weight: 800;
                color: ${templateStyles.priceColor};
                margin: 8px 0 0 0;
              }
              .dish-note {
                font-size: 10px;
                color: ${templateStyles.noteColor};
                margin: 4px 0 0 0;
              }
              .qr-wrap {
                width: ${isLunchTemplate ? "88px" : "84px"};
                margin-left: 10px;
                text-align: center;
              }
              .qr-code {
                width: ${isLunchTemplate ? "82px" : "80px"};
                height: ${isLunchTemplate ? "82px" : "80px"};
                border: ${templateStyles.qrBorder};
                border-radius: 8px;
                padding: 2px;
                background: #FFFFFF;
              }
              .qr-label {
                font-size: ${isLunchTemplate ? "8px" : "9px"};
                color: ${templateStyles.noteColor};
                text-align: center;
                margin-top: ${isLunchTemplate ? "2px" : "5px"};
                font-weight: 600;
              }
              .footer {
                margin-top: ${isLunchTemplate ? "6px" : "10px"};
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: ${templateStyles.footerBackground};
                border: ${templateStyles.footerBorder};
                border-radius: 12px;
                padding: ${isLunchTemplate ? "2px 4px" : "10px 12px"};
                font-size: 11px;
                color: #64748B;
              }
              .website {
                color: ${templateStyles.priceColor};
                font-weight: 700;
              }
            </style>
          </head>
          <body>
      `;

      for (let i = 0; i < pages.length; i++) {
        const pageDishes = pages[i];
        htmlContent += `
          <div class="page">
            <div class="header">
              <h1 class="restaurant-name">${
                userData?.restaurantName || "Restaurant Menu"
              }</h1>
              <p class="subtitle">${
                MENU_TEMPLATES.find((t) => t.id === selectedTemplate)?.name ||
                "Template"
              } · Page ${i + 1} of ${pages.length}</p>
            </div>

            <div class="dish-list">
              ${pageDishes
                .map((dish: Dish) => {
                  const primaryImage = getPrimaryImageUrl(dish.images);
                  const qrValue = primaryImage || APP_CONFIG.WEB_URL;

                  return `
                <div class="dish-card">
                  <img src="${
                    primaryImage || "https://via.placeholder.com/100"
                  }" class="dish-image" onerror="this.src='https://via.placeholder.com/100?text=No+Image'" />
                  <div class="dish-details">
                    <div class="dish-top">
                      <p class="dish-name">${dish.name}</p>
                      <p class="dish-category">${dish.category}</p>
                    </div>
                    <p class="dish-price">₹${dish.price.toFixed(2)}</p>
                    <p class="dish-note">Scan to open dish photo</p>
                  </div>
                  <div class="qr-wrap">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                      qrValue,
                    )}" class="qr-code" />
                    <p class="qr-label">Scan Me</p>
                  </div>
                </div>
              `;
                })
                .join("")}
            </div>

            <div class="footer">
              <div>Page ${i + 1} of ${pages.length}</div>
              <div class="website">${APP_CONFIG.WEB_URL.replace(
                "https://",
                "",
              )}</div>
            </div>
          </div>
        `;
      }

      htmlContent += `</body></html>`;

      await RNPrint.print({
        html: htmlContent,
      });
    } catch (error: any) {
      console.error("PDF Generation Error:", error);
      Alert.alert("Error", "Failed to generate PDF menu");
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePage = async () => {
    try {
      setGenerating(true);
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        await Share.open({
          url: uri,
          title: "Save Menu Page",
          message: `Menu Page ${currentPage + 1} - ${userData?.restaurantName}`,
          type: "image/jpeg",
        });
      }
    } catch (error: any) {
      if (error.message !== "User did not share") {
        Alert.alert("Error", "Failed to save menu page");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSharePage = async () => {
    try {
      setGenerating(true);
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        await Share.open({
          url: uri,
          title: "Share Menu Page",
          message: `Check out our menu! Page ${currentPage + 1}`,
          type: "image/jpeg",
        });
      }
    } catch (error: any) {
      // Ignore user cancelled
    } finally {
      setGenerating(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const renderMenuPage = ({
    item: pageDishes,
    index,
  }: {
    item: Dish[];
    index: number;
  }) => {
    return (
      <View
        style={[
          styles.pageContainer,
          { backgroundColor: previewTheme.pageBackground },
        ]}
      >
        <View
          style={[
            styles.menuHeader,
            { borderBottomColor: previewTheme.headerBorder },
          ]}
        >
          <Text
            style={[styles.restaurantName, { color: previewTheme.titleColor }]}
          >
            {userData?.restaurantName}
          </Text>
          <Text
            style={[styles.menuSubtitle, { color: previewTheme.subtitleColor }]}
          >
            Scan QR code to see dish photo
          </Text>
        </View>

        <View style={styles.dishesContainer}>
          {pageDishes.map((dish) => (
            <View
              key={dish.$id}
              style={[
                styles.dishRow,
                { borderBottomColor: previewTheme.rowBorder },
              ]}
            >
              <View style={styles.dishImageContainer}>
                {getPrimaryImageUrl(dish.images) ? (
                  <Image
                    source={{ uri: getPrimaryImageUrl(dish.images) }}
                    style={styles.dishImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.dishImage, styles.placeholderImage]} />
                )}
              </View>

              <View style={styles.dishDetails}>
                <Text
                  style={[styles.dishName, { color: previewTheme.titleColor }]}
                  numberOfLines={2}
                >
                  {dish.name}
                </Text>
                <Text
                  style={[
                    styles.dishCategory,
                    { color: previewTheme.categoryColor },
                  ]}
                >
                  {dish.category}
                </Text>
                <Text
                  style={[styles.dishPrice, { color: previewTheme.priceColor }]}
                >
                  ₹{dish.price.toFixed(2)}
                </Text>
              </View>

              <View
                style={[
                  styles.qrContainer,
                  { borderColor: previewTheme.rowBorder },
                ]}
              >
                <QRCode
                  value={getPrimaryImageUrl(dish.images) || APP_CONFIG.WEB_URL}
                  size={64}
                  color="#2C3E50"
                  backgroundColor="#FFFFFF"
                />
                <Text
                  style={[
                    styles.scanMeText,
                    { color: previewTheme.qrTextColor },
                  ]}
                >
                  Scan Me
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.pageFooter,
            { borderTopColor: previewTheme.footerBorder },
          ]}
        >
          <Text style={styles.pageNumber}>
            Page {index + 1} of {pages.length}
          </Text>
          <Text
            style={[styles.websiteUrl, { color: previewTheme.websiteColor }]}
          >
            {APP_CONFIG.WEB_URL.replace("https://", "")}
          </Text>
        </View>
      </View>
    );
  };

  if (loading && !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8480A" />
      </View>
    );
  }

  if (availableDishes.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <View style={[styles.header, { height: HEADER_HEIGHT }]}>
          <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
            <View style={styles.headerContent}>
              <View style={styles.headerTopRow}>
                <View>
                  <Text style={styles.headerTitle}>Menu Generator</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>
        <View
          style={[styles.emptyContainer, { paddingTop: HEADER_HEIGHT + 20 }]}
        >
          <Text style={styles.emptyText}>No available dishes found.</Text>
          <Text style={styles.emptySubtext}>
            Mark dishes as 'Available' in the Dashboard to generate a menu.
          </Text>
        </View>
      </View>
    );
  }

  const currentDishes = pages[currentPage] || [];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={[styles.header, { height: HEADER_HEIGHT }]}>
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          <View style={styles.headerContent}>
            <View style={styles.headerTopRow}>
              <View>
                <Text style={styles.headerTitle}>Menu Generator</Text>
                <Text style={styles.headerSubtitle}>
                  {availableDishes.length} Available Dishes
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_HEIGHT + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewWrapper}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: "jpg", quality: 1.0 }}
            style={{ backgroundColor: "#fff" }}
          >
            {renderMenuPage({ item: currentDishes, index: currentPage })}
          </ViewShot>
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentPage === 0 && styles.navButtonDisabled,
            ]}
            onPress={handlePrevPage}
            disabled={currentPage === 0}
          >
            <ChevronLeftIcon
              color={currentPage === 0 ? "#BDC3C7" : "#2C3E50"}
              width={24}
              height={24}
            />
          </TouchableOpacity>

          <Text style={styles.pageIndicator}>
            Page {currentPage + 1} of {pages.length}
          </Text>

          <TouchableOpacity
            style={[
              styles.navButton,
              currentPage === pages.length - 1 && styles.navButtonDisabled,
            ]}
            onPress={handleNextPage}
            disabled={currentPage === pages.length - 1}
          >
            <ChevronRightIcon
              color={currentPage === pages.length - 1 ? "#BDC3C7" : "#2C3E50"}
              width={24}
              height={24}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.templateSection}>
          <Text style={styles.templateSectionTitle}>Choose PDF Template</Text>
          <Text style={styles.templateSectionSubtitle}>
            Select a style before exporting your menu
          </Text>
          <View style={styles.templateGrid}>
            {MENU_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedTemplate === template.id &&
                    styles.templateCardSelected,
                ]}
                onPress={() => setSelectedTemplate(template.id)}
                activeOpacity={0.9}
              >
                <View style={styles.templateCardHeader}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.templateName,
                      selectedTemplate === template.id &&
                        styles.templateNameSelected,
                    ]}
                  >
                    {template.name}
                  </Text>

                  <View
                    style={[
                      styles.templateSelectionDot,
                      selectedTemplate === template.id &&
                        styles.templateSelectionDotActive,
                    ]}
                  >
                    {selectedTemplate === template.id ? (
                      <View style={styles.templateSelectionDotInner} />
                    ) : null}
                  </View>
                </View>

                <Text style={styles.templateDescription} numberOfLines={2}>
                  {template.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleSavePage}
            disabled={generating}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#E8F5E9" }]}>
              <DownloadIcon color="#2ECC71" width={24} height={24} />
            </View>
            <Text style={styles.actionText}>Save Page</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={generateFullMenuPDF}
            disabled={generating}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#FFF3E0" }]}>
              <DownloadIcon color="#FF9800" width={24} height={24} />
            </View>
            <Text style={styles.actionText}>Full PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleSharePage}
            disabled={generating}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#E3F2FD" }]}>
              <ShareIcon color="#3498DB" width={24} height={24} />
            </View>
            <Text style={styles.actionText}>Share Page</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
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
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 40,
  },
  previewWrapper: {
    width: PAGE_WIDTH,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  pageContainer: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    padding: 16,
    justifyContent: "space-between",
  },
  menuHeader: {
    alignItems: "center",
    borderBottomWidth: 2,
    paddingBottom: 10,
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 5,
    fontStyle: "italic",
  },
  dishesContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  dishRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    minHeight: 72,
  },
  dishImageContainer: {
    width: 62,
    height: 62,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  dishImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    backgroundColor: "#E0E0E0",
  },
  dishDetails: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  dishName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 3,
  },
  dishCategory: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  dishPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    padding: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  scanMeText: {
    fontSize: 7,
    marginTop: 2,
    fontWeight: "600",
  },
  pageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 6,
  },
  pageNumber: {
    fontSize: 10,
    color: "#95A5A6",
  },
  websiteUrl: {
    fontSize: 10,
    fontWeight: "bold",
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#F5F5F5",
  },
  pageIndicator: {
    marginHorizontal: 20,
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50",
  },
  templateSection: {
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  templateSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  templateSectionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
  },
  templateGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  templateCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D9E2EC",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  templateCardSelected: {
    borderColor: "#E8480A",
    backgroundColor: "#FFF7F3",
    shadowColor: "#E8480A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  templateCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  templateSelectionDot: {
    width: 16,
    height: 16,
    marginLeft: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#C7D2E0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  templateSelectionDotActive: {
    borderColor: "#E8480A",
    backgroundColor: "#FFF1EB",
  },
  templateSelectionDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E8480A",
  },
  templateName: {
    flex: 1,
    flexShrink: 1,
    marginRight: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  templateNameSelected: {
    color: "#C53D09",
  },
  templateDescription: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 15,
    paddingHorizontal: 20,
    width: "100%",
    justifyContent: "center",
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: 120,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2C3E50",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
  },
});

export default QRScreen;
