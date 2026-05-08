import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { useAuth } from '../api/auth';
import { colors, radius, spacing } from '../theme';

export default function CourseDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user, refreshUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { course } = await api.courseDetail(id);
      setCourse(course);
    } catch (e) {
      Alert.alert('오류', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePurchase = () => {
    if (!course) return;

    if ((user?.money || 0) < course.price) {
      // 잔액 부족
      Alert.alert(
        '머니가 부족합니다',
        `필요: ${course.price.toLocaleString()}원\n현재: ${(user?.money || 0).toLocaleString()}원\n\n충전 화면으로 이동하시겠어요?`,
        [
          { text: '취소', style: 'cancel' },
          { text: '충전하기', onPress: () => navigation.navigate('Charge') },
        ],
      );
      return;
    }

    // 결제 확인
    Alert.alert(
      '코스 공개하기',
      `${course.price.toLocaleString()}원이 차감됩니다.\n계속 진행하시겠어요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '결제',
          onPress: async () => {
            setPaying(true);
            try {
              await api.purchaseCourse(course.id);
              await refreshUser();
              await load();
              Alert.alert('🎉 결제 완료', '코스가 공개되었습니다!');
            } catch (e) {
              Alert.alert('결제 실패', e.message);
            } finally {
              setPaying(false);
            }
          },
        },
      ],
    );
  };

  if (loading || !course) {
    return (
      <SafeAreaView style={s.center} edges={['top']}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={20}>
          <Text style={s.back}>‹ 뒤로</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.region}>{course.province} · {course.city}</Text>
        <Text style={s.title}>{course.title}</Text>
        <Text style={s.seller}>by {course.seller}</Text>

        <View style={s.tags}>
          {course.tags.map((t, i) => (
            <View key={i} style={s.tag}>
              <Text style={s.tagText}>{t}</Text>
            </View>
          ))}
        </View>

        {/* 잠금 해제 상태에 따른 분기 */}
        {course.unlocked ? (
          <View style={s.unlockedBox}>
            <View style={s.unlockBadge}>
              <Text style={s.unlockBadgeText}>✓ 공개됨</Text>
            </View>

            <Text style={s.sectionTitle}>코스 설명</Text>
            <Text style={s.description}>{course.description}</Text>

            <Text style={s.sectionTitle}>코스 동선</Text>
            {course.places.map((p, i) => (
              <View key={i} style={s.placeRow}>
                <View style={s.placeNum}>
                  <Text style={s.placeNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.placeName}>{p.name}</Text>
                  <Text style={s.placeDesc}>{p.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.lockedBox}>
            <Text style={s.lockedIcon}>🔒</Text>
            <Text style={s.lockedTitle}>비공개 코스입니다</Text>
            <Text style={s.lockedDesc}>
              결제하면 현지인이 직접 짠 동선과{'\n'}장소별 설명을 모두 볼 수 있어요
            </Text>

            <View style={s.priceBox}>
              <Text style={s.priceLabel}>가격</Text>
              <Text style={s.price}>{course.price.toLocaleString()}원</Text>
            </View>

            <View style={s.balanceRow}>
              <Text style={s.balanceLabel}>내 머니</Text>
              <Text style={[
                s.balanceValue,
                (user?.money || 0) < course.price && { color: colors.danger },
              ]}>
                {(user?.money || 0).toLocaleString()}원
              </Text>
            </View>

            <TouchableOpacity
              style={[s.payBtn, paying && { opacity: 0.6 }]}
              onPress={handlePurchase}
              disabled={paying}
            >
              <Text style={s.payBtnText}>
                {paying ? '결제 중...' : '결제하고 공개하기'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  back: { fontSize: 16, color: colors.primary },
  body: { padding: spacing.xl, paddingBottom: spacing.xxl },
  region: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 4 },
  seller: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tagText: { fontSize: 11, color: colors.primaryDark, fontWeight: '500' },

  // 잠긴 상태
  lockedBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  lockedIcon: { fontSize: 48, marginBottom: spacing.md },
  lockedTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  lockedDesc: {
    fontSize: 13, color: colors.textMuted,
    textAlign: 'center', marginTop: spacing.sm, lineHeight: 20,
  },
  priceBox: {
    flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm,
    marginTop: spacing.xl,
  },
  priceLabel: { fontSize: 13, color: colors.textMuted },
  price: { fontSize: 32, fontWeight: '700', color: colors.primary },
  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', marginTop: spacing.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    backgroundColor: colors.bg, borderRadius: radius.md,
  },
  balanceLabel: { fontSize: 13, color: colors.textMuted },
  balanceValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  payBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl,
    borderRadius: radius.md, marginTop: spacing.lg,
    width: '100%', alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // 잠금 해제 상태
  unlockedBox: { marginTop: spacing.xl },
  unlockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.lg,
  },
  unlockBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: colors.text,
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14, color: colors.text, lineHeight: 22,
    backgroundColor: colors.card, padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  placeRow: {
    flexDirection: 'row', gap: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.lg, borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  placeNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  placeNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  placeName: { fontSize: 15, fontWeight: '600', color: colors.text },
  placeDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
