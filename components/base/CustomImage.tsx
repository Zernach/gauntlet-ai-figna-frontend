import React from 'react';
import {
    Image,
    ImageBackground,
    ImageBackgroundProps,
    ImageProps
} from 'react-native';

type WithImageProps = {
    mode?: 'image';
    imageProps: ImageProps;
    backgroundProps?: never;
};

type WithBackgroundProps = {
    mode: 'background';
    imageProps?: never;
    backgroundProps: ImageBackgroundProps;
};

export type CustomImageProps = WithImageProps | WithBackgroundProps;

export const CustomImage: React.FC<CustomImageProps> = (props) => {
    if (props.mode === 'background' && props.backgroundProps) {
        return <ImageBackground {...props.backgroundProps} />;
    }

    if (props.imageProps) {
        return <Image {...props.imageProps} />;
    }

    return null;
};

CustomImage.displayName = 'CustomImage';

