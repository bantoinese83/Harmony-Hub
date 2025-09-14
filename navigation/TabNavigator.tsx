import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ExploreScreen from '../screens/ExploreScreen';
import FeedScreen from '../screens/FeedScreen';
import HomeScreen from '../screens/HomeScreen';
import { theme } from '../types/theme';
import { HomeIcon, SearchIcon, StarIcon } from '../components/ui';

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Feed: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// Animated Tab Icon Component
const AnimatedTabIcon = ({ route, focused }: { route: any; focused: boolean }) => {
  const [scaleAnim] = useState(new Animated.Value(focused ? 1.2 : 1));
  const [gradientAnim] = useState(new Animated.Value(focused ? 1 : 0));

  useEffect(() => {
    // Animate scale
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 15,
    }).start();

    // Animate gradient opacity
    Animated.timing(gradientAnim, {
      toValue: focused ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [focused, scaleAnim, gradientAnim]);

  const getTabIcon = (routeName: string) => {
    const iconSize = 'md';
    const iconColor = focused ? 'primary' : 'textSecondary';

    switch (routeName) {
      case 'Home':
        return <HomeIcon size={iconSize} color={iconColor} />;
      case 'Explore':
        return <SearchIcon size={iconSize} color={iconColor} />;
      case 'Feed':
        return <StarIcon size={iconSize} color={iconColor} />;
      default:
        return <HomeIcon size={iconSize} color={iconColor} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: scaleAnim.interpolate({
              inputRange: [1, 1.2],
              outputRange: [0, -3],
            })},
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.iconGradient,
          { opacity: gradientAnim },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
      {getTabIcon(route.name)}
    </Animated.View>
  );
};

// Animated Tab Label Component
const AnimatedTabLabel = ({ route, focused }: { route: any; focused: boolean }) => {
  const [opacityAnim] = useState(new Animated.Value(focused ? 1 : 0.7));
  const [scaleAnim] = useState(new Animated.Value(focused ? 1.1 : 1));

  useEffect(() => {
    // Animate opacity
    Animated.timing(opacityAnim, {
      toValue: focused ? 1 : 0.7,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Animate scale
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      useNativeDriver: true,
      tension: 400,
      friction: 20,
    }).start();
  }, [focused, opacityAnim, scaleAnim]);

  return (
    <Animated.Text
      style={[
        styles.tabLabel,
        focused && styles.activeTabLabel,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {route.name}
    </Animated.Text>
  );
};

// Main Tab Navigator Component
const TabNavigator: React.FC = () => {
  const [tabBarAnim] = useState(new Animated.Value(0));

  // Entrance animation for tab bar
  useEffect(() => {
    // Small delay to ensure component is mounted
    const timeoutId = setTimeout(() => {
      Animated.spring(tabBarAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 12,
      }).start();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [tabBarAnim]);

  const animatedTabBarStyle = {
    transform: [
      {
        translateY: tabBarAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
    opacity: tabBarAnim,
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <AnimatedTabIcon route={route} focused={focused} />
        ),
        tabBarLabel: ({ focused }) => (
          <AnimatedTabLabel route={route} focused={focused} />
        ),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
        tabBarStyle: [styles.tabBar, animatedTabBarStyle],
        tabBarItemStyle: styles.tabBarItem,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'Explore',
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarLabel: 'Feed',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    height: 85,
    paddingBottom: 10,
    paddingTop: 12,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
  },
  tabBarItem: {
    paddingVertical: 6,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.xl,
    marginBottom: 6,
    position: 'relative',
  },
  iconGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.borderRadius.xl,
  },
  tabLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold as any,
  },
  animatedTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TabNavigator;
