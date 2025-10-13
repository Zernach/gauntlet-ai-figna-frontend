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
    const [canvasId] = useState(() => generateRandomUuid());

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
