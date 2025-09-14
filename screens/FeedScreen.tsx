import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { getFeedActivities } from '../services/feedService';
import { RootStackParamList } from '../types';
import { Card, Button, IconButton, MusicIcon, MessageSquareIcon, MailIcon, ClockIcon, ChevronRightIcon } from '../components/ui';
import { theme } from '../types/theme';

type FeedScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;
type FeedScreenRouteProp = RouteProp<RootStackParamList, 'MainTabs'>;

interface Props {
  navigation: FeedScreenNavigationProp;
  route: FeedScreenRouteProp;
}

interface FeedItem {
  id: string;
  type: 'concert_logged' | 'review_posted';
  userId: string;
  userDisplayName: string;
  concertId: string;
  concertName: string;
  artistName: string;
  venueName: string;
  reviewId?: string;
  timestamp: Date;
}

const FeedScreen: React.FC<Partial<Props>> = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadFeed();
    }
  }, [user]);

  const loadFeed = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const activities = await getFeedActivities(user.uid);
      setFeedItems(activities);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const renderFeedItem = (item: FeedItem) => {
    const handlePress = () => {
      navigation?.navigate('ConcertDetail', { concertId: item.concertId });
    };

    const getActivityText = () => {
      switch (item.type) {
        case 'concert_logged':
          return `${item.userDisplayName} logged a concert`;
        case 'review_posted':
          return `${item.userDisplayName} reviewed a concert`;
        default:
          return `${item.userDisplayName} had activity`;
      }
    };

    const getActivitySubtitle = () => {
      return `${item.artistName} at ${item.venueName}`;
    };

    const getTimeAgo = (timestamp: Date) => {
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const getActivityIcon = () => {
      switch (item.type) {
        case 'concert_logged':
          return <MusicIcon size="lg" color="primary" />;
        case 'review_posted':
          return <MessageSquareIcon size="lg" color="secondary" />;
        default:
          return <MusicIcon size="lg" color="textSecondary" />;
      }
    };

    const getActivityColor = () => {
      switch (item.type) {
        case 'concert_logged':
          return theme.colors.primary;
        case 'review_posted':
          return theme.colors.secondary;
        default:
          return theme.colors.textSecondary;
      }
    };

    return (
      <Card
        key={item.id}
        variant="elevated"
        style={styles.feedCard}
        onPress={handlePress}
      >
        <View style={styles.feedContent}>
          <View style={[styles.activityIcon, { backgroundColor: getActivityColor() + '20' }]}>
            {getActivityIcon()}
          </View>

          <View style={styles.activityDetails}>
            <Text style={styles.activityText}>
              {getActivityText()}
            </Text>
            <Text style={styles.activitySubtitle}>
              {getActivitySubtitle()}
            </Text>
            <View style={styles.timestampRow}>
              <ClockIcon size="sm" color="textSecondary" />
              <Text style={styles.timestamp}>
                {getTimeAgo(item.timestamp)}
              </Text>
            </View>
          </View>

          <View style={styles.arrowContainer}>
            <ChevronRightIcon size="md" color="textSecondary" />
          </View>
        </View>
      </Card>
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
            <Card variant="elevated" style={styles.loadingCard}>
              <MusicIcon size="xl" color="primary" />
              <Text style={styles.loadingText}>Loading your feed...</Text>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Activity Feed</Text>
            <Text style={styles.subtitle}>See what your friends are up to</Text>
          </View>

          {feedItems.length === 0 ? (
            <Card variant="outlined" style={styles.emptyState}>
              <MailIcon size="xl" color="textSecondary" />
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.emptyText}>
                Follow some friends to see their concert activities here!
              </Text>
              <Button
                title="Explore Users"
                onPress={() => {
                  // Since we're in a tab navigator, we need to emit an event or use a different navigation method
                  // For now, we'll just show an alert
                  alert('Navigate to Explore tab manually');
                }}
                variant="outline"
                size="md"
                style={styles.emptyActionButton}
              />
            </Card>
          ) : (
            <View style={styles.feedList}>
              {feedItems.map(renderFeedItem)}
            </View>
          )}
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
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: 'bold' as any,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500' as any,
  },
  feedList: {
    gap: theme.spacing.md,
  },
  feedCard: {
    marginBottom: theme.spacing.md,
  },
  feedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  activityDetails: {
    flex: 1,
  },
  activityText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    fontWeight: '500' as any,
    marginBottom: theme.spacing.xs,
  },
  activitySubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: theme.typography.lineHeight.normal,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textTertiary,
    marginLeft: theme.spacing.xs,
    fontWeight: '400' as any,
  },
  arrowContainer: {
    marginLeft: theme.spacing.sm,
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    fontWeight: '500' as any,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.lg,
  },
  emptyActionButton: {
    marginTop: theme.spacing.md,
  },
});

export default FeedScreen;
