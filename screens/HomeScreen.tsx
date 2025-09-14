import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import { signOutUser } from '../services/authService';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Button, Card, IconButton, MusicIcon, HeartIcon, StarIcon } from '../components/ui';
import { theme } from '../types/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  loggedConcertsCount: number;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, setUser } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            // User document doesn't exist, create it
            console.log('Creating user profile for:', user.uid);
            const displayName = user.email?.split('@')[0] || 'User';
            const userData = {
              uid: user.uid,
              email: user.email,
              displayName: displayName,
              loggedConcertsCount: 0,
            };

            await setDoc(doc(db, 'users', user.uid), userData);
            setUserProfile(userData);
          }
        } catch (error: any) {
          console.error('Error fetching user profile:', error);

          // If it's a permissions error, try to create the user document
          if (error.code === 'permission-denied' && user) {
            try {
              console.log('Creating user profile due to permissions error:', user.uid);
              const displayName = user.email?.split('@')[0] || 'User';
              const userData = {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                loggedConcertsCount: 0,
              };

              await setDoc(doc(db, 'users', user.uid), userData);
              setUserProfile(userData);
            } catch (createError) {
              console.error('Error creating user profile:', createError);
            }
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutUser();
              setUser(null);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.surfaceVariant]}
          style={styles.gradient}
        >
          <View style={styles.centerContainer}>
            <View style={styles.loadingCard}>
              <Text style={styles.loadingEmoji}>🎵</Text>
              <Text style={styles.loadingText}>Loading your music journey...</Text>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surfaceVariant]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.welcomeSection}>
              <MusicIcon size="lg" color="primary" style={styles.welcomeIcon} />
              <Text style={styles.welcomeTitle}>Welcome back!</Text>
              <Text style={styles.displayName}>
                {userProfile?.displayName || user?.email?.split('@')[0] || 'Music Lover'}
              </Text>
            </View>

            <IconButton
              icon={<StarIcon size="lg" color="textSecondary" />}
              onPress={handleSignOut}
              variant="ghost"
              size="md"
              style={styles.signOutIconButton}
            />
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Card variant="elevated" style={styles.statsCard}>
              <LinearGradient
                colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statsGradient}
              >
                <View style={styles.statsContent}>
                  <MusicIcon size="xl" color="primary" />
                  <Text style={styles.statNumber}>
                    {userProfile?.loggedConcertsCount || 0}
                  </Text>
                  <Text style={styles.statLabel}>Concerts Logged</Text>
                  <Text style={styles.statsSubtext}>
                    Keep the music memories alive!
                  </Text>
                </View>
              </LinearGradient>
            </Card>
          </View>

          {/* Quick Actions Section */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubtitle}>Jump into your musical adventure</Text>

            <View style={styles.actionButtons}>
              <Card variant="elevated" style={styles.actionCard}>
                <Button
                  title="Log a Concert"
                  onPress={() => navigation.navigate('LogConcert')}
                  variant="gradient"
                  size="lg"
                  fullWidth
                  style={styles.actionButton}
                />
                <Text style={styles.actionDescription}>
                  Capture your live music moments
                </Text>
              </Card>

              <Card variant="outlined" style={styles.actionCard}>
                <Button
                  title="Explore & Discover"
                  onPress={() => navigation.navigate('MainTabs' as any)}
                  variant="ghost"
                  size="lg"
                  fullWidth
                  style={styles.actionButton}
                />
                <Text style={styles.actionDescription}>
                  Find your next favorite show
                </Text>
              </Card>

              <Card variant="outlined" style={styles.actionCard}>
                <Button
                  title="My Profile"
                  onPress={() => navigation.navigate('UserProfile', { userId: user?.uid })}
                  variant="ghost"
                  size="lg"
                  fullWidth
                  style={styles.actionButton}
                />
                <Text style={styles.actionDescription}>
                  View your music journey
                </Text>
              </Card>
            </View>
          </View>

          {/* Fun Quote Section */}
          <View style={styles.quoteSection}>
            <Card variant="filled" style={styles.quoteCard}>
              <HeartIcon size="lg" color="primary" style={styles.quoteIcon} />
              <Text style={styles.quoteText}>
                "Music is the universal language of mankind."
              </Text>
              <Text style={styles.quoteAuthor}>- Henry Wadsworth Longfellow</Text>
            </Card>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradient: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  loadingCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium as any,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeIcon: {
    marginBottom: theme.spacing.sm,
  },
  welcomeTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  displayName: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  signOutIcon: {
    fontSize: theme.typography.fontSize.lg,
  },
  statsIcon: {
    marginBottom: theme.spacing.sm,
  },
  signOutIconButton: {
    marginTop: theme.spacing.sm,
  },
  statsSection: {
    marginBottom: theme.spacing.xl,
  },
  statsCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  statsContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.surface,
    fontWeight: theme.typography.fontWeight.medium as any,
    opacity: 0.9,
  },
  statsSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.surface,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  actionsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  actionButtons: {
    gap: theme.spacing.md,
  },
  actionCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  actionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  quoteSection: {
    marginTop: theme.spacing.lg,
  },
  quoteCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
  },
  quoteIcon: {
    marginBottom: theme.spacing.sm,
  },
  quoteText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  quoteAuthor: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium as any,
  },
});

export default HomeScreen;
