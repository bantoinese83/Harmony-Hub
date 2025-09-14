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
import {
  getConcertById,
  getArtistByRef,
  getVenueByRef,
  submitReview,
  getConcertReviews,
  toggleReviewLike,
  addCommentToReview,
  getReviewComments,
  hasUserLikedReview,
  getUserByRef,
} from '../services/concertService';
import { RootStackParamList, Concert, Artist, Venue, Review } from '../types';
import {
  Button,
  Input,
  Card,
  IconButton,
  MusicIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  HeartIcon,
  MessageSquareIcon,
  UserIcon,
  SendIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '../components/ui';
import { theme } from '../types/theme';

type ConcertDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ConcertDetail'>;
type ConcertDetailScreenRouteProp = RouteProp<RootStackParamList, 'ConcertDetail'>;

interface Props {
  navigation: ConcertDetailScreenNavigationProp;
  route: ConcertDetailScreenRouteProp;
}

interface ReviewWithDetails extends Review {
  user?: any;
  hasLiked?: boolean;
  comments?: any[];
  showComments?: boolean;
  newComment?: string;
  isSubmittingComment?: boolean;
}

const ConcertDetailScreen: React.FC<Props> = ({ route }) => {
  const { user } = useContext(AuthContext);
  const { concertId } = route.params;

  const [concert, setConcert] = useState<Concert | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [usingFallbackQuery, setUsingFallbackQuery] = useState(false);

  useEffect(() => {
    loadConcertData();
  }, [concertId]);

  const loadConcertData = async () => {
    try {
      setLoading(true);

      // Load concert details
      const concertData = await getConcertById(concertId);
      if (!concertData) {
        Alert.alert('Error', 'Concert not found');
        return;
      }
      setConcert(concertData);

      // Load artist and venue details
      const [artistData, venueData] = await Promise.all([
        getArtistByRef(concertData.artistRef),
        getVenueByRef(concertData.venueRef),
      ]);
      setArtist(artistData);
      setVenue(venueData);

      // Load reviews
      await loadReviews();
    } catch (error) {
      console.error('Error loading concert data:', error);
      Alert.alert('Error', 'Failed to load concert details');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      console.log('Loading concert reviews...');
      setUsingFallbackQuery(false); // Reset fallback state

      const { reviews: reviewsData, usingFallback } = await getConcertReviews(concertId);
      setUsingFallbackQuery(usingFallback);
      const reviewsWithDetails: ReviewWithDetails[] = [];

      for (const review of reviewsData) {
        const user = await getUserByRef(review.userRef);
        const hasLiked = user ? await hasUserLikedReview(review.id, user.uid) : false;

        reviewsWithDetails.push({
          ...review,
          user,
          hasLiked,
          comments: [],
          showComments: false,
          newComment: '',
          isSubmittingComment: false,
        });
      }

      setReviews(reviewsWithDetails);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewText.trim()) {
      Alert.alert('Error', 'Please enter a review');
      return;
    }

    setSubmittingReview(true);
    try {
      await submitReview(concertId, user.uid, 0, reviewText); // Rating will be copied from concert
      setReviewText('');
      await loadReviews(); // Reload reviews to show the new one
      Alert.alert('Success', 'Review submitted successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!user) return;

    try {
      const result = await toggleReviewLike(reviewId, user.uid) as {
        likesCount: number;
        action: string;
      };

      // Update the review's like status and count
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.id === reviewId
            ? {
                ...review,
                likesCount: result.likesCount,
                hasLiked: result.action === 'liked',
              }
            : review
        )
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to like review');
    }
  };

  const handleAddComment = async (reviewId: string, commentText: string) => {
    if (!user || !commentText.trim()) return;

    // Set submitting state for this review
    setReviews(prevReviews =>
      prevReviews.map(review =>
        review.id === reviewId
          ? { ...review, isSubmittingComment: true }
          : review
      )
    );

    try {
      await addCommentToReview(reviewId, user.uid, commentText);

      // Reload comments for this review
      const updatedComments = await getReviewComments(reviewId);

      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.id === reviewId
            ? {
                ...review,
                comments: updatedComments,
                newComment: '',
                isSubmittingComment: false,
                commentsCount: updatedComments.length,
              }
            : review
        )
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add comment');
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.id === reviewId
            ? { ...review, isSubmittingComment: false }
            : review
        )
      );
    }
  };

  const toggleComments = async (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    if (!review.showComments && (!review.comments || review.comments.length === 0)) {
      // Load comments if not already loaded
      try {
        const comments = await getReviewComments(reviewId);
        setReviews(prevReviews =>
          prevReviews.map(r =>
            r.id === reviewId
              ? { ...r, comments, showComments: true }
              : r
          )
        );
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    } else {
      // Toggle visibility
      setReviews(prevReviews =>
        prevReviews.map(r =>
          r.id === reviewId
            ? { ...r, showComments: !r.showComments }
            : r
        )
      );
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

  const renderReview = (review: ReviewWithDetails) => (
    <Card key={review.id} variant="elevated" style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={styles.reviewerAvatar}>
            <Text style={styles.reviewerInitial}>
              {(review.user?.displayName || 'A').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.reviewerDetails}>
            <Text style={styles.reviewerName}>
              {review.user?.displayName || 'Anonymous'}
            </Text>
            <View style={styles.ratingContainer}>
              {renderStars(review.rating)}
            </View>
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {review.createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      <Text style={styles.reviewText}>{review.text}</Text>

      <View style={styles.reviewActions}>
        <IconButton
          icon={<HeartIcon size="md" color={review.hasLiked ? 'error' : 'textSecondary'} />}
          onPress={() => handleLikeReview(review.id)}
          variant="ghost"
          size="sm"
          style={styles.actionButton}
        />
        <Text style={[styles.actionCount, review.hasLiked && styles.actionCountActive]}>
          {review.likesCount}
        </Text>

        <IconButton
          icon={review.showComments ? <ChevronUpIcon size="md" color="primary" /> : <ChevronDownIcon size="md" color="textSecondary" />}
          onPress={() => toggleComments(review.id)}
          variant="ghost"
          size="sm"
          style={styles.actionButton}
        />
        <Text style={styles.actionCount}>
          {review.commentsCount}
        </Text>
      </View>

      {review.showComments && (
        <View style={styles.commentsSection}>
          {review.comments?.map(comment => (
            <Card key={comment.id} variant="outlined" style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentInitial}>
                    {(comment.user?.displayName || 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.commentInfo}>
                  <Text style={styles.commentAuthor}>
                    {comment.user?.displayName || 'Anonymous'}
                  </Text>
                  <Text style={styles.commentDate}>
                    {comment.createdAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
            </Card>
          ))}

          <View style={styles.addComment}>
            <Input
              placeholder="Add a comment..."
              value={review.newComment || ''}
              onChangeText={(text) =>
                setReviews(prevReviews =>
                  prevReviews.map(r =>
                    r.id === review.id ? { ...r, newComment: text } : r
                  )
                )
              }
              multiline
              leftIcon={<MessageSquareIcon size="md" color="textSecondary" />}
              style={styles.commentInput}
            />
            <Button
              title="Comment"
              onPress={() => handleAddComment(review.id, review.newComment || '')}
              loading={review.isSubmittingComment}
              disabled={!review.newComment?.trim()}
              variant="gradient"
              size="sm"
              style={styles.commentButton}
            />
          </View>
        </View>
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
              <Text style={styles.loadingText}>Loading concert details...</Text>
            </Card>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!concert) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.surfaceVariant]}
          style={styles.gradient}
        >
          <View style={styles.centerContainer}>
            <Card variant="elevated" style={styles.errorCard}>
              <MusicIcon size="xl" color="error" />
              <Text style={styles.errorText}>Concert not found</Text>
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
          {/* Concert Header */}
          <View style={styles.header}>
            <Card variant="elevated" style={styles.concertCard}>
              <LinearGradient
                colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.concertGradient}
              >
                <View style={styles.concertHeader}>
                  <View style={styles.artistSection}>
                    <MusicIcon size="lg" color="primary" />
                    <Text style={styles.artistName}>{artist?.name || 'Unknown Artist'}</Text>
                  </View>

                  <View style={styles.venueSection}>
                    <MapPinIcon size="md" color="secondary" />
                    <Text style={styles.venueName}>{venue?.name || 'Unknown Venue'}</Text>
                  </View>

                  <View style={styles.dateSection}>
                    <CalendarIcon size="md" color="secondary" />
                    <Text style={styles.concertDate}>
                      {concert.date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>

                  <View style={styles.ratingSection}>
                    <Text style={styles.ratingLabel}>Your Rating:</Text>
                    <View style={styles.concertRating}>
                      {renderStars(concert.rating)}
                    </View>
                  </View>

                  {concert.notes && (
                    <View style={styles.notesSection}>
                      <Text style={styles.concertNotes}>{concert.notes}</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </Card>
          </View>

          {/* Review Submission */}
          {user && (
            <View style={styles.reviewSection}>
              <Card variant="elevated" style={styles.reviewSubmissionCard}>
                <View style={styles.sectionHeader}>
                  <MessageSquareIcon size="lg" color="primary" />
                  <Text style={styles.sectionTitle}>Write a Review</Text>
                </View>

                <Input
                  placeholder="Share your thoughts about this concert..."
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  numberOfLines={4}
                  leftIcon={<MessageSquareIcon size="md" color="textSecondary" />}
                  style={styles.reviewInput}
                />

                <Button
                  title="Submit Review"
                  onPress={handleSubmitReview}
                  loading={submittingReview}
                  disabled={!reviewText.trim()}
                  variant="gradient"
                  size="md"
                  fullWidth
                  style={styles.submitButton}
                />
              </Card>
            </View>
          )}

          {/* Reviews List */}
          <View style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
              <StarIcon size="lg" color="secondary" />
              <View style={styles.titleRow}>
                <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
                {usingFallbackQuery && (
                  <Text style={styles.fallbackIndicator}>⏳</Text>
                )}
              </View>
            </View>

            {reviews.length === 0 ? (
              <Card variant="outlined" style={styles.emptyState}>
                <MessageSquareIcon size="xl" color="textSecondary" />
                <Text style={styles.emptyTitle}>No reviews yet</Text>
                <Text style={styles.emptyText}>
                  Be the first to share your thoughts about this concert!
                </Text>
              </Card>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map(renderReview)}
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
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
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
  concertCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  concertGradient: {
    padding: theme.spacing.xl,
  },
  concertHeader: {
    alignItems: 'center',
  },
  artistSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  artistName: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.surface,
    marginLeft: theme.spacing.sm,
  },
  venueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  venueName: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.surface,
    opacity: 0.9,
    marginLeft: theme.spacing.sm,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  concertDate: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.surface,
    opacity: 0.9,
    marginLeft: theme.spacing.sm,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ratingLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.surface,
    opacity: 0.8,
    marginBottom: theme.spacing.xs,
  },
  concertRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesSection: {
    marginTop: theme.spacing.sm,
  },
  concertNotes: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.surface,
    opacity: 0.9,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  reviewSection: {
    marginBottom: theme.spacing.xl,
  },
  reviewSubmissionCard: {
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fallbackIndicator: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  reviewInput: {
    marginBottom: theme.spacing.md,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  reviewsSection: {
    flex: 1,
  },
  reviewsList: {
    gap: theme.spacing.md,
  },
  reviewCard: {
    marginBottom: theme.spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  reviewerInitial: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.surface,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  reviewDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  reviewText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.md,
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing.lg,
  },
  actionButton: {
    paddingVertical: theme.spacing.xs,
  },
  actionCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  actionCountActive: {
    color: theme.colors.primary,
  },
  commentsSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  commentCard: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  commentInitial: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.surface,
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text,
  },
  commentDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  commentText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeight.normal,
  },
  addComment: {
    marginTop: theme.spacing.md,
  },
  commentInput: {
    marginBottom: theme.spacing.sm,
  },
  commentButton: {
    alignSelf: 'flex-start',
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium as any,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed,
  },
});

export default ConcertDetailScreen;
