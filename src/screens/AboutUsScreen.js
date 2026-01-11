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
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/PageHeader';

const AboutUsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundTertiary }]}>
      <PageHeader title={t('aboutUs.title')} backDestination="SettingsMain" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('aboutUs.title')}</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {t('aboutUs.intro')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('aboutUs.whoWeAre')}</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {t('aboutUs.whoWeAreDesc')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('aboutUs.whatWeOffer')}</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {t('aboutUs.whatWeOfferDesc')}
          </Text>
          <View style={styles.listContainer}>
            <View style={styles.listItem}>
              <Icon name="check-circle" size={20} color={theme.colors.primary} style={styles.listIcon} />
              <Text style={[styles.listText, { color: theme.colors.textSecondary }]}>
                {t('aboutUs.corporateTeams')}
              </Text>
            </View>
            <View style={styles.listItem}>
              <Icon name="check-circle" size={20} color={theme.colors.primary} style={styles.listIcon} />
              <Text style={[styles.listText, { color: theme.colors.textSecondary }]}>
                {t('aboutUs.travelers')}
              </Text>
            </View>
            <View style={styles.listItem}>
              <Icon name="check-circle" size={20} color={theme.colors.primary} style={styles.listIcon} />
              <Text style={[styles.listText, { color: theme.colors.textSecondary }]}>
                {t('aboutUs.specialOccasions')}
              </Text>
            </View>
            <View style={styles.listItem}>
              <Icon name="check-circle" size={20} color={theme.colors.primary} style={styles.listIcon} />
              <Text style={[styles.listText, { color: theme.colors.textSecondary }]}>
                {t('aboutUs.families')}
              </Text>
            </View>
          </View>
          <Text style={[styles.description, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            {t('aboutUs.vehicleSelection')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('aboutUs.ourMission')}</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {t('aboutUs.ourMissionDesc1')}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            {t('aboutUs.ourMissionDesc2')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('aboutUs.ourVision')}</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {t('aboutUs.ourVisionDesc1')}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            {t('aboutUs.ourVisionDesc2')}
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

