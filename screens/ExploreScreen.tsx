import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import {
  searchConcerts,
  searchArtists,
  searchVenues,
  getTrendingConcerts,
  getPopularArtists,
  debounce,
} from '../services/searchService';
import { getArtistByRef, getVenueByRef } from '../services/concertService';
import { showErrorToast, showInfoToast } from '../components/Toast';
import { logAnalyticsEvent } from '../services/analyticsService';
import { RootStackParamList, Concert, Artist, Venue } from '../types';
import { Input, Card, Button, IconButton, SearchIcon, MusicIcon, MapPinIcon, StarIcon, TrendingUpIcon, UsersIcon, XIcon } from '../components/ui';
import { theme } from '../types/theme';

type ExploreScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface SearchResult {
  type: 'concert' | 'artist' | 'venue';
  data: Concert | Artist | Venue;
}

const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<ExploreScreenNavigationProp>();
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [trendingConcerts, setTrendingConcerts] = useState<Concert[]>([]);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const [concerts, artists, venues] = await Promise.all([
          searchConcerts(query.trim()),
          searchArtists(query.trim()),
          searchVenues(query.trim()),
        ]);

        const results: SearchResult[] = [
          ...concerts.map(concert => ({ type: 'concert' as const, data: concert })),
          ...artists.map(artist => ({ type: 'artist' as const, data: artist })),
          ...venues.map(venue => ({ type: 'venue' as const, data: venue })),
        ];

        setSearchResults(results);

        // Log analytics
        await logAnalyticsEvent('search_performed', {
          search_term: query,
          results_count: results.length,
        });
      } catch (error) {
        console.error('Error searching:', error);
        showErrorToast('Failed to perform search');
      } finally {
        setSearchLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    loadTrendingContent();
  }, []);

  const loadTrendingContent = async () => {
    try {
      setLoading(true);
      const [concerts, artists] = await Promise.all([
        getTrendingConcerts(),
        getPopularArtists(),
      ]);
      setTrendingConcerts(concerts);
      setPopularArtists(artists);
    } catch (error) {
      console.error('Error loading trending content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchInputChange = useCallback((text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  }, [debouncedSearch]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
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

  const renderSearchResult = (result: SearchResult) => {
    const handlePress = () => {
      if (result.type === 'concert') {
        navigation.navigate('ConcertDetail', { concertId: (result.data as Concert).id });
      }
      // For now, artists and venues don't have detail screens
    };

    const getIcon = () => {
      switch (result.type) {
        case 'concert':
          return <MusicIcon size="md" color="primary" />;
        case 'artist':
          return <MusicIcon size="md" color="secondary" />;
        case 'venue':
          return <MapPinIcon size="md" color="textSecondary" />;
        default:
          return <SearchIcon size="md" color="textSecondary" />;
      }
    };

    const getTypeColor = () => {
      switch (result.type) {
        case 'concert':
          return theme.colors.primary;
        case 'artist':
          return theme.colors.secondary;
        case 'venue':
          return theme.colors.info;
        default:
          return theme.colors.textSecondary;
      }
    };

    return (
      <Card
        key={`${result.type}-${(result.data as any).id}`}
        variant="elevated"
        style={styles.searchResultCard}
        onPress={handlePress}
      >
        <View style={styles.resultHeader}>
          <View style={[styles.resultTypeBadge, { backgroundColor: getTypeColor() }]}>
            <Text style={styles.resultTypeText}>{result.type.toUpperCase()}</Text>
          </View>
          <View style={styles.resultIcon}>
            {getIcon()}
          </View>
        </View>

        <Text style={styles.resultName}>
          {(result.data as any).name || 'Unknown'}
        </Text>

        {result.type === 'concert' && (
          <View style={styles.concertDetails}>
            <View style={styles.detailRow}>
              <MapPinIcon size="sm" color="textSecondary" />
              <Text style={styles.detailText}>
                {'Unknown Venue'}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              {renderStars((result.data as Concert).rating)}
            </View>
          </View>
        )}

        {result.type === 'artist' && (
          <View style={styles.detailRow}>
            <MusicIcon size="sm" color="textSecondary" />
            <Text style={styles.detailText}>
              {(result.data as Artist).genre?.join(', ') || 'Genre unknown'}
            </Text>
          </View>
        )}

        {result.type === 'venue' && (
          <View style={styles.detailRow}>
            <MapPinIcon size="sm" color="textSecondary" />
            <Text style={styles.detailText}>
              {(result.data as Venue).city}, {(result.data as Venue).state}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  const renderTrendingConcert = (concert: Concert) => (
    <Card
      key={concert.id}
      variant="elevated"
      style={styles.trendingCard}
      onPress={() => navigation.navigate('ConcertDetail', { concertId: concert.id })}
    >
      <View style={styles.cardHeader}>
        <MusicIcon size="lg" color="primary" />
        <Text style={styles.cardBadge}>Trending</Text>
      </View>
      <Text style={styles.trendingArtist}>Loading artist...</Text>
      <View style={styles.venueRow}>
        <MapPinIcon size="sm" color="textSecondary" />
        <Text style={styles.trendingVenue}>Loading venue...</Text>
      </View>
      <View style={styles.ratingContainer}>
        {renderStars(concert.rating)}
      </View>
    </Card>
  );

  const renderPopularArtist = (artist: Artist) => (
    <Card key={artist.id} variant="outlined" style={styles.artistCard}>
      <View style={styles.cardHeader}>
        <MusicIcon size="md" color="secondary" />
        <Text style={styles.cardBadge}>Popular</Text>
      </View>
      <Text style={styles.artistName}>{artist.name}</Text>
      <View style={styles.genreRow}>
        <MusicIcon size="sm" color="textSecondary" />
        <Text style={styles.artistGenre}>
          {artist.genre?.join(', ') || 'Genre unknown'}
        </Text>
      </View>
    </Card>
  );

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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Explore</Text>
            <Text style={styles.subtitle}>Discover amazing concerts and artists</Text>
          </View>

          {/* Search Section */}
          <View style={styles.searchSection}>
            <Input
              placeholder="Search concerts, artists, venues..."
              value={searchQuery}
              onChangeText={handleSearchInputChange}
              leftIcon={<SearchIcon size="md" color="textSecondary" />}
              rightIcon={
                searchQuery ? (
                  <IconButton
                    icon={<XIcon size="md" color="textSecondary" />}
                    onPress={clearSearch}
                    variant="ghost"
                    size="sm"
                  />
                ) : undefined
              }
              style={styles.searchInput}
            />

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsTitle}>Search Results</Text>
                  <Text style={styles.resultsCount}>({searchResults.length})</Text>
                </View>
                <View style={styles.resultsList}>
                  {searchResults.map(renderSearchResult)}
                </View>
              </View>
            )}
          </View>

          {/* Trending Content */}
          <View style={styles.contentSection}>
            {/* Trending Concerts */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <TrendingUpIcon size="lg" color="primary" />
                <Text style={styles.sectionTitle}>Trending Concerts</Text>
              </View>
            </View>

            {loading ? (
              <Card variant="elevated" style={styles.loadingCard}>
                <Text style={styles.loadingText}>Discovering trending concerts...</Text>
              </Card>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContent}
              >
                {trendingConcerts.length === 0 ? (
                  <Card variant="outlined" style={styles.emptyCard}>
                    <TrendingUpIcon size="xl" color="textSecondary" />
                    <Text style={styles.emptyText}>No trending concerts yet</Text>
                    <Text style={styles.emptySubtext}>Check back soon for the hottest shows!</Text>
                  </Card>
                ) : (
                  trendingConcerts.map(renderTrendingConcert)
                )}
              </ScrollView>
            )}

            {/* Popular Artists */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <UsersIcon size="lg" color="secondary" />
                <Text style={styles.sectionTitle}>Popular Artists</Text>
              </View>
            </View>

            {loading ? (
              <Card variant="elevated" style={styles.loadingCard}>
                <Text style={styles.loadingText}>Finding popular artists...</Text>
              </Card>
            ) : (
              <View style={styles.artistGrid}>
                {popularArtists.length === 0 ? (
                  <Card variant="outlined" style={styles.emptyCard}>
                    <UsersIcon size="xl" color="textSecondary" />
                    <Text style={styles.emptyText}>No popular artists yet</Text>
                    <Text style={styles.emptySubtext}>Artists will appear here as they gain popularity!</Text>
                  </Card>
                ) : (
                  popularArtists.map(renderPopularArtist)
                )}
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
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  searchSection: {
    marginBottom: theme.spacing.xl,
  },
  searchInput: {
    marginBottom: theme.spacing.lg,
  },
  searchResults: {
    marginTop: theme.spacing.lg,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  resultsTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text,
  },
  resultsCount: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  resultsList: {
    gap: theme.spacing.md,
  },
  searchResultCard: {
    marginBottom: theme.spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  resultTypeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  resultTypeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.surface,
  },
  resultIcon: {
    opacity: 0.7,
  },
  resultName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  concertDetails: {
    marginTop: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  contentSection: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  horizontalScrollContent: {
    paddingRight: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  loadingCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium as any,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed,
  },
  trendingCard: {
    width: 220,
    marginRight: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardBadge: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  trendingArtist: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  trendingVenue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  artistGrid: {
    gap: theme.spacing.md,
  },
  artistCard: {
    padding: theme.spacing.lg,
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  artistGenre: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
});

export default ExploreScreen;
