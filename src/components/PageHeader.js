import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
            backgroundColor: theme.colors.cardBackground,
            borderBottomColor: theme.colors.border,
        }]}>
            <View style={styles.headerContent}>
                {showBack ? (
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.backButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Icon name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}

                <Text
                    style={[styles.headerTitle, { color: theme.colors.text }]}
                    numberOfLines={1}
                >
                    {title}
                </Text>

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

const HEADER_HEIGHT = 56;

const styles = StyleSheet.create({
    header: {
        height: HEADER_HEIGHT,
        borderBottomWidth: 1,
        justifyContent: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: '100%',
    },
    backButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    placeholder: {
        width: 32,
        height: 32,
    },
    rightAction: {
        minWidth: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default PageHeader;
