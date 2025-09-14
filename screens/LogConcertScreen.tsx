import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import { logConcert } from '../services/concertService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Button, Input, Card, MusicIcon, MapPinIcon, CalendarIcon, StarIcon, MessageSquareIcon } from '../components/ui';
import { theme } from '../types/theme';

type LogConcertScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const StarRating: React.FC<{
  rating: number;
  onRatingChange: (rating: number) => void;
}> = ({ rating, onRatingChange }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.starContainer}>
      {stars.map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRatingChange(star)}
          style={styles.starButton}
        >
          <StarIcon
            size="xl"
            color={rating >= star ? 'warning' : 'textTertiary'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const LogConcertScreen: React.FC = () => {
  const navigation = useNavigation<LogConcertScreenNavigationProp>();
  const { user } = useContext(AuthContext);
  const [artistName, setArtistName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [artistError, setArtistError] = useState('');
  const [venueError, setVenueError] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [dateError, setDateError] = useState('');

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    setDateError('');
  };

  const validateForm = () => {
    let isValid = true;

    if (!artistName.trim()) {
      setArtistError('Artist name is required');
      isValid = false;
    } else {
      setArtistError('');
    }

    if (!venueName.trim()) {
      setVenueError('Venue name is required');
      isValid = false;
    } else {
      setVenueError('');
    }

    if (rating === 0) {
      setRatingError('Please select a rating');
      isValid = false;
    } else {
      setRatingError('');
    }

    if (date > new Date()) {
      setDateError('Concert date cannot be in the future');
      isValid = false;
    } else {
      setDateError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to log a concert');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await logConcert(user.uid, artistName.trim(), venueName.trim(), date, rating, notes.trim());
      Alert.alert(
        '🎉 Success!',
        'Your concert memory has been saved!',
        [
          {
            text: 'View My Profile',
            onPress: () => navigation.navigate('UserProfile', { userId: user?.uid }),
          },
          {
            text: 'Log Another',
            style: 'default',
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Failed to Log Concert', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

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
            <View style={styles.titleContainer}>
              <MusicIcon size="lg" color="primary" />
              <Text style={styles.title}>Log a Concert</Text>
              <Text style={styles.subtitle}>Capture your live music experience</Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <Card variant="elevated" style={styles.formCard}>
              <Input
                label="Artist Name"
                placeholder="Who did you see perform?"
                value={artistName}
                onChangeText={(text) => {
                  setArtistName(text);
                  setArtistError('');
                }}
                error={artistError}
                leftIcon={<MusicIcon size="md" color="textSecondary" />}
                autoCapitalize="words"
              />

              <Input
                label="Venue Name"
                placeholder="Where was the concert?"
                value={venueName}
                onChangeText={(text) => {
                  setVenueName(text);
                  setVenueError('');
                }}
                error={venueError}
                leftIcon={<MapPinIcon size="md" color="textSecondary" />}
                autoCapitalize="words"
              />

              <Text style={styles.sectionTitle}>When was the concert?</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <CalendarIcon size="md" color="primary" />
                <Text style={styles.dateButtonText}>
                  {date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
              {dateError ? <Text style={styles.dateError}>{dateError}</Text> : null}

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}

              <Text style={styles.sectionTitle}>How would you rate it?</Text>
              <View style={styles.ratingContainer}>
                <StarRating rating={rating} onRatingChange={(newRating) => {
                  setRating(newRating);
                  setRatingError('');
                }} />
                {rating > 0 && (
                  <Text style={styles.ratingText}>
                    {rating} out of 5 stars
                  </Text>
                )}
                {ratingError ? <Text style={styles.ratingError}>{ratingError}</Text> : null}
              </View>

              <Input
                label="Personal Notes"
                placeholder="Share your thoughts, memories, or highlights from the concert..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                leftIcon={<MessageSquareIcon size="md" color="textSecondary" />}
                style={styles.notesInput}
              />

              <Button
                title="Save Concert Memory"
                onPress={handleSubmit}
                loading={loading}
                variant="gradient"
                size="lg"
                fullWidth
                style={styles.submitButton}
              />
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
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  titleContainer: {
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
  form: {
    flex: 1,
  },
  formCard: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    marginBottom: theme.spacing.xs,
  },
  dateButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  dateError: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  ratingContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  starButton: {
    padding: theme.spacing.xs,
  },
  ratingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  ratingError: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  notesInput: {
    marginBottom: theme.spacing.md,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
});

export default LogConcertScreen;
