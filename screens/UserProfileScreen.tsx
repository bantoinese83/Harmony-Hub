import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { getUserConcerts, getArtistByRef, getVenueByRef } from '../services/concertService';
import { followUser, unfollowUser, isFollowing } from '../services/feedService';
import { RootStackParamList, Concert, Artist, Venue, User } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Button, Card, IconButton, MusicIcon, MapPinIcon, CalendarIcon, StarIcon, UserIcon, PlusIcon } from '../components/ui';
import { theme } from '../types/theme';

type UserProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserProfile'>;
type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

interface Props {
  navigation: UserProfileScreenNavigationProp;
  route: UserProfileScreenRouteProp;
}

interface ConcertWithDetails extends Concert {
  artist?: Artist;
  venue?: Venue;
}

interface UserProfileRouteParams {
  userId?: string; // Optional parameter to view other users' profiles
}

const UserProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const routeParams = route.params as UserProfileRouteParams | undefined;
  const profileUserId = routeParams?.userId || user?.uid || '';
  const isOwnProfile = !routeParams?.userId || routeParams.userId === user?.uid;

  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [concerts, setConcerts] = useState<ConcertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!profileUserId) return;

      try {
        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', profileUserId));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as User);
        } else {
          // User document doesn't exist, create it
          console.log('Creating user profile for:', profileUserId);
          const userData = {
            uid: profileUserId,
            email: '', // We don't have email for other users
            displayName: 'User',
            loggedConcertsCount: 0,
          };

          try {
            await setDoc(doc(db, 'users', profileUserId), userData);
            setUserProfile(userData);
          } catch (createError: any) {
            console.error('Error creating user profile:', createError);
            // If we can't create the profile, still set basic data
            setUserProfile(userData);
          }
        }

        // Check follow status if viewing another user's profile
        if (!isOwnProfile && user) {
          const following = await checkFollowStatus(user.uid, profileUserId);
          setIsFollowingUser(following);
        }

        // Fetch user concerts
        const userConcerts = await getUserConcerts(profileUserId);

        // Fetch artist and venue details for each concert
        const concertsWithDetails: ConcertWithDetails[] = await Promise.all(
          userConcerts.map(async (concert) => {
            const [artist, venue] = await Promise.all([
              getArtistByRef(concert.artistRef),
              getVenueByRef(concert.venueRef),
            ]);

            return {
              ...concert,
              artist: artist || undefined,
              venue: venue || undefined,
            };
          })
        );

        setConcerts(concertsWithDetails);
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [profileUserId, user, isOwnProfile]);

  const checkFollowStatus = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
    try {
      return await isFollowing(currentUserId, targetUserId);
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !userProfile) return;

    setFollowLoading(true);
    try {
      if (isFollowingUser) {
        const success = await unfollowUser(user.uid, profileUserId);
        if (success) {
          setIsFollowingUser(false);
        }
      } else {
        const success = await followUser(user.uid, profileUserId);
        if (success) {
          setIsFollowingUser(true);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          size="sm"
          color={i <= rating ? 'warning' : 'textTertiary'}
        />
      );
    }
    return stars;
  };

  const renderConcertItem = (concert: ConcertWithDetails) => (
    <Card
      key={concert.id}
      variant="elevated"
      style={styles.concertCard}
      onPress={() => navigation?.navigate('ConcertDetail', { concertId: concert.id })}
    >
      <View style={styles.concertHeader}>
        <View style={styles.artistInfo}>
          <MusicIcon size="md" color="primary" />
          <Text style={styles.artistName}>{concert.artist?.name || 'Unknown Artist'}</Text>
        </View>
        <View style={styles.ratingContainer}>
          {renderStars(concert.rating)}
        </View>
      </View>

      <View style={styles.venueInfo}>
        <MapPinIcon size="sm" color="textSecondary" />
        <Text style={styles.venueName}>{concert.venue?.name || 'Unknown Venue'}</Text>
      </View>

      <View style={styles.dateInfo}>
        <CalendarIcon size="sm" color="textSecondary" />
        <Text style={styles.concertDate}>
          {concert.date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      {concert.notes && (
        <Text style={styles.concertNotes} numberOfLines={2}>
          {concert.notes}
        </Text>
      )}
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.surfaceVariant]}
          style={styles.gradient}
        >
          <View style={styles.centerContainer}>
            <Card variant="elevated" style={styles.loadingCard}>
              <MusicIcon size="xl" color="primary" />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </Card>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.surfaceVariant]}
          style={styles.gradient}
        >
          <View style={styles.centerContainer}>
            <Card variant="elevated" style={styles.errorCard}>
              <UserIcon size="lg" color="error" />
              <Text style={styles.errorText}>Failed to load profile</Text>
            </Card>
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
          {/* Profile Header */}
          <View style={styles.header}>
            <Card variant="elevated" style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userProfile.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.displayName}>{userProfile.displayName}</Text>
                  <Text style={styles.email}>{userProfile.email}</Text>
                  {userProfile.bio && <Text style={styles.bio}>{userProfile.bio}</Text>}
                </View>
              </View>

              {/* Follow/Unfollow Button for other users' profiles */}
              {!isOwnProfile && (
                <Button
                  title={isFollowingUser ? 'Following' : 'Follow'}
                  onPress={handleFollowToggle}
                  loading={followLoading}
                  variant={isFollowingUser ? 'outline' : 'gradient'}
                  size="md"
                  fullWidth
                  style={styles.followButton}
                />
              )}

              {isOwnProfile && (
                <Button
                  title="Log New Concert"
                  onPress={() => navigation?.navigate('LogConcert')}
                  variant="gradient"
                  size="md"
                  fullWidth
                  style={styles.logButton}
                />
              )}
            </Card>
          </View>

          {/* Stats */}
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
                  <Text style={styles.statNumber}>{userProfile.loggedConcertsCount}</Text>
                  <Text style={styles.statLabel}>Concerts Logged</Text>
                  <Text style={styles.statsSubtext}>
                    {userProfile.loggedConcertsCount === 0 ? 'Ready to start your journey!' : 'Keep the memories alive! 🎵'}
                  </Text>
                </View>
              </LinearGradient>
            </Card>
          </View>

          {/* Concerts Section */}
          <View style={styles.concertsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isOwnProfile ? 'My Concerts' : `${userProfile.displayName}'s Concerts`}
              </Text>
              {isOwnProfile && concerts.length > 0 && (
                <IconButton
                  icon={<PlusIcon size="md" color="primary" />}
                  onPress={() => navigation?.navigate('LogConcert')}
                  variant="ghost"
                  size="md"
                />
              )}
            </View>

            {concerts.length === 0 ? (
              <Card variant="outlined" style={styles.emptyState}>
                <MusicIcon size="xl" color="textSecondary" />
                <Text style={styles.emptyStateText}>
                  {isOwnProfile ? 'No concerts logged yet' : 'No concerts shared yet'}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {isOwnProfile ? 'Start capturing your live music memories!' : 'Check back later for their concert stories!'}
                </Text>
                {isOwnProfile && (
                  <Button
                    title="Log Your First Concert"
                    onPress={() => navigation?.navigate('LogConcert')}
                    variant="gradient"
                    size="md"
                    style={styles.emptyActionButton}
                  />
                )}
              </Card>
            ) : (
              <View style={styles.concertsList}>
                {concerts.map(renderConcertItem)}
              </View>
            )}
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
  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium as any,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  errorCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  profileCard: {
    padding: theme.spacing.lg,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.surface,
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  bio: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textTertiary,
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  followButton: {
    marginTop: theme.spacing.md,
  },
  logButton: {
    marginTop: theme.spacing.md,
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
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.surface,
    fontWeight: theme.typography.fontWeight.medium as any,
    opacity: 0.9,
    marginTop: theme.spacing.xs,
  },
  statsSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.surface,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  concertsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text,
  },
  concertsList: {
    gap: theme.spacing.md,
  },
  concertCard: {
    marginBottom: theme.spacing.md,
  },
  concertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  artistName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  venueName: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  concertDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  concertNotes: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
    lineHeight: theme.typography.lineHeight.relaxed,
    marginTop: theme.spacing.sm,
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium as any,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyActionButton: {
    marginTop: theme.spacing.md,
  },
});

export default UserProfileScreen;
