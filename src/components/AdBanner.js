import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../theme';

let BannerAd   = null;
let BannerAdSize = null;
let TestIds    = null;

try {
  const admob  = require('react-native-google-mobile-ads');
  BannerAd     = admob.BannerAd;
  BannerAdSize = admob.BannerAdSize;
  TestIds      = admob.TestIds;
} catch (e) {}

const ADS_AVAILABLE = !!BannerAd;

const REAL_ANDROID_ID = 'ca-app-pub-7192489598387711/2548670117';
const REAL_IOS_ID     = 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';

const UNIT_ID = !ADS_AVAILABLE
  ? 'unused'
  : __DEV__
    ? TestIds.BANNER
    : Platform.OS === 'ios'
      ? REAL_IOS_ID
      : REAL_ANDROID_ID;

export default function AdBanner() {
  if (!ADS_AVAILABLE) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Ad Banner</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  placeholder: {
    height: 50,
    width: '100%',
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#444',
  },
  placeholderText: {
    color: '#555',
    fontSize: 11,
    letterSpacing: 1,
  },
});