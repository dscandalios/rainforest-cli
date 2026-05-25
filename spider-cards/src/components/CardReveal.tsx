import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SpiderCard } from './SpiderCard';

type CardProps = React.ComponentProps<typeof SpiderCard>;

export function CardReveal(props: CardProps) {
  const rotate = useSharedValue(180);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    rotate.value = withSequence(
      withTiming(180, { duration: 0 }),
      withDelay(
        100,
        withTiming(0, {
          duration: 700,
          easing: Easing.out(Easing.cubic),
        }),
      ),
    );
    scale.value = withSequence(
      withTiming(0.9, { duration: 0 }),
      withDelay(
        100,
        withTiming(1, {
          duration: 700,
          easing: Easing.out(Easing.cubic),
        }),
      ),
    );
  }, [opacity, rotate, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={animStyle}>
        <SpiderCard {...props} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 12 },
});
