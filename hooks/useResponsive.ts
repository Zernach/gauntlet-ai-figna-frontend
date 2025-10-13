import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export const useResponsive = () => {
    const [dimensions, setDimensions] = useState(() => {
        const { width, height } = Dimensions.get('window');
        return { width, height };
    });

    useEffect(() => {
        const onChange = ({ window }: { window: ScaledSize }) => {
            setDimensions({ width: window.width, height: window.height });
        };

        const subscription = Dimensions.addEventListener('change', onChange);

        return () => {
            subscription?.remove();
        };
    }, []);

    return {
        width: dimensions.width,
        height: dimensions.height,
        isSmallScreen: dimensions.width < 768,
        isMediumScreen: dimensions.width >= 768 && dimensions.width < 1024,
        isLargeScreen: dimensions.width >= 1024,
    };
};

