import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AboutUsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsMain')} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>About Us</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>About Us</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            AsaanCar is honored to be a two-time recipient of the "Pakistan Consumer Choice Award," recognized for redefining car rental across the country.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Who We Are</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Gone are the days of stressful car rental — endless searching, unpredictable prices, and questionable quality. AsaanCar is Pakistan's first on-demand car rental platform, designed to make your journey smooth, reliable, and hassle-free.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>What We Offer</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            With AsaanCar, booking a car is just a few clicks away. Whether you need a ride for a business meeting, a family trip, a wedding, or simply to get around town, we have you covered. Our services are tailored for:
          </Text>
          <View style={styles.listContainer}>
            <View style={styles.listItem}>
              <Icon name="check-circle" size={20} color={theme.colors.primary} style={styles.listIcon} />
              <Text style={[styles.listText, { color: theme.colors.textSecondary }]}>
                Corporate teams & office staff
              </Text>
            </View>
            <View style={styles.listItem}>
              <Icon name="check-circle" size={20} color={theme.colors.primary} style={styles.listIcon} />
              <Text style={[styles.listText, { color: theme.colors.textSecondary }]}>
                Travelers and tourists
              </Text>
            </View>
            <View style={styles.listItem}>
              <Icon name="check-circle" size={20} color={theme.colors.primary} style={styles.listIcon} />
              <Text style={[styles.listText, { color: theme.colors.textSecondary }]}>
                Special occasions & events
              </Text>
            </View>
            <View style={styles.listItem}>
              <Icon name="check-circle" size={20} color={theme.colors.primary} style={styles.listIcon} />
              <Text style={[styles.listText, { color: theme.colors.textSecondary }]}>
                Families and individuals
              </Text>
            </View>
          </View>
          <Text style={[styles.description, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            Choose from a wide selection of the latest, well-maintained vehicles — available with a professional chauffeur or for self-drive. Our flexible options ensure you get exactly what you need, when you need it.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Our Mission</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Car rental, made simple. AsaanCar was founded with a single goal: to put you, the customer, at the heart of everything we do. We set out to transform the car rental experience into something modern, transparent, and truly customer-centric.
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            Every vehicle and driver on our platform is carefully vetted through our "AsaanCar Quality Check" — so you can book with confidence, knowing your safety and comfort are our top priorities.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Our Vision</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            What started as a bold idea to revolutionize car rentals in Pakistan has grown into a movement to set new standards for the entire industry. AsaanCar leverages technology to make car rentals accessible, affordable, and enjoyable for everyone.
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            We're passionate about driving progress — not just for our customers, but for the next generation of entrepreneurs and innovators in Pakistan.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  listContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  listText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
});

export default AboutUsScreen;

