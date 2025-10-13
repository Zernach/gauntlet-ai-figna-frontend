import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Providers } from '../components/providers';
import { COLORS } from '../constants/colors';
import { setAuthHeadersProvider } from '@/scripts/requestCloud/requestCloud';
import { setAuthHeaders } from '@/scripts/setAuthHeaders';

// Inject dynamic auth headers for all API requests
setAuthHeadersProvider(setAuthHeaders);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.black,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.background,
    },
});

export default function RootLayout() {
    return (
        <Providers>
            <View style={styles.container}>
                <View style={styles.gradientOverlay} />
                <Slot />
            </View>
        </Providers>
    );
}
