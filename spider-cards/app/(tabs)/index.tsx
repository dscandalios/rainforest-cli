import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { CapturedBanner } from '../../src/components/CapturedBanner';
import { CardReveal } from '../../src/components/CardReveal';
import { FramingOverlay } from '../../src/components/FramingOverlay';
import { ScanningOverlay } from '../../src/components/ScanningOverlay';
import { scanSpider, uploadAndPreparePhoto } from '../../src/lib/api';
import { palette } from '../../src/lib/theme';
import { signedPhotoUrl } from '../../src/lib/supabase';
import type { ScanResponseOk } from '../../src/types';

type Phase =
  | 'idle'
  | 'capturing'
  | 'uploading'
  | 'scanning'
  | 'captured' // brief "Spider Captured!" banner
  | 'reveal'
  | 'rejected';

export default function CaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [reveal, setReveal] = useState<ScanResponseOk['capture'] | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [revealPhotoUrl, setRevealPhotoUrl] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.aetherSilver} />
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.bigText}>Camera permission required</Text>
        <Text style={styles.dim}>
          Spider Cards needs the camera to photograph spiders.
        </Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant access</Text>
        </Pressable>
      </View>
    );
  }

  async function tryGetLocation(): Promise<{
    lat: number | null;
    lng: number | null;
    city: string | null;
  }> {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        const ask = await Location.requestForegroundPermissionsAsync();
        if (ask.status !== 'granted') return { lat: null, lng: null, city: null };
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      let city: string | null = null;
      try {
        const places = await Location.reverseGeocodeAsync(pos.coords);
        city = places[0]?.city ?? places[0]?.subregion ?? null;
      } catch {}
      return { lat: pos.coords.latitude, lng: pos.coords.longitude, city };
    } catch {
      return { lat: null, lng: null, city: null };
    }
  }

  async function onShutter() {
    if (!cameraRef.current || phase !== 'idle') return;
    try {
      setPhase('capturing');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        exif: false,
        skipProcessing: false,
      });
      if (!photo?.uri) throw new Error('camera returned no photo');

      setPhase('uploading');
      const [upload, loc] = await Promise.all([
        uploadAndPreparePhoto(photo.uri),
        tryGetLocation(),
      ]);

      setPhase('scanning');
      const result = await scanSpider({
        photoPath: upload.photoPath,
        photoBase64: upload.photoBase64,
        lat: loc.lat,
        lng: loc.lng,
        city: loc.city,
      });

      if (!result.ok) {
        Alert.alert('Scan failed', result.error);
        setPhase('idle');
        return;
      }
      if (result.rejected || !result.capture) {
        setRejectionReason(
          result.rejected?.reason ?? 'Could not identify a spider.',
        );
        setPhase('rejected');
        return;
      }

      const url = await signedPhotoUrl(result.capture.photo_path);
      setRevealPhotoUrl(url);
      setReveal(result.capture);
      setPhase('captured');

      queryClient.invalidateQueries({ queryKey: ['captures'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    } catch (err) {
      console.error(err);
      Alert.alert('Capture failed', String(err));
      setPhase('idle');
    }
  }

  // ── REVEAL ────────────────────────────────────────────────────────────
  if (phase === 'reveal' && reveal) {
    return (
      <ScrollView
        style={styles.revealScroll}
        contentContainerStyle={styles.revealScrollContent}
      >
        <CardReveal
          capture={{
            hp: reveal.hp,
            damage: reveal.damage,
            tier: reveal.species.tier,
            final_score: reveal.final_score,
            photo_path: reveal.photo_path,
            photoUrl: revealPhotoUrl,
            species: reveal.species,
          }}
        />
        <View style={styles.revealActions}>
          <Pressable
            style={styles.btnSecondary}
            onPress={() => {
              setReveal(null);
              setRevealPhotoUrl(null);
              setPhase('idle');
            }}
          >
            <Text style={styles.btnText}>Capture another</Text>
          </Pressable>
          <Pressable
            style={styles.btn}
            onPress={() => {
              const id = reveal.id;
              setReveal(null);
              setRevealPhotoUrl(null);
              setPhase('idle');
              router.push(`/card/${id}`);
            }}
          >
            <Text style={styles.btnText}>View card</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ── REJECTED ──────────────────────────────────────────────────────────
  if (phase === 'rejected') {
    return (
      <View style={styles.center}>
        <Text style={styles.bigText}>No card created</Text>
        <Text style={styles.dim}>{rejectionReason}</Text>
        <Pressable
          style={styles.btn}
          onPress={() => {
            setRejectionReason(null);
            setPhase('idle');
          }}
        >
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  // ── CAMERA + OVERLAYS ────────────────────────────────────────────────
  const scanning =
    phase === 'capturing' || phase === 'uploading' || phase === 'scanning';

  return (
    <View style={{ flex: 1, backgroundColor: palette.voidBlack }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
      {!scanning && phase !== 'captured' && <FramingOverlay />}

      {scanning && <ScanningOverlay phase={phase as 'capturing' | 'uploading' | 'scanning'} />}

      {phase === 'captured' && reveal && (
        <CapturedBanner
          tier={reveal.species.tier}
          onDone={() => setPhase('reveal')}
        />
      )}

      {!scanning && phase !== 'captured' && (
        <View style={styles.bottom}>
          <Pressable
            onPress={onShutter}
            style={({ pressed }) => [
              styles.shutter,
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: palette.voidBlack,
    gap: 12,
  },
  bigText: {
    color: palette.bone,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Georgia',
  },
  dim: { color: palette.smoke, textAlign: 'center' },
  btn: {
    backgroundColor: palette.arcane,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    marginTop: 8,
  },
  btnSecondary: {
    backgroundColor: palette.ash,
    borderColor: palette.fog,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    marginTop: 8,
  },
  btnText: { color: palette.bone, fontWeight: '700', letterSpacing: 0.5 },
  bottom: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  revealScroll: {
    flex: 1,
    backgroundColor: palette.voidBlack,
  },
  revealScrollContent: {
    paddingBottom: 24,
  },
  revealActions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
});
