// src/components/DishCard.tsx
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Dish } from "../types";

// ============================================
// Dish Card Component
// ============================================

interface DishCardProps {
  dish: Dish;
  onEdit: (dish: Dish) => void;
  onDelete: (dish: Dish) => void;
  onToggleAvailability: (dish: Dish) => void;
  style?: ViewStyle;
}

const DishCard: React.FC<DishCardProps> = ({
  dish,
  onEdit,
  onDelete,
  onToggleAvailability,
  style,
}) => {
  const imageUrl =
    dish.images && dish.images.length > 0 ? dish.images.split(",")[0] : null;
  const [imageError, setImageError] = useState(false);

  return (
    <View style={[styles.card, style]}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {imageUrl && !imageError ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🍽️</Text>
          </View>
        )}

        {/* Availability Badge */}
        <View
          style={[
            styles.badge,
            dish.isAvailable ? styles.availableBadge : styles.unavailableBadge,
          ]}
        >
          <Text style={styles.badgeText}>
            {dish.isAvailable ? "✓ Available" : "✕ Unavailable"}
          </Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.name} numberOfLines={1}>
          {dish.name}
        </Text>

        <Text style={styles.category}>{dish.category}</Text>

        <Text style={styles.description} numberOfLines={2}>
          {dish.description}
        </Text>

        <Text style={styles.price}>₹{dish.price.toFixed(2)}</Text>
      </View>

      {/* Actions Section */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(dish)}
        >
          <Text style={styles.actionButtonText}>✏️ Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.toggleButton]}
          onPress={() => onToggleAvailability(dish)}
        >
          <Text style={styles.actionButtonText}>
            {dish.isAvailable ? "❌" : "✅"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(dish)}
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 60,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  availableBadge: {
    backgroundColor: "#2ECC71",
  },
  unavailableBadge: {
    backgroundColor: "#E74C3C",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  infoSection: {
    padding: 15,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#7F8C8D",
    lineHeight: 20,
    marginBottom: 10,
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  actionButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#E9ECEF",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2C3E50",
  },
  editButton: {
    backgroundColor: "#F8F9FA",
  },
  toggleButton: {
    backgroundColor: "#F8F9FA",
  },
  deleteButton: {
    backgroundColor: "#FFF5F5",
    borderRightWidth: 0,
  },
});

export default DishCard;
