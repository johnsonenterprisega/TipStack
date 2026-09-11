import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Platform, Animated, Easing, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Conditionally import expo-video only for native platforms to avoid web bundling quirks
let useVideoPlayer: any = null;
let VideoView: any = null;
if (Platform.OS !== 'web') {
  try {
    const ExpoVideo = require('expo-video');
    useVideoPlayer = ExpoVideo.useVideoPlayer;
    VideoView = ExpoVideo.VideoView;
  } catch (e) {}
}

interface BackgroundVideoProps {
  source?: any;
  sourceUrl?: string;
  gradientColors: readonly [string, string];
  style?: any;
  children?: React.ReactNode;
}

// Dedicated Web HTML5 Video Component for 100% reliable autoplay on Safari, Chrome, Edge & iOS Web
function WebVideoBackground({ videoSrc }: { videoSrc: string }) {
  const videoRef = useRef<any>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      videoRef.current.playsInline = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented, muted retry
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [videoSrc]);

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      autoPlay
      loop
      muted
      playsInline
      // @ts-ignore
      webkit-playsinline="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: 0.65,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

// Native Video View
function NativeVideoBackground({ videoSrc }: { videoSrc: any }) {
  if (!useVideoPlayer || !VideoView) return null;

  const player = useVideoPlayer(videoSrc, (p: any) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      contentFit="cover"
      nativeControls={false}
      style={[StyleSheet.absoluteFill, { opacity: 0.65, zIndex: 1 }]}
    />
  );
}

export default function BackgroundVideo({
  source,
  sourceUrl,
  gradientColors,
  style,
  children,
}: BackgroundVideoProps) {
  const resolvedUri = source
    ? (typeof source === 'number' ? Image.resolveAssetSource(source)?.uri : source?.uri || source)
    : sourceUrl;
  // Floating ambient particle animations for organic life
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous floating ambient glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 1,
          duration: 5500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 5500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, []);

  const orb1TranslateY = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  const orb2TranslateX = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 35],
  });

  return (
    <View style={[styles.container, style]}>
      {/* 1. Base Gradient Layer */}
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />

      {/* 2. Ambient Floating Glowing Orbs (Dynamic background depth) */}
      <Animated.View
        style={[
          styles.glowOrb1,
          {
            transform: [{ translateY: orb1TranslateY }, { scale: pulseAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrb2,
          {
            transform: [{ translateX: orb2TranslateX }],
          },
        ]}
      />

      {/* 3. Looping Motion Video Layer */}
      {resolvedUri ? (
        Platform.OS === 'web' ? (
          <WebVideoBackground videoSrc={resolvedUri} />
        ) : (
          <NativeVideoBackground videoSrc={resolvedUri} />
        )
      ) : null}

      {/* 4. Cinematic Dark Gradient Tint Overlay (guarantees text contrast & logo pop) */}
      <LinearGradient
        colors={['rgba(13, 15, 20, 0.25)', 'rgba(13, 15, 20, 0.65)', 'rgba(13, 15, 20, 0.92)']}
        locations={[0, 0.5, 1]}
        style={[StyleSheet.absoluteFill, { zIndex: 2 }]}
      />

      {/* 5. Foreground Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  glowOrb1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    zIndex: 1,
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 20,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 201, 167, 0.25)',
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
