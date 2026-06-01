import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Image, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useWardrobe } from '../context/WardrobeContext';
import NavTabBar from '../components/NavTabBar';
import AdBanner from '../components/AdBanner';
import { analyzeClothing } from '../services/gemini';
import { generateFromReference } from '../services/imagegen';
import { COLORS, FONTS, CATEGORIES, SEASONS, STYLES, PRESET_COLORS } from '../theme';

const ITEM_CATEGORIES = CATEGORIES.filter(c => c.id !== 'all');

export default function AddItemScreen({ navigation }) {
  const { addItem } = useWardrobe();

  const [image, setImage]                     = useState(null);
  const [originalImage, setOriginalImage]     = useState(null);
  const [name, setName]                       = useState('');
  const [brand, setBrand]                     = useState('');
  const [description, setDescription]         = useState('');
  const [category, setCategory]               = useState(null);
  const [color, setColor]                     = useState(PRESET_COLORS[0]);
  const [season, setSeason]                   = useState('All Year');
  const [style, setStyle]                     = useState('Casual');
  const [focusedInput, setFocusedInput]       = useState(null);
  const [analyzing, setAnalyzing]             = useState(false);
  const [aiDone, setAiDone]                   = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [selectedSource, setSelectedSource]   = useState('ai'); // 'original' | 'ai'

  // ── Take photo → Gemini ──────────────────────────────────────────────────

  const scanItem = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow camera access in your device settings.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.6,
        base64: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset?.uri) {
        Alert.alert('Error', 'Could not read image. Please try again.');
        return;
      }

      setOriginalImage(asset.uri);
      setImage(asset.uri);
      setAiDone(false);
      setAnalyzing(true);

      // Compress to 512px
      const compressed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      const smallBase64 = compressed.base64;

      try {
        // Step 1: Groq analysis
        const data = await analyzeClothing(smallBase64);
        if (data.name)        setName(data.name);
        if (data.brand)       setBrand(data.brand);
        if (data.description) setDescription(data.description);
        if (data.category && ITEM_CATEGORIES.find(c => c.id === data.category))
          setCategory(data.category);
        if (data.color)    setColor(data.color);
        if (data.season && SEASONS.includes(data.season))  setSeason(data.season);
        if (data.style  && STYLES.includes(data.style))    setStyle(data.style);
        setAiDone(true);
        setAnalyzing(false);

        // Step 2: Image generation
        setImageGenerating(true);
        try {
          const generated = await generateFromReference(smallBase64, data);
          if (generated) setImage(generated);
        } catch (genErr) {
          Alert.alert('Image Generation Error', genErr.message);
        } finally {
          setImageGenerating(false);
        }

      } catch (e) {
        Alert.alert('AI Error', e.message || 'Could not analyze image. Fill in the details manually.');
      } finally {
        setAnalyzing(false);
      }

    } catch (e) {
      Alert.alert('Camera Error', e.message || 'Could not open camera.');
    }
  };

  // ── Re-scan from gallery (manual fallback) ───────────────────────────────

  const rescan = () => {
    setImage(null); setOriginalImage(null);
    setName(''); setBrand(''); setDescription(''); setCategory(null);
    setColor(PRESET_COLORS[0]); setSeason('All Year'); setStyle('Casual');
    setAiDone(false); setImageGenerating(false);
    scanItem();
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Missing name', 'Please enter an item name'); return; }
    if (!category)    { Alert.alert('Missing category', 'Please select a category'); return; }
    const aiImage = image && image !== originalImage ? image : null;
    const savedImage = selectedSource === 'original' ? originalImage : (aiImage || originalImage);
    addItem({ name: name.trim(), brand: brand.trim(), category, color, season, style, image: savedImage });
    setName(''); setBrand(''); setDescription(''); setCategory(null);
    setColor(PRESET_COLORS[0]); setSeason('All Year'); setStyle('Casual');
    setImage(null); setOriginalImage(null); setAiDone(false); setImageGenerating(false);
    setSelectedSource('ai');
    Alert.alert('', '✓ Item added to wardrobe', [{ text: 'OK' }]);
  };

  const activeCat = ITEM_CATEGORIES.find(c => c.id === category);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <NavTabBar navigation={navigation} activeRoute="AddItem" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Item</Text>
          <Text style={styles.headerSub}>Scan with AI or fill manually</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Camera / AI scan area ─────────────────────────── */}
          {!originalImage ? (
            <TouchableOpacity style={styles.scanArea} onPress={scanItem} activeOpacity={0.85}>
              <View style={styles.scanRing}>
                <Text style={styles.scanIcon}>✦</Text>
              </View>
              <Text style={styles.scanTitle}>Scan Item with AI</Text>
              <Text style={styles.scanSub}>Point camera at your clothing{'\n'}AI will fill in all details automatically</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.imagePairRow}>
              {/* Original */}
              <TouchableOpacity
                style={styles.imageHalf}
                onPress={() => setSelectedSource('original')}
                activeOpacity={0.85}
              >
                <Text style={[styles.imageHalfLabel, selectedSource === 'original' && styles.imageHalfLabelSelected]}>
                  ORIGINAL {selectedSource === 'original' ? '✓' : ''}
                </Text>
                <View style={[styles.imageHalfCard, selectedSource === 'original' && styles.imageHalfCardSelected]}>
                  <Image source={{ uri: originalImage }} style={styles.imageHalfPreview} resizeMode="cover" />
                  {analyzing && (
                    <View style={styles.analyzingOverlay}>
                      <ActivityIndicator size="small" color={COLORS.gold} />
                    </View>
                  )}
                  {selectedSource === 'original' && (
                    <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓</Text></View>
                  )}
                </View>
              </TouchableOpacity>

              {/* AI generated */}
              <TouchableOpacity
                style={styles.imageHalf}
                onPress={() => aiDone && !imageGenerating && image !== originalImage && setSelectedSource('ai')}
                activeOpacity={0.85}
              >
                <Text style={[styles.imageHalfLabel, selectedSource === 'ai' && styles.imageHalfLabelSelected]}>
                  AI {selectedSource === 'ai' && aiDone && image !== originalImage ? '✓' : ''}
                </Text>
                <View style={[styles.imageHalfCardWhite, selectedSource === 'ai' && aiDone && image !== originalImage && styles.imageHalfCardSelected]}>
                  {image && image !== originalImage ? (
                    <Image source={{ uri: image }} style={styles.imageHalfPreview} resizeMode="contain" />
                  ) : (
                    <View style={styles.imageHalfEmpty}>
                      {imageGenerating
                        ? <ActivityIndicator color={COLORS.gold} />
                        : <Text style={styles.imageHalfEmptyIcon}>✦</Text>
                      }
                      {imageGenerating && <Text style={styles.generatingText}>Generating...</Text>}
                    </View>
                  )}
                  {selectedSource === 'ai' && aiDone && !imageGenerating && image !== originalImage && (
                    <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>✓</Text></View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {originalImage && !analyzing && (
            <TouchableOpacity style={styles.rescanBtn} onPress={rescan} activeOpacity={0.8}>
              <Text style={styles.rescanText}>📷 Rescan</Text>
            </TouchableOpacity>
          )}

          {/* ── Form (shown after scan or always) ─────────────── */}
          {(image && !analyzing) || !image ? (
            <>
              {/* Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Item Name</Text>
                <View style={[styles.inputWrap, focusedInput === 'name' && styles.inputWrapFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Classic White Shirt"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* Category */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  {ITEM_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCategory(cat.id)}
                      style={[styles.catBtn, category === cat.id && { borderColor: cat.accent, backgroundColor: cat.bg }]}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.catLabel, category === cat.id && { color: cat.accent }]}>{cat.label}</Text>
                      {category === cat.id && (
                        <View style={[styles.catCheck, { backgroundColor: cat.accent }]}>
                          <Text style={styles.catCheckText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Color</Text>
                <View style={styles.colorGrid}>
                  {PRESET_COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setColor(c)}
                      style={[
                        styles.colorBtn,
                        { backgroundColor: c },
                        (c === '#FFFFFF' || c === '#F5F0E8') ? { borderColor: COLORS.border } : {},
                        color === c && styles.colorBtnSelected,
                      ]}
                      activeOpacity={0.8}
                    >
                      {color === c && <Text style={styles.colorCheck}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Brand */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Brand (optional)</Text>
                <View style={[styles.inputWrap, focusedInput === 'brand' && styles.inputWrapFocused]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Zara, H&M, Nike..."
                    placeholderTextColor={COLORS.textMuted}
                    value={brand}
                    onChangeText={setBrand}
                    onFocus={() => setFocusedInput('brand')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <View style={styles.descLabelRow}>
                  <Text style={styles.fieldLabel}>Image Description</Text>
                  <Text style={styles.descHint}>Used to generate product photo</Text>
                </View>
                <View style={[styles.inputWrap, styles.descWrap, focusedInput === 'desc' && styles.inputWrapFocused]}>
                  <TextInput
                    style={[styles.input, styles.descInput]}
                    placeholder={
                      'e.g. slim-fit white cotton button-down shirt, long sleeves, ' +
                      'pointed collar, front chest pocket, slightly sheer fabric, ' +
                      'casual-formal style, no pattern'
                    }
                    placeholderTextColor={COLORS.textMuted}
                    value={description}
                    onChangeText={setDescription}
                    onFocus={() => setFocusedInput('desc')}
                    onBlur={() => setFocusedInput(null)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Season */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Season</Text>
                <View style={styles.chipRow}>
                  {SEASONS.map(s => (
                    <TouchableOpacity
                      key={s} onPress={() => setSeason(s)}
                      style={[styles.toggleChip, season === s && styles.toggleChipActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.toggleChipText, season === s && styles.toggleChipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Style */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Style</Text>
                <View style={styles.chipRow}>
                  {STYLES.map(s => (
                    <TouchableOpacity
                      key={s} onPress={() => setStyle(s)}
                      style={[styles.toggleChip, style === s && styles.toggleChipActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.toggleChipText, style === s && styles.toggleChipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Save */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                <View style={styles.saveBtnInner}>
                  <Text style={styles.saveBtnText}>Save Item</Text>
                  <Text style={styles.saveBtnArrow}>→</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 28, fontFamily: FONTS.serif, letterSpacing: -0.5 },
  headerSub: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONTS.sans, marginTop: 2 },

  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  // ── Scan area ──────────────────────────────────────────────

  scanArea: {
    height: 200,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.gold + '50',
    borderStyle: 'dashed',
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  scanRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.goldDim,
    marginBottom: 4,
  },
  scanIcon: { color: COLORS.gold, fontSize: 24 },
  scanTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONTS.serif, letterSpacing: 0.2 },
  scanSub: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONTS.sans, textAlign: 'center', lineHeight: 18 },

  // ── Image pair ─────────────────────────────────────────────

  imagePairRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  imageHalf: { flex: 1 },
  imageHalfLabel: {
    color: COLORS.textMuted, fontSize: 9, fontFamily: FONTS.sans,
    letterSpacing: 1.2, marginBottom: 6, textAlign: 'center',
  },
  imageHalfLabelSelected: {
    color: COLORS.gold,
  },
  imageHalfCard: {
    height: 200, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  imageHalfCardWhite: {
    height: 200, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#FFFFFF',
  },
  imageHalfCardSelected: {
    borderWidth: 2, borderColor: COLORS.gold,
  },
  selectedBadge: {
    position: 'absolute', bottom: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.gold,
    justifyContent: 'center', alignItems: 'center',
  },
  selectedBadgeText: { color: '#0A0A0A', fontSize: 12, fontWeight: '700' },
  imageHalfPreview: { width: '100%', height: '100%' },
  imageHalfEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  imageHalfEmptyIcon: { color: COLORS.textMuted, fontSize: 24 },
  generatingText: { color: COLORS.gold, fontSize: 10, fontFamily: FONTS.sans },

  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  analyzingText: { color: COLORS.gold, fontSize: 15, fontFamily: FONTS.serif, letterSpacing: 0.3 },
  aiBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.goldDim,
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  aiBadgeText: { color: COLORS.gold, fontSize: 11, fontFamily: FONTS.serif, letterSpacing: 0.5 },
  rescanBtn: {
    alignSelf: 'flex-end', marginBottom: 16,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
  },
  rescanText: { color: COLORS.textPrimary, fontSize: 12, fontFamily: FONTS.sans },

  // ── Form ───────────────────────────────────────────────────

  fieldGroup: { marginBottom: 22 },
  fieldLabel: {
    color: COLORS.textSecondary, fontSize: 11, letterSpacing: 1.2,
    textTransform: 'uppercase', fontFamily: FONTS.sans, marginBottom: 10,
  },
  inputWrap: {
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 13,
  },
  inputWrapFocused: { borderColor: COLORS.gold },
  input: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONTS.sans },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, gap: 6, position: 'relative',
  },
  catEmoji: { fontSize: 15 },
  catLabel: { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONTS.sans },
  catCheck: {
    position: 'absolute', top: -6, right: -6,
    width: 17, height: 17, borderRadius: 8.5,
    justifyContent: 'center', alignItems: 'center',
  },
  catCheckText: { color: '#0A0A0A', fontSize: 9, fontWeight: '700' },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1.5, borderColor: 'transparent',
    justifyContent: 'center', alignItems: 'center',
  },
  colorBtnSelected: { borderColor: COLORS.gold, transform: [{ scale: 1.2 }] },
  colorCheck: { color: COLORS.gold, fontSize: 13, fontWeight: '700' },

  descLabelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  descHint: { color: COLORS.gold, fontSize: 10, fontFamily: FONTS.sans, letterSpacing: 0.3 },
  descWrap: { paddingVertical: 10 },
  descInput: { minHeight: 90, lineHeight: 20 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggleChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  toggleChipActive: { borderColor: COLORS.gold, backgroundColor: COLORS.goldDim },
  toggleChipText: { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONTS.sans },
  toggleChipTextActive: { color: COLORS.gold, fontWeight: '600' },

  saveBtn: { marginTop: 10, borderRadius: 14, overflow: 'hidden', backgroundColor: COLORS.gold },
  saveBtnInner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 10 },
  saveBtnText: { color: '#0A0A0A', fontSize: 16, fontFamily: FONTS.serif, fontWeight: '700', letterSpacing: 0.5 },
  saveBtnArrow: { color: '#0A0A0A', fontSize: 18 },
});
