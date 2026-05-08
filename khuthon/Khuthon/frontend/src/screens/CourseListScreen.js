import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { colors, radius, spacing } from '../theme';

export default function CourseListScreen({ route, navigation }) {
  const { province, city } = route.params;
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { courses } = await api.listCourses(province, city);
      setCourses(courses);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={20}>
          <Text style={s.back}>‹ 뒤로</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.title}>{city}</Text>
          <Text style={s.subtitle}>{province}</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {courses.length === 0 && !loading && (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>아직 등록된 코스가 없어요</Text>
            <Text style={s.emptyText}>이 지역의 첫 번째 코스를 만들어보세요</Text>
          </View>
        )}

        {courses.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={s.card}
            onPress={() => navigation.navigate('CourseDetail', { id: c.id })}
          >
            <View style={s.lockBadge}>
              <Text style={s.lockText}>🔒 비공개</Text>
            </View>

            <Text style={s.courseTitle}>{c.title}</Text>
            <Text style={s.seller}>by {c.seller}</Text>

            <View style={s.tags}>
              {c.tags.map((t, i) => (
                <View key={i} style={s.tag}>
                  <Text style={s.tagText}>{t}</Text>
                </View>
              ))}
            </View>

            <View style={s.footer}>
              <Text style={s.price}>{c.price.toLocaleString()}원</Text>
              <View style={s.openBtn}>
                <Text style={s.openBtnText}>공개하기 →</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
  },
  back: { fontSize: 16, color: colors.primary, width: 50 },
  title: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  list: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  lockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F2EB',
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  lockText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  courseTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  seller: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tagText: { fontSize: 11, color: colors.primaryDark, fontWeight: '500' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  price: { fontSize: 18, fontWeight: '700', color: colors.primary },
  openBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  openBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, color: colors.text, fontWeight: '600' },
  emptyText: { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
});
