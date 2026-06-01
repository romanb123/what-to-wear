import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Animated, Modal, Image, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import ClothingCard from '../components/ClothingCard';
import NavTabBar from '../components/NavTabBar';
import AdBanner from '../components/AdBanner';
import { COLORS, FONTS, CATEGORIES, CATEGORY_MAP } from '../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function HomeScreen({ navigation }) {
  const { items, toggleLaundry, removeItem } = useWardrobe();
  const [activeCategory, setActiveCategory] = useState('all');
  const [laundryFilter, setLaundryFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const filtered = items
    .filter(i => activeCategory === 'all' || i.category === activeCategory)
    .filter(i => {
      if (laundryFilter === 'closet')  return !i.inLaundry;
      if (laundryFilter === 'laundry') return  i.inLaundry;
      return true;
    });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80], outputRange: [1, 0], extrapolate: 'clamp',
  });
  const headerScale = scrollY.interpolate({
    inputRange: [0, 80], outputRange: [1, 0.94], extrapolate: 'clamp',
  });

  const renderCard = useCallback(({ item }) => (
    <ClothingCard
      item={item}
      cardWidth={CARD_WIDTH}
      onToggleLaundry={toggleLaundry}
      onDelete={removeItem}
      onPress={() => setSelectedItem(item)}
    />
  ), [toggleLaundry, removeItem]);

  const ListHeader = (
    <View>
      <Animated.View style={[styles.hero, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        <Text style={styles.dateStr}>{dateStr}</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>My Wardrobe</Text>
          <View style={styles.itemsCount}>
            <Text style={styles.itemsBadgeNum}>{items.length}</Text>
            <Text style={styles.itemsBadgeLabel}>items</Text>
          </View>
        </View>
      </Animated.View>

      {/* Status filter */}
      <View style={styles.statusRow}>
        {[
          { id: 'all',     label: 'All',     emoji: '✦' },
          { id: 'closet',  label: 'Closet',  emoji: '🗄️' },
          { id: 'laundry', label: 'Laundry', emoji: '🧺' },
        ].map(opt => {
          const isActive = laundryFilter === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setLaundryFilter(opt.id)}
              style={[styles.statusChip, isActive && styles.statusChipActive]}
              activeOpacity={0.7}
            >
              <Text style={styles.statusChipEmoji}>{opt.emoji}</Text>
              <Text style={[styles.statusChipLabel, isActive && styles.statusChipLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Category filter — scrolls with content */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[styles.chip, isActive && { borderColor: cat.accent, backgroundColor: cat.accent + '18' }]}
                activeOpacity={0.7}
              >
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text style={[styles.chipLabel, isActive && { color: cat.accent }]}>{cat.label}</Text>
                {isActive && <View style={[styles.chipDot, { backgroundColor: cat.accent }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  const EmptyState = (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🪞</Text>
      <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
      <Text style={styles.emptySub}>Add your first item{'\n'}to start building your perfect wardrobe</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddItem')} activeOpacity={0.85}>
        <Text style={styles.emptyBtnText}>+ Add First Item</Text>
      </TouchableOpacity>
    </View>
  );

  const cat = selectedItem ? (CATEGORY_MAP[selectedItem.category] || CATEGORY_MAP['all']) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      {/* ── Item popup modal ── */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedItem(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {/* Image */}
            <View style={[styles.modalImageWrap, { backgroundColor: cat?.bg || COLORS.surface }]}>
              {selectedItem?.image ? (
                <Image source={{ uri: selectedItem.image }} style={styles.modalImage} resizeMode="contain" />
              ) : (
                <Text style={{ fontSize: 60 }}>{cat?.emoji}</Text>
              )}
            </View>

            {/* Info */}
            <View style={styles.modalInfo}>
              <Text style={styles.modalName}>{selectedItem?.name}</Text>
              {selectedItem?.brand ? <Text style={styles.modalBrand}>{selectedItem.brand}</Text> : null}
              <View style={styles.modalTags}>
                <View style={[styles.modalTag, { backgroundColor: cat?.bg }]}>
                  <Text style={[styles.modalTagText, { color: cat?.accent }]}>{selectedItem?.category}</Text>
                </View>
                <View style={styles.modalTag}>
                  <Text style={styles.modalTagText}>{selectedItem?.season}</Text>
                </View>
                <View style={styles.modalTag}>
                  <Text style={styles.modalTagText}>{selectedItem?.style}</Text>
                </View>
              </View>
              {selectedItem?.wearCount > 0 && (
                <Text style={styles.modalWear}>Worn {selectedItem.wearCount} times</Text>
              )}
            </View>

            {/* Close */}
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedItem(null)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Fixed: Nav tabs */}
      <NavTabBar navigation={navigation} activeRoute="Home" />

      {/* Scrollable list */}
      <Animated.FlatList
        data={filtered}
        renderItem={renderCard}
        keyExtractor={i => i.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  statusRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  statusChipActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldDim,
  },
  statusChipEmoji: { fontSize: 13 },
  statusChipLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.sans,
  },
  statusChipLabelActive: {
    color: COLORS.gold,
  },

  filterWrap: {
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  filterScroll: { paddingHorizontal: 14, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 100, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, gap: 5,
  },
  chipEmoji: { fontSize: 13 },
  chipLabel: { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONTS.sans },
  chipDot: { width: 4, height: 4, borderRadius: 2, marginLeft: 1 },

  hero: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  dateStr: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONTS.serif,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 36,
    fontFamily: FONTS.serif,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  itemsCount: {
    alignItems: 'flex-end',
    paddingBottom: 4,
  },
  itemsBadgeNum: {
    color: COLORS.gold,
    fontSize: 20,
    fontFamily: FONTS.serif,
    letterSpacing: -0.5,
  },
  itemsBadgeLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: 1,
  },

  list: { paddingBottom: 40 },
  listEmpty: { flexGrow: 1 },
  row: { paddingHorizontal: 14, gap: 14, marginBottom: 14 },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalImageWrap: {
    width: '100%',
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalInfo: {
    padding: 20,
    gap: 8,
  },
  modalName: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontFamily: FONTS.serif,
    letterSpacing: -0.3,
  },
  modalBrand: {
    color: COLORS.gold,
    fontSize: 12,
    fontFamily: FONTS.sans,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  modalTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTagText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.sans,
  },
  modalWear: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.sans,
    marginTop: 4,
  },
  modalClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 22, fontFamily: FONTS.serif, marginBottom: 10, textAlign: 'center' },
  emptySub: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  emptyBtn: { backgroundColor: COLORS.gold, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 100 },
  emptyBtnText: { color: '#0A0A0A', fontSize: 15, fontFamily: FONTS.sansMedium, fontWeight: '700', letterSpacing: 0.3 },
});
