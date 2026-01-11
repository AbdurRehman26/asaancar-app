import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, changeLanguage } from '@/i18n';

const LanguageSelector = () => {
    const { theme } = useTheme();
    const { t, i18n } = useTranslation();
    const [modalVisible, setModalVisible] = useState(false);

    const currentLanguage = LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

    const handleLanguageChange = async (languageCode) => {
        await changeLanguage(languageCode);
        setModalVisible(false);
    };

    return (
        <>
            <TouchableOpacity
                style={[
                    styles.languageButton,
                    { borderTopWidth: 1, borderTopColor: theme.colors.border },
                ]}
                onPress={() => setModalVisible(true)}
            >
                <View style={styles.menuListLeft}>
                    <View style={[styles.smallIconBox, { backgroundColor: theme.colors.backgroundTertiary }]}>
                        <Icon name="language" size={20} color={theme.colors.text} />
                    </View>
                    <Text style={[styles.menuListText, { color: theme.colors.text }]}>
                        {t('settings.language')}
                    </Text>
                </View>
                <View style={styles.languageValue}>
                    <Text style={[styles.languageValueText, { color: theme.colors.textSecondary }]}>
                        {currentLanguage.nativeLabel}
                    </Text>
                    <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                </View>
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
                                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                                    {t('language.selectLanguage')}
                                </Text>

                                {LANGUAGES.map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[
                                            styles.languageOption,
                                            { borderBottomColor: theme.colors.border },
                                            i18n.language === lang.code && { backgroundColor: theme.colors.primary + '15' },
                                        ]}
                                        onPress={() => handleLanguageChange(lang.code)}
                                    >
                                        <View style={styles.languageOptionContent}>
                                            <Text style={[styles.languageLabel, { color: theme.colors.text }]}>
                                                {lang.nativeLabel}
                                            </Text>
                                            <Text style={[styles.languageLabelSecondary, { color: theme.colors.textSecondary }]}>
                                                {lang.label}
                                            </Text>
                                        </View>
                                        {i18n.language === lang.code && (
                                            <Icon name="check" size={24} color={theme.colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}

                                <TouchableOpacity
                                    style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                                        {t('common.cancel')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuListLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    smallIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuListText: {
        fontSize: 15,
        fontWeight: '500',
    },
    languageValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    languageValueText: {
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderRadius: 12,
        marginBottom: 8,
    },
    languageOptionContent: {
        flex: 1,
    },
    languageLabel: {
        fontSize: 17,
        fontWeight: '600',
    },
    languageLabelSecondary: {
        fontSize: 13,
        marginTop: 2,
    },
    cancelButton: {
        marginTop: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LanguageSelector;
