import { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppSelector } from '@/lib/redux/hooks';
import { REDUX_SLICES } from '@/types/types';
import { LoginScreen } from '@/screens/LoginScreen';
import { CanvasScreen } from '@/screens/CanvasScreen';
import { generateRandomUuid } from '@/scripts/generateRandomUuid';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
});

export default function HomePage() {
    const currentUser = useAppSelector(
        (state) => state[REDUX_SLICES.USER]?.currentUser,
    );
    // Use the demo canvas ID that exists in the database
    const [canvasId] = useState(() => '00000000-0000-0000-0000-000000000002');

    const isAuthenticated = useMemo(() => {
        return currentUser !== null;
    }, [currentUser]);

    return (
        <View style={styles.container}>
            {!isAuthenticated ? (
                <LoginScreen />
            ) : (
                <CanvasScreen canvasId={canvasId} />
            )}
        </View>
    );
}
