import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../api/client';
import { useAuth } from '../api/auth';
import { colors, radius, spacing } from '../theme';

const PROVINCES = [
  '서울특별시', '인천광역시', '경기도', '강원특별자치도',
  '충청북도', '충청남도', '대전광역시', '세종특별자치시',
  '전북특별자치도', '전라남도', '광주광역시',
  '경상북도', '대구광역시', '경상남도', '부산광역시', '울산광역시',
  '제주특별자치도',
];

export default function VerifyIdScreen({ navigation }) {
  const { refreshUser } = useAuth();
  const [step, setStep]           = useState(0);
  const [photoUri, setPhotoUri]   = useState(null);
  const [selected, setSelected]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('카메라 권한 필요', '민증 촬영을 위해 카메라 권한을 허용해 주세요');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [8.56, 5.4],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
      goAnalyze();
    }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [8.56, 5.4],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
      goAnalyze();
    }
  };

  const goAnalyze = () => {
    setStep(1);
    setTimeout(() => setStep(2), 2200);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.verifyRegion(selected);
      await refreshUser();
      setStep(3);
    } catch (e) {
      Alert.alert('인증 실패', e.message || '다시 시도해 주세요');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 0: 민증 촬영 안내 ──────────────────────────────────────────────
  if (step === 0) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={20}>
            <Text style={s.back}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>지역 인증</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={s.body}>
          <View style={s.idIllustration}>
            <Text style={s.idEmoji}>🪪</Text>
          </View>

          <Text style={s.stepTitle}>주민등록증으로{'\n'}동네를 인증해요</Text>
          <Text style={s.stepDesc}>
            주민등록증의 주소지를 확인해{'\n'}
            현지인 인증을 완료합니다.{'\n'}
            인증된 지역에서만 코스를 등록할 수 있어요.
          </Text>

          <View style={s.guideBox}>
            <Text style={s.guideTitle}>촬영 가이드</Text>
            {[
              '민증 전체가 프레임 안에 들어오도록',
              '빛 반사 없이 선명하게',
              '주소 글자가 잘 보이도록',
            ].map((g, i) => (
              <View key={i} style={s.guideRow}>
                <Text style={s.guideDot}>•</Text>
                <Text style={s.guideText}>{g}</Text>
              </View>
            ))}
          </View>

          <View style={s.privacyBox}>
            <Text style={s.privacyText}>
              🔒 촬영된 이미지는 지역 확인 후 즉시 삭제되며, 서버에 저장되지 않습니다.
            </Text>
          </View>
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity style={s.btnPrimary} onPress={takePhoto}>
            <Text style={s.btnPrimaryText}>📷 카메라로 촬영</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={pickFromLibrary}>
            <Text style={s.btnSecondaryText}>갤러리에서 선택</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 1: 분석 중 ────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <View style={{ width: 32 }} />
          <Text style={s.headerTitle}>지역 인증</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={s.centerBox}>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={s.photoPreview} resizeMode="cover" />
          )}
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
          <Text style={s.analyzingTitle}>민증 분석 중...</Text>
          <Text style={s.analyzingDesc}>주소지를 확인하고 있어요</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 2: 지역 선택 (OCR 결과 확인) ───────────────────────────────────
  if (step === 2) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setStep(0)} hitSlop={20}>
            <Text style={s.back}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>지역 확인</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.stepTitle}>거주 지역을{'\n'}선택해 주세요</Text>
          <Text style={s.stepDesc}>민증의 주소지와 동일한 도/광역시를 선택해 주세요</Text>

          <View style={s.provinceGrid}>
            {PROVINCES.map(p => (
              <TouchableOpacity
                key={p}
                style={[s.provinceChip, selected === p && s.provinceChipActive]}
                onPress={() => setSelected(p)}
              >
                <Text style={[s.provinceChipText, selected === p && s.provinceChipTextActive]}>
                  {p.replace('특별자치도', '').replace('특별자치시', '').replace('광역시', '').replace('특별시', '')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity
            style={[s.btnPrimary, !selected && { opacity: 0.4 }]}
            onPress={handleSubmit}
            disabled={!selected || submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnPrimaryText}>인증 완료</Text>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 3: 완료 ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.centerBox}>
        <View style={s.successCircle}>
          <Text style={s.successEmoji}>✓</Text>
        </View>
        <Text style={s.successTitle}>인증 완료!</Text>
        <Text style={s.successDesc}>{selected} 현지인으로 인증됐어요.{'\n'}이제 이 지역의 코스를 등록할 수 있어요.</Text>
        <TouchableOpacity style={[s.btnPrimary, { marginTop: 32, width: 200 }]} onPress={() => { setStep(0); navigation.goBack(); }}>
          <Text style={s.btnPrimaryText}>확인</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#1A1A1E' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: spacing.xl, paddingVertical: 12,
                  borderBottomWidth: 1, borderBottomColor: '#3A3A3E', backgroundColor: '#1A1A1E' },
  back:         { fontSize: 26, color: '#0A84FF', width: 32, lineHeight: 32 },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: '#F2F2F7' },
  body:         { padding: spacing.xl, paddingBottom: 40, gap: 20 },

  idIllustration: { width: 120, height: 80, backgroundColor: '#242428', borderRadius: 12,
                    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
                    borderWidth: 1.5, borderColor: '#3A3A3E', marginBottom: 8 },
  idEmoji:      { fontSize: 40 },

  stepTitle:    { fontSize: 24, fontWeight: '800', color: '#F2F2F7', lineHeight: 34 },
  stepDesc:     { fontSize: 14, color: '#8A7868', lineHeight: 22 },

  guideBox:     { backgroundColor: '#242428', borderRadius: radius.md, padding: 16, gap: 8 },
  guideTitle:   { fontSize: 13, fontWeight: '700', color: '#0A84FF', marginBottom: 4 },
  guideRow:     { flexDirection: 'row', gap: 8 },
  guideDot:     { fontSize: 13, color: '#8C7A68' },
  guideText:    { fontSize: 13, color: '#8E8E93', flex: 1 },

  privacyBox:   { backgroundColor: '#EEF4FF', borderRadius: radius.md, padding: 14 },
  privacyText:  { fontSize: 12, color: '#5A6A8A', lineHeight: 18 },

  centerBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  photoPreview: { width: 240, height: 150, borderRadius: 12 },
  analyzingTitle:{ fontSize: 18, fontWeight: '700', color: '#F2F2F7', marginTop: 16 },
  analyzingDesc:{ fontSize: 13, color: '#8E8E93', marginTop: 6 },

  provinceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  provinceChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                  backgroundColor: '#242428', borderWidth: 1, borderColor: '#3A3A3E' },
  provinceChipActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  provinceChipText:      { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  provinceChipTextActive:{ color: '#fff', fontWeight: '700' },

  successCircle:{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#0A84FF',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successEmoji: { fontSize: 36, color: '#fff' },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#F2F2F7', marginBottom: 10 },
  successDesc:  { fontSize: 14, color: '#8A7868', textAlign: 'center', lineHeight: 22 },

  footer:       { padding: spacing.lg, gap: 10, backgroundColor: '#1A1A1E',
                  borderTopWidth: 1, borderTopColor: '#3A3A3E' },
  btnPrimary:   { backgroundColor: colors.primary, borderRadius: radius.lg,
                  paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText:  { fontSize: 16, fontWeight: '700', color: '#fff' },
  btnSecondary:    { backgroundColor: '#242428', borderRadius: radius.lg,
                     paddingVertical: 14, alignItems: 'center',
                     borderWidth: 1, borderColor: '#3A3A3E' },
  btnSecondaryText:{ fontSize: 15, fontWeight: '600', color: '#8E8E93' },
});
