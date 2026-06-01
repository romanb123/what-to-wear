import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, FlatList,
  StyleSheet, Modal, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWardrobe } from '../context/WardrobeContext';
import NavTabBar from '../components/NavTabBar';
import AdBanner from '../components/AdBanner';
import { COLORS, FONTS, CATEGORY_MAP } from '../theme';

const { height } = Dimensions.get('window');

const SLOTS = [
  { id: 'top',       label: 'Top',            categories: ['Shirts', 'Dresses'], emoji: '👕' },
  { id: 'bottom',    label: 'Bottom',          categories: ['Pants', 'Dresses'],  emoji: '👖' },
  { id: 'outer',     label: 'Outer Layer',     categories: ['Jackets'],           emoji: '🧥' },
  { id: 'shoes',     label: 'Shoes',           categories: ['Shoes'],             emoji: '👟' },
  { id: 'accessory', label: 'Accessory',       categories: ['Accessories'],       emoji: '👜' },
];

export default function OutfitBuilderScreen({ navigation }) {
  const { items, addOutfit, outfits } = useWardrobe();
  const [selected, setSelected] = useState({});
  const [modalSlot, setModalSlot] = useState(null);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const openModal  = useCallback((slot) => setModalSlot(slot), []);
  const closeModal = useCallback(() => setModalSlot(null), []);

  const selectItem = useCallback((slotId, item) => {
    setSelected(prev => ({ ...prev, [slotId]: item }));
    setModalSlot(null);
  }, []);

  const removeSlot = (slotId) =>
    setSelected(prev => { const n = { ...prev }; delete n[slotId]; return n; });

  const saveOutfit = () => {
    const outfitItems = Object.values(selected);
    if (outfitItems.length === 0) return;
    addOutfit({ items: outfitItems, name: `Look — ${dateStr}` });
    setSelected({});
  };

  const modalItems = modalSlot
    ? items.filter(i => SLOTS.find(s => s.id === modalSlot)?.categories.includes(i.category))
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <NavTabBar navigation={navigation} activeRoute="Outfits" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSub}>{dateStr}</Text>
          <Text style={styles.headerTitle}>Build a Look</Text>
        </View>

        {/* Outfit canvas */}
        <View style={styles.canvas}>
          {SLOTS.map(slot => {
            const item = selected[slot.id];
            const cat  = item ? CATEGORY_MAP[item.category] : null;
            return (
              <View key={slot.id} style={styles.slot}>
                <Text style={styles.slotLabel}>{slot.label}</Text>
                {item ? (
                  <TouchableOpacity
                    style={[styles.slotFilled, { backgroundColor: cat?.bg || COLORS.surface }]}
                    onPress={() => openModal(slot.id)}
                    activeOpacity={0.8}
                  >
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.slotImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.slotColor}>
                        <View style={[styles.slotColorCircle, { backgroundColor: item.color || cat?.accent }]} />
                        <Text style={styles.slotEmoji}>{cat?.emoji || slot.emoji}</Text>
                      </View>
                    )}
                    <View style={styles.slotInfo}>
                      <Text style={styles.slotItemName} numberOfLines={1}>{item.name}</Text>
                      {item.brand ? <Text style={styles.slotItemBrand}>{item.brand}</Text> : null}
                    </View>
                    <TouchableOpacity
                      style={styles.slotRemove}
                      onPress={() => removeSlot(slot.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.slotRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.slotEmpty} onPress={() => openModal(slot.id)} activeOpacity={0.7}>
                    <Text style={styles.slotEmojiEmpty}>{slot.emoji}</Text>
                    <Text style={styles.slotAdd}>+ Pick item</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, Object.keys(selected).length === 0 && styles.saveBtnDisabled]}
          onPress={saveOutfit}
          activeOpacity={0.85}
          disabled={Object.keys(selected).length === 0}
        >
          <Text style={[styles.saveBtnText, Object.keys(selected).length === 0 && styles.saveBtnTextDim]}>
            Save Look ✦
          </Text>
        </TouchableOpacity>

        {/* Saved looks */}
        {outfits.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.savedTitle}>Saved Looks</Text>
            {outfits.slice(0, 5).map(outfit => (
              <View key={outfit.id} style={styles.savedOutfit}>
                <View style={styles.savedOutfitItems}>
                  {outfit.items.slice(0, 4).map((item, i) => {
                    const c = CATEGORY_MAP[item.category];
                    return (
                      <View key={i} style={[styles.savedItemDot, { backgroundColor: item.color || c?.accent || '#555' }]} />
                    );
                  })}
                </View>
                <View style={styles.savedOutfitInfo}>
                  <Text style={styles.savedOutfitName}>{outfit.name}</Text>
                  <Text style={styles.savedOutfitCount}>{outfit.items.length} items</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Item picker modal */}
      <Modal visible={!!modalSlot} animationType="slide" transparent onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalBg} onPress={closeModal} activeOpacity={1}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{SLOTS.find(s => s.id === modalSlot)?.label}</Text>
            {modalItems.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>No items in this category</Text>
                <Text style={styles.modalEmptySub}>Add items first from the + tab</Text>
              </View>
            ) : (
              <FlatList
                data={modalItems}
                keyExtractor={i => i.id}
                renderItem={({ item }) => {
                  const cat = CATEGORY_MAP[item.category];
                  return (
                    <TouchableOpacity style={styles.modalItem} onPress={() => selectItem(modalSlot, item)} activeOpacity={0.75}>
                      <View style={[styles.modalItemIcon, { backgroundColor: cat?.bg || COLORS.surface }]}>
                        {item.image ? (
                          <Image source={{ uri: item.image }} style={styles.modalItemImage} resizeMode="cover" />
                        ) : (
                          <>
                            <View style={[styles.modalItemColor, { backgroundColor: item.color || cat?.accent }]} />
                            <Text style={styles.modalItemEmoji}>{cat?.emoji}</Text>
                          </>
                        )}
                      </View>
                      <View style={styles.modalItemInfo}>
                        <Text style={styles.modalItemName}>{item.name}</Text>
                        {item.brand ? <Text style={styles.modalItemBrand}>{item.brand}</Text> : null}
                        <Text style={styles.modalItemWear}>{item.wearCount} wears</Text>
                      </View>
                      {selected[modalSlot]?.id === item.id && (
                        <View style={styles.modalItemCheck}>
                          <Text style={styles.modalItemCheckText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 18, paddingTop: 8 },

  header: { paddingTop: 6, paddingBottom: 20 },
  headerSub: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONTS.serif, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 34, fontFamily: FONTS.serif, letterSpacing: -0.8 },

  canvas: {
    backgroundColor: COLORS.surface, borderRadius: 18,
    borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 10, marginBottom: 18,
  },
  slot: { gap: 6 },
  slotLabel: { color: COLORS.textMuted, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: FONTS.sans },
  slotEmpty: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
    backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.border, borderStyle: 'dashed', paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  slotEmojiEmpty: { fontSize: 18 },
  slotAdd: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.sans },
  slotFilled: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderLight,
    paddingHorizontal: 12, paddingVertical: 10, gap: 12, overflow: 'hidden',
  },
  slotImage: { width: 44, height: 44, borderRadius: 8 },
  slotColor: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.2)' },
  slotColorCircle: { width: 18, height: 18, borderRadius: 9 },
  slotEmoji: { fontSize: 14 },
  slotInfo: { flex: 1 },
  slotItemName: { color: COLORS.textPrimary, fontSize: 13, fontFamily: FONTS.serif },
  slotItemBrand: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  slotRemove: { padding: 4 },
  slotRemoveText: { color: COLORS.textMuted, fontSize: 13 },

  saveBtn: { backgroundColor: COLORS.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 28 },
  saveBtnDisabled: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  saveBtnText: { color: '#0A0A0A', fontSize: 16, fontFamily: FONTS.serif, fontWeight: '700', letterSpacing: 0.5 },
  saveBtnTextDim: { color: COLORS.textMuted },

  savedSection: { marginBottom: 10 },
  savedTitle: { color: COLORS.textSecondary, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: FONTS.sans, marginBottom: 12 },
  savedOutfit: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 8, gap: 12,
  },
  savedOutfitItems: { flexDirection: 'row', gap: 5 },
  savedItemDot: { width: 18, height: 18, borderRadius: 9, opacity: 0.85 },
  savedOutfitInfo: { flex: 1 },
  savedOutfitName: { color: COLORS.textPrimary, fontSize: 13, fontFamily: FONTS.serif },
  savedOutfitCount: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingTop: 12, paddingHorizontal: 18, maxHeight: height * 0.7,
    borderTopWidth: 1, borderColor: COLORS.border,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONTS.serif, marginBottom: 16 },
  modalEmpty: { alignItems: 'center', paddingVertical: 36 },
  modalEmptyText: { color: COLORS.textSecondary, fontSize: 15, fontFamily: FONTS.serif },
  modalEmptySub: { color: COLORS.textMuted, fontSize: 12, marginTop: 6 },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  modalItemIcon: { width: 52, height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 3, overflow: 'hidden' },
  modalItemImage: { width: '100%', height: '100%' },
  modalItemColor: { width: 20, height: 20, borderRadius: 10 },
  modalItemEmoji: { fontSize: 16 },
  modalItemInfo: { flex: 1 },
  modalItemName: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONTS.serif },
  modalItemBrand: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  modalItemWear: { color: COLORS.gold, fontSize: 11, marginTop: 3 },
  modalItemCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.gold, justifyContent: 'center', alignItems: 'center' },
  modalItemCheckText: { color: '#0A0A0A', fontWeight: '700', fontSize: 12 },
});
