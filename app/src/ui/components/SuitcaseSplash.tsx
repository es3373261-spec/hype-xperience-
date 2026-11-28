import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { splashTokens } from '../../theme/tokens';

export interface SuitcaseSplashProps {
  variant: 'first_load' | 'mode_switch';
  onFinish?: () => void;
}

/**
 * Splash Screen (spec.md §4, design-system.md §2b):
 * - Pure black #000000 background
 * - Red 3D suitcase (#E62E3D) rotating smoothly
 * - 8000ms on first load, 900ms on Explorador <-> Aliado mode switch
 * - ZERO progress bar, ZERO text
 */
export const SuitcaseSplash: React.FC<SuitcaseSplashProps> = ({ variant, onFinish }) => {
  const durationMs =
    variant === 'first_load'
      ? splashTokens.firstLoadDurationMs
      : splashTokens.modeSwitchDurationMs;

  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(spinAnim, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });
    animation.start(() => {
      onFinish?.();
    });
    return () => animation.stop();
  }, [durationMs, onFinish, spinAnim]);

  const rotateY = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.suitcaseBody, { transform: [{ rotateY }] }]}>
        <View style={styles.suitcaseHandle} />
        <View style={styles.suitcaseShell}>
          <View style={styles.ribLine} />
          <View style={styles.ribLine} />
          <View style={styles.ribLine} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: splashTokens.backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suitcaseBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  suitcaseHandle: {
    width: 34,
    height: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 4,
    borderBottomWidth: 0,
    borderColor: '#FFFFFF',
    marginBottom: -2,
  },
  suitcaseShell: {
    width: 84,
    height: 112,
    borderRadius: 16,
    backgroundColor: splashTokens.suitcaseColor,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 14,
  },
  ribLine: {
    width: 58,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
});
