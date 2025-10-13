import { useCallback, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import type { Point } from '@/types/canvas';

interface UseGesturesOptions {
    onPan?: (delta: Point) => void;
    onPinch?: (scale: number, focal: Point) => void;
    onTap?: (position: Point) => void;
    onDoubleTap?: (position: Point) => void;
    onLongPress?: (position: Point) => void;
}

export const useGestures = (options: UseGesturesOptions) => {
    const lastPanPosition = useRef<Point>({ x: 0, y: 0 });
    const initialScale = useRef(1);
    const lastScale = useRef(1);

    const panGesture = Gesture.Pan()
        .onStart((event) => {
            lastPanPosition.current = {
                x: event.translationX,
                y: event.translationY,
            };
        })
        .onUpdate((event) => {
            if (options.onPan) {
                const delta = {
                    x: event.translationX - lastPanPosition.current.x,
                    y: event.translationY - lastPanPosition.current.y,
                };
                lastPanPosition.current = {
                    x: event.translationX,
                    y: event.translationY,
                };
                options.onPan(delta);
            }
        })
        .onEnd(() => {
            lastPanPosition.current = { x: 0, y: 0 };
        });

    const pinchGesture = Gesture.Pinch()
        .onStart((event) => {
            initialScale.current = lastScale.current;
        })
        .onUpdate((event) => {
            if (options.onPinch) {
                const newScale = initialScale.current * event.scale;
                lastScale.current = newScale;
                options.onPinch(newScale, {
                    x: event.focalX,
                    y: event.focalY,
                });
            }
        });

    const tapGesture = Gesture.Tap()
        .numberOfTaps(1)
        .onEnd((event) => {
            if (options.onTap) {
                options.onTap({ x: event.x, y: event.y });
            }
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((event) => {
            if (options.onDoubleTap) {
                options.onDoubleTap({ x: event.x, y: event.y });
            }
        });

    const longPressGesture = Gesture.LongPress()
        .minDuration(500)
        .onEnd((event) => {
            if (options.onLongPress) {
                options.onLongPress({ x: event.x, y: event.y });
            }
        });

    const composedGesture = Gesture.Race(
        doubleTapGesture,
        Gesture.Simultaneous(panGesture, pinchGesture),
        longPressGesture,
        tapGesture,
    );

    return {
        panGesture,
        pinchGesture,
        tapGesture,
        doubleTapGesture,
        longPressGesture,
        composedGesture,
    };
};

