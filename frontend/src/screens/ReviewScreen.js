import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { colors, radius, spacing } from '../theme';

const STARS = [1, 2, 3, 4, 5];
const LABELS = ['', '별로예요', '그저 그래요', '괜찮아요', '좋아요', '최고예요!'];

export default function ReviewScreen({ route, navigation }) {
  const { courseId, courseTitle } = route.params;
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert('별점을 선택해 주세요'); return; }
    setSaving(true);
    try {
      await api.submitReview(courseId, rating, comment);
      Alert.alert('평가 완료 🎉', '리뷰가 등록됐습니다!', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('오류', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={20}>
          <Text style={s.back}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={s.title}>코스 평가</Text>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.courseTitle}>{courseTitle}</Text>
          <Text style={s.subtitle}>이 코스는 어떠셨나요?</Text>

          {/* 별점 */}
          <View style={s.starsRow}>
            {STARS.map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Text style={[s.star, n <= rating && s.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && <Text style={s.ratingLabel}>{LABELS[rating]}</Text>}

          {/* 코멘트 */}
          <Text style={s.label}>한 줄 평 (선택)</Text>
          <TextInput
            style={s.input}
            placeholder="코스에 대한 솔직한 후기를 남겨주세요"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
          />
          <Text style={s.charCount}>{comment.length} / 200</Text>

          <TouchableOpacity
            style={[s.submitBtn, (rating === 0 || saving) && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={rating === 0 || saving}
          >
            <Text style={s.submitText}>{saving ? '등록 중...' : '평가 등록'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#1A1A1E' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
                 borderBottomWidth: 1, borderBottomColor: '#3A3A3E' },
  back:        { fontSize: 16, color: colors.primary, width: 50 },
  title:       { fontSize: 17, fontWeight: '700', color: '#F2F2F7' },
  body:        { padding: spacing.xl, gap: 16 },
  courseTitle: { fontSize: 18, fontWeight: '700', color: '#F2F2F7', textAlign: 'center' },
  subtitle:    { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
  starsRow:    { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 8 },
  star:        { fontSize: 44, color: '#3A3A3E' },
  starActive:  { color: '#F5C842' },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#B8860B' },
  label:       { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  input:       { backgroundColor: '#242428', borderWidth: 1, borderColor: '#3A3A3E',
                 borderRadius: radius.md, padding: 14, fontSize: 15, color: '#F2F2F7',
                 minHeight: 100 },
  charCount:   { fontSize: 11, color: '#B0A898', textAlign: 'right' },
  submitBtn:   { backgroundColor: colors.primary, borderRadius: radius.lg,
                 paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.4 },
  submitText:  { fontSize: 16, fontWeight: '700', color: '#fff' },
});
