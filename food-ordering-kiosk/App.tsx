import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

// Context Providers
import { CartProvider } from './src/context/CartContext';

// Screens
import MenuScreen from './src/screens/MenuScreen';
import CartScreen from './src/screens/CartScreen';

// Types
export type RootStackParamList = {
  Menu: undefined;
  Cart: undefined;
  ItemDetails: { item: any };
  OrderConfirmation: { order: any };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <CartProvider>
      <NavigationContainer>
        <View style={styles.container}>
          <StatusBar style="dark" backgroundColor="#ffffff" />
          
          <Stack.Navigator
            initialRouteName="Menu"
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              cardStyleInterpolator: ({ current, layouts }) => {
                return {
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                };
              },
            }}
          >
            <Stack.Screen 
              name="Menu" 
              component={MenuScreen}
              options={{
                title: 'Menu',
              }}
            />
            
            <Stack.Screen 
              name="Cart" 
              component={CartScreen}
              options={{
                title: 'Your Cart',
              }}
            />
          </Stack.Navigator>
        </View>
      </NavigationContainer>
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
