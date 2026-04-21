import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

/**
 * PageHeader - A consistent header component for all screens
 * 
 * @param {string} title - Header title text
 * @param {function} onBack - Custom back handler (optional, defaults to navigation.goBack)
 * @param {boolean} showBack - Whether to show back button (default: true)
 * @param {React.ReactNode} rightAction - Optional right side action component
 * @param {string} backDestination - Optional specific navigation destination for back button
 */
const PageHeader = ({
    title,
    onBack,
    showBack = true,
    rightAction = null,
    backDestination = null,
}) => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (backDestination) {
            navigation.navigate(backDestination);
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={[styles.header, {
            backgroundColor: theme.colors.primaryDark || theme.colors.primary,
            borderBottomColor: 'rgba(255,255,255,0.12)',
            height: HEADER_HEIGHT + Math.max(insets.top - 12, 1),
            paddingTop: Math.max(insets.top - 12, 1),
        }]}>
            <View style={styles.headerContent}>
                {showBack ? (
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.backButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}

                <View style={styles.headerTextBlock}>
                    <Text
                        style={styles.headerTitle}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                </View>

                {rightAction ? (
                    <View style={styles.rightAction}>
                        {rightAction}
                    </View>
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>
        </View>
    );
};

const HEADER_HEIGHT = 54;

const styles = StyleSheet.create({
    header: {
        borderBottomWidth: 1,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        flex: 1,
    },
    backButton: {
        width: 34,
        height: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    headerTextBlock: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
    },
    placeholder: {
        width: 34,
        height: 34,
    },
    rightAction: {
        minWidth: 34,
        minHeight: 34,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default PageHeader;
