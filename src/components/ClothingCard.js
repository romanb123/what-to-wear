import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, CATEGORY_MAP } from '../theme';

export default function ClothingCard({ item, cardWidth, onToggleLaundry, onDelete, onPress }) {
  const cardHeight = cardWidth * 1.38;
  const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP['all'];

  return (
    <View style={{ width: cardWidth }}>
      <TouchableOpacity style={[styles.card, { height: cardHeight }]} onPress={onPress} activeOpacity={0.92}>

        {/* Visual area */}
        <View style={[styles.visual, { backgroundColor: cat.bg }]}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <>
              <View style={styles.textureOverlay} />
              <View style={styles.swatchWrapper}>
                <View style={[styles.swatchOuter, { borderColor: item.color + '40' }]}>
                  <View style={[styles.swatchInner, { backgroundColor: item.color || cat.accent }]} />
                </View>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              </View>
            </>
          )}

          {/* Bottom gradient */}
          <LinearGradient
            colors={['transparent', cat.bg + 'CC', cat.bg]}
            style={styles.gradient}
          />

          {/* Laundry overlay */}
          {item.inLaundry && (
            <View style={styles.laundryOverlay}>
              <Text style={styles.laundryOverlayEmoji}>🧺</Text>
            </View>
          )}

          {/* Laundry toggle button */}
          <TouchableOpacity
            style={[styles.laundryBtn, item.inLaundry && styles.laundryBtnActive]}
            onPress={() => onToggleLaundry(item.id)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.75}
          >
            <Text style={styles.laundryBtnIcon}>{item.inLaundry ? '🧺' : '🗄️'}</Text>
          </TouchableOpacity>

          {/* Delete button */}
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() =>
                Alert.alert('Delete Item', `Remove "${item.name}" from wardrobe?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
                ])
              }
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              activeOpacity={0.75}
            >
              <Text style={styles.deleteBtnIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info */}
        <View style={[styles.info, { backgroundColor: cat.bg }]}>
          <View style={[styles.accentLine, { backgroundColor: cat.accent }]} />
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <View style={styles.meta}>
            {item.brand ? <Text style={styles.brand}>{item.brand}</Text> : <View />}
            <Text style={styles.season}>{item.season}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  visual: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  swatchWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  swatchOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  categoryEmoji: {
    fontSize: 26,
    opacity: 0.7,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },

  laundryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  laundryOverlayEmoji: {
    fontSize: 38,
    opacity: 0.9,
  },

  laundryBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnIcon: { fontSize: 13 },
  laundryBtnActive: {
    backgroundColor: 'rgba(200,169,110,0.25)',
    borderColor: COLORS.gold,
  },
  laundryBtnIcon: {
    fontSize: 13,
  },

  info: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  accentLine: {
    height: 1.5,
    width: 24,
    borderRadius: 1,
    marginBottom: 2,
    alignSelf: 'flex-end',
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONTS.serif,
    letterSpacing: 0.2,
    textAlign: 'right',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  season: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
