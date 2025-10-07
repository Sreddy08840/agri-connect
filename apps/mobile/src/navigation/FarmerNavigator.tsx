import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FarmerStackParamList, FarmerTabParamList } from './types';

// Farmer Screens
import FarmerDashboardScreen from '../screens/farmer/DashboardScreen';
import FarmerProductsScreen from '../screens/farmer/ProductsScreen';
import FarmerOrdersScreen from '../screens/farmer/OrdersScreen';
import FarmerAnalyticsScreen from '../screens/farmer/AnalyticsScreen';
import FarmerProfileScreen from '../screens/farmer/ProfileScreen';
import AddProductScreen from '../screens/farmer/AddProductScreen';
import EditProductScreen from '../screens/farmer/EditProductScreen';
import FarmerOrderDetailScreen from '../screens/farmer/OrderDetailScreen';
import HelpCenterScreen from '../screens/farmer/HelpCenterScreen';
import FAQScreen from '../screens/farmer/FAQScreen';
import ContactSupportScreen from '../screens/farmer/ContactSupportScreen';
import FarmerChatsListScreen from '../screens/farmer/ChatsListScreen';
import FarmerChatConversationScreen from '../screens/farmer/ChatConversationScreen';

const Tab = createBottomTabNavigator<FarmerTabParamList>();
const Stack = createNativeStackNavigator<FarmerStackParamList>();

const FarmerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={FarmerDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <TabIcon name="📊" color={color} />,
        }}
      />
      <Tab.Screen
        name="Products"
        component={FarmerProductsScreen}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ color }) => <TabIcon name="🌾" color={color} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={FarmerOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color }) => <TabIcon name="📦" color={color} />,
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={FarmerAnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color }) => <TabIcon name="📈" color={color} />,
        }}
      />
      <Tab.Screen
        name="Messages"
        component={FarmerChatsListScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => <TabIcon name="💬" color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={FarmerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon name="👤" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const FarmerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#10B981' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="FarmerTabs"
        component={FarmerTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{ title: 'Add Product' }}
      />
      <Stack.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{ title: 'Edit Product' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={FarmerOrderDetailScreen}
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{ title: 'Help Center' }}
      />
      <Stack.Screen
        name="FAQ"
        component={FAQScreen}
        options={{ title: 'FAQ' }}
      />
      <Stack.Screen
        name="ContactSupport"
        component={ContactSupportScreen}
        options={{ title: 'Contact Support' }}
      />
      <Stack.Screen
        name="ChatsList"
        component={FarmerChatsListScreen}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen
        name="ChatConversation"
        component={FarmerChatConversationScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
};

const TabIcon = ({ name, color }: { name: string; color: string }) => {
  return <Text style={{ fontSize: 24, color }}>{name}</Text>;
};

export default FarmerNavigator;
