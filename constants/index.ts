import { Platform } from 'react-native';

export const isAndroid = Platform.OS === 'android';
export const isIos = Platform.OS === 'ios';
export const isWeb = Platform.OS === 'web';

export * from './colors';
export * from './config';
export * from './typography';
export * from './websocket';
