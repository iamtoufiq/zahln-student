import type { ReactNode } from "react";
import { useEffect } from "react";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const SPRING = { damping: 12, stiffness: 180, reduceMotion: ReduceMotion.System };

// Pops the result badge in once; with reduce motion on it simply appears.
export function SuccessPop({ children, play }: { children: ReactNode; play: boolean }) {
  const scale = useSharedValue(play ? 0.4 : 1);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  useEffect(() => {
    if (!play) return;
    requestAnimationFrame(() => scale.set(withSpring(1, SPRING)));
  }, [play, scale]);

  return <Animated.View style={style}>{children}</Animated.View>;
}
