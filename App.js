import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';

import HomeScreen from './src/screens/HomeScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import OutfitBuilderScreen from './src/screens/OutfitBuilderScreen';
import { WardrobeProvider } from './src/context/WardrobeContext';
import { COLORS } from './src/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular:  require('./assets/fonts/CormorantGaramond_400Regular.ttf'),
    CormorantGaramond_400Italic:   require('./assets/fonts/CormorantGaramond_400Italic.ttf'),
    CormorantGaramond_500Medium:   require('./assets/fonts/CormorantGaramond_500Medium.ttf'),
    CormorantGaramond_600SemiBold: require('./assets/fonts/CormorantGaramond_600SemiBold.ttf'),
    DMSans_400Regular:             require('./assets/fonts/DMSans_400Regular.ttf'),
    DMSans_500Medium:              require('./assets/fonts/DMSans_500Medium.ttf'),
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaProvider>
        <WardrobeProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Tab.Navigator
              tabBar={() => null}
              screenOptions={{ headerShown: false }}
            >
              <Tab.Screen name="Home"    component={HomeScreen} />
              <Tab.Screen name="AddItem" component={AddItemScreen} />
              <Tab.Screen name="Outfits" component={OutfitBuilderScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        </WardrobeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
