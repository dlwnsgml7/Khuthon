import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { PROVINCES, CITIES_BY_PROVINCE } from '../assets/regions';
import { api } from '../api/client';
import { useAuth } from '../api/auth';
import { colors, radius, spacing } from '../theme';

const ALL_TAGS = [
  '#연인과 함께', '#혼자', '#가족과 함께', '#액티비티',
  '#휴양', '#맛집', '#야경', '#차 있음', '#차 없음',
];

export default function CourseRegisterScreen({ navigation }) {
  const { user } = useAuth();
  const verified = user?.verified_region || null;

  const [step, setStep]           = useState(0);
  const [city, setCity]           = useState('');
  const [title, setTitle]         = useState('');
  const [desc, setDesc]           = useState('');
  const [price, setPrice]         = useState('1000');
  const [tags, setTags]           = useState([]);
  const [places, setPlaces]       = useState([{ name: '', desc: '' }]);
  const [imageUri, setImageUri]   = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 인증되지 않은 사용자가 탭을 누를 때마다 팝업
  useFocusEffect(
    React.useCallback(() => {
      if (!user?.verified_region) {
        Alert.alert(
          '지역 인증이 필요합니다',
          '코스를 등록하려면 먼저 지역 인증을 완료해주세요.',
          [
            { text: '나중에', style: 'cancel' },
            {
              text: '인증하러 가기',
              onPress: () => navigation.navigate('프로필', { screen: 'VerifyId' }),
            },
          ],
        );
      }
    }, [user?.verified_region])
  );

  const province = verified || '';
  const cities = CITIES_BY_PROVINCE[province] || [];

  // 인증 없으면 빈 화면
  if (!verified) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <Text style={s.headerTitle}>코스 등록</Text>
        </View>
        <View style={s.gateBox}>
          <Text style={s.gateEmoji}>🔒</Text>
          <Text style={s.gateTitle}>지역 인증이 필요해요</Text>
          <Text style={s.gateDesc}>
            현지인 인증을 완료하면{'\n'}내 지역 코스를 등록할 수 있어요
          </Text>
          <TouchableOpacity
            style={s.gateBtn}
            onPress={() => navigation.navigate('프로필', { screen: 'VerifyId' })}
          >
            <Text style={s.gateBtnText}>지역 인증하러 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const STEP_LABELS = ['시/군/구', '기본 정보', '코스 장소'];

  const toggleTag = (tag) =>
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const addPlace = () => setPlaces(prev => [...prev, { name: '', desc: '' }]);
  const removePlace = (i) => setPlaces(prev => prev.filter((_, idx) => idx !== i));
  const updatePlace = (i, field, val) =>
    setPlaces(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const removeImage = () => { setImageUri(null); setImageBase64(null); };

  const canNext = () => {
    if (step === 0) return !!city;
    if (step === 1) return title.trim() && price;
    return places.some(p => p.name.trim());
  };

  const handleNext = () => {
    if (step < 2) { setStep(s => s + 1); return; }
    handleSubmit();
  };

  const reset = () => {
    setStep(0); setCity(''); setTitle('');
    setDesc(''); setPrice('1000'); setTags([]);
    setPlaces([{ name: '', desc: '' }]);
    setImageUri(null); setImageBase64(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.createCourse({
        province, city, title: title.trim(),
        description: desc.trim(),
        price: parseInt(price) || 1000,
        tags,
        places: places.filter(p => p.name.trim()),
        image_url: imageBase64 || null,
      });
      Alert.alert('등록 완료!', '코스가 등록됐어요 🎉', [
        { text: '확인', onPress: reset },
      ]);
    } catch (e) {
      Alert.alert('오류', e.message || '등록에 실패했어요');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* 헤더 */}
      <View style={s.header}>
        <Text style={s.headerTitle}>코스 등록</Text>
      </View>

      {/* 인증 도 배지 */}
      <View style={s.verifiedBar}>
        <View style={s.verifiedChip}>
          <Text style={s.verifiedChipText}>📍 {province}</Text>
        </View>
        <Text style={s.verifiedNote}>인증된 지역에서만 등록 가능해요</Text>
      </View>

      {/* 스텝 인디케이터 */}
      <View style={s.stepRow}>
        {STEP_LABELS.map((label, i) => (
          <View key={i} style={s.stepItem}>
            <View style={[s.stepDot, i <= step && s.stepDotActive]}>
              <Text style={[s.stepNum, i <= step && s.stepNumActive]}>{i + 1}</Text>
            </View>
            <Text style={[s.stepLabel, i <= step && s.stepLabelActive]}>{label}</Text>
            {i < 2 && <View style={[s.stepLine, i < step && s.stepLineActive]} />}
          </View>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">

          {/* ── Step 0: 시/군/구 선택 ── */}
          {step === 0 && (
            <View>
              <Text style={s.sectionTitle}>어느 시/군/구의 코스인가요?</Text>
              <View style={s.cityGrid}>
                {cities.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[s.cityChip, city === c && s.chipActive]}
                    onPress={() => setCity(c)}
                  >
                    <Text style={[s.chipText, city === c && s.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Step 1: 기본 정보 ── */}
          {step === 1 && (
            <View>
              <Text style={s.sectionTitle}>{province} {city}의 코스를 소개해 주세요</Text>

              <Text style={s.label}>대표 사진</Text>
              {imageUri ? (
                <View style={s.imagePreviewWrap}>
                  <Image source={{ uri: imageUri }} style={s.imagePreview} resizeMode="cover" />
                  <TouchableOpacity style={s.imageRemoveBtn} onPress={removeImage}>
                    <Text style={s.imageRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.imagePickerBtn} onPress={pickImage}>
                  <Text style={s.imagePickerIcon}>📷</Text>
                  <Text style={s.imagePickerText}>사진 추가하기</Text>
                </TouchableOpacity>
              )}
              <Text style={s.imageHint}>
                📸 사진을 추가하면 구매 확률이 높아져요! 추가하지 않으면 자동으로 사진이 채워져요.
              </Text>

              <Text style={[s.label, { marginTop: spacing.lg }]}>코스 제목 *</Text>
              <TextInput
                style={s.input}
                placeholder="예) 강릉 감성 당일치기 코스"
                value={title}
                onChangeText={setTitle}
                maxLength={40}
              />

              <Text style={s.label}>소개 글</Text>
              <TextInput
                style={[s.input, s.textArea]}
                placeholder="이 코스만의 매력, 현지인만 아는 포인트를 알려주세요"
                value={desc}
                onChangeText={setDesc}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={s.label}>가격 (원)</Text>
              <TextInput
                style={s.input}
                placeholder="1000"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />

              <Text style={s.label}>태그 (복수 선택 가능)</Text>
              <View style={s.tagGrid}>
                {ALL_TAGS.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[s.chip, tags.includes(tag) && s.chipActive]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[s.chipText, tags.includes(tag) && s.chipTextActive]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Step 2: 코스 장소 ── */}
          {step === 2 && (
            <View>
              <Text style={s.sectionTitle}>코스 장소를 입력해 주세요</Text>
              <Text style={s.hint}>최소 1개 이상, 현지인만 아는 숨은 장소를 담아주세요</Text>

              {places.map((place, i) => (
                <View key={i} style={s.placeCard}>
                  <View style={s.placeHeader}>
                    <Text style={s.placeNum}>{i + 1}번째 장소</Text>
                    {places.length > 1 && (
                      <TouchableOpacity onPress={() => removePlace(i)}>
                        <Text style={s.removeBtn}>삭제</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    style={s.input}
                    placeholder="장소 이름"
                    value={place.name}
                    onChangeText={v => updatePlace(i, 'name', v)}
                  />
                  <TextInput
                    style={[s.input, { marginTop: 8 }]}
                    placeholder="현지인 팁 (선택)"
                    value={place.desc}
                    onChangeText={v => updatePlace(i, 'desc', v)}
                  />
                </View>
              ))}

              <TouchableOpacity style={s.addPlaceBtn} onPress={addPlace}>
                <Text style={s.addPlaceText}>+ 장소 추가</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 하단 버튼 */}
      <View style={s.footer}>
        {step > 0 && (
          <TouchableOpacity style={s.prevBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={s.prevBtnText}>이전</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.nextBtn, !canNext() && s.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canNext() || submitting}
        >
          <Text style={s.nextBtnText}>
            {submitting ? '등록 중...' : step < 2 ? '다음' : '등록 완료'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#1A1A1E' },
  header:         { paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
                    borderBottomWidth: 1, borderBottomColor: '#3A3A3E' },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: '#F2F2F7', textAlign: 'center' },

  // 인증 배지 바
  verifiedBar:    { flexDirection: 'row', alignItems: 'center', gap: 10,
                    paddingHorizontal: spacing.xl, paddingVertical: 10,
                    backgroundColor: '#242428', borderBottomWidth: 1, borderBottomColor: '#3A3A3E' },
  verifiedChip:   { backgroundColor: '#0A84FF', borderRadius: 20,
                    paddingHorizontal: 12, paddingVertical: 4 },
  verifiedChipText:{ fontSize: 12, fontWeight: '700', color: '#fff' },
  verifiedNote:   { fontSize: 12, color: '#8E8E93' },

  // 게이트 화면
  gateBox:        { flex: 1, alignItems: 'center', justifyContent: 'center',
                    padding: spacing.xl, gap: 14 },
  gateEmoji:      { fontSize: 52 },
  gateTitle:      { fontSize: 20, fontWeight: '800', color: '#F2F2F7' },
  gateDesc:       { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 22 },
  gateBtn:        { backgroundColor: '#0A84FF', borderRadius: radius.lg,
                    paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  gateBtnText:    { fontSize: 15, fontWeight: '700', color: '#fff' },

  stepRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start',
                    paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, gap: 0 },
  stepItem:       { alignItems: 'center', flexDirection: 'row', gap: 0 },
  stepDot:        { width: 28, height: 28, borderRadius: 14, backgroundColor: '#3A3A3E',
                    alignItems: 'center', justifyContent: 'center' },
  stepDotActive:  { backgroundColor: colors.primary },
  stepNum:        { fontSize: 13, fontWeight: '700', color: '#8E8E93' },
  stepNumActive:  { color: '#fff' },
  stepLabel:      { fontSize: 11, color: '#8E8E93', marginLeft: 4 },
  stepLabelActive:{ color: colors.primary, fontWeight: '600' },
  stepLine:       { width: 28, height: 2, backgroundColor: '#3A3A3E', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: colors.primary },

  body:           { padding: spacing.xl, paddingBottom: 40 },
  sectionTitle:   { fontSize: 17, fontWeight: '700', color: '#F2F2F7', marginBottom: spacing.lg },
  label:          { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 8 },
  hint:           { fontSize: 12, color: '#8E8E93', marginTop: 8 },

  imagePickerBtn: { height: 140, backgroundColor: '#242428', borderRadius: radius.md,
                    borderWidth: 1.5, borderColor: '#3A3A3E', borderStyle: 'dashed',
                    alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePickerIcon:{ fontSize: 28 },
  imagePickerText:{ fontSize: 14, color: '#8E8E93', fontWeight: '600' },
  imagePreviewWrap:{ position: 'relative', height: 160, borderRadius: radius.md, overflow: 'hidden' },
  imagePreview:   { width: '100%', height: '100%' },
  imageRemoveBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28,
                    borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.55)',
                    alignItems: 'center', justifyContent: 'center' },
  imageRemoveText:{ color: '#fff', fontSize: 13, fontWeight: '700' },
  imageHint:      { fontSize: 11, color: '#8E8E93', marginTop: 8, lineHeight: 16 },

  input:          { backgroundColor: '#242428', borderWidth: 1, borderColor: '#3A3A3E',
                    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
                    fontSize: 15, color: '#F2F2F7' },
  textArea:       { minHeight: 100, paddingTop: 12 },

  chipRow:        { flexDirection: 'row' },
  cityGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: '#242428', borderWidth: 1, borderColor: '#3A3A3E', marginRight: 8, marginBottom: 8 },
  chipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:       { fontSize: 13, color: '#8E8E93' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  cityChip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: '#242428', borderWidth: 1, borderColor: '#3A3A3E' },

  placeCard:      { backgroundColor: '#242428', borderRadius: radius.md, padding: spacing.lg,
                    marginBottom: spacing.md, borderWidth: 1, borderColor: '#3A3A3E' },
  placeHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  placeNum:       { fontSize: 13, fontWeight: '700', color: '#0A84FF' },
  removeBtn:      { fontSize: 12, color: '#B84040' },
  addPlaceBtn:    { borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed',
                    borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  addPlaceText:   { fontSize: 14, color: colors.primary, fontWeight: '600' },

  footer:         { flexDirection: 'row', gap: 10, padding: spacing.lg,
                    borderTopWidth: 1, borderTopColor: '#3A3A3E', backgroundColor: '#1A1A1E' },
  prevBtn:        { flex: 1, paddingVertical: 14, borderRadius: radius.lg, alignItems: 'center',
                    backgroundColor: '#242428', borderWidth: 1, borderColor: '#3A3A3E' },
  prevBtnText:    { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  nextBtn:        { flex: 2, paddingVertical: 14, borderRadius: radius.lg, alignItems: 'center',
                    backgroundColor: colors.primary },
  nextBtnDisabled:{ opacity: 0.4 },
  nextBtnText:    { fontSize: 15, fontWeight: '700', color: '#fff' },
});
