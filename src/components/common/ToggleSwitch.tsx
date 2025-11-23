import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

interface ToggleSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    activeColor?: string;
    inactiveColor?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    value,
    onValueChange,
    activeColor = '#2ECC71',
    inactiveColor = '#E9ECEF'
}) => {
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 22],
    });

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [inactiveColor, activeColor],
    });

    return (
        <Pressable onPress={() => onValueChange(!value)}>
            <Animated.View style={[styles.container, { backgroundColor }]}>
                <Animated.View style={[styles.circle, { transform: [{ translateX }] }]} />
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 44,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
    },
    circle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
});

export default ToggleSwitch;
