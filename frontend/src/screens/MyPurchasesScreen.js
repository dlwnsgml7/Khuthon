import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { colors, radius, spacing } from '../theme';

const IMG_H = 130;

function courseImage(id, imageUrl) {
  return imageUrl || `https://picsum.photos/seed/course${id}/800/400`;
}

export default function MyPurchasesScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { courses } = await api.myPurchases();
      setCourses(courses);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={20}>
          <Text style={s.back}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>구매한 코스</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={courses}
        keyExtractor={c => String(c.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={s.list}
        ListEmptyComponent={!loading && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🛍️</Text>
            <Text style={s.emptyTitle}>아직 구매한 코스가 없어요</Text>
            <Text style={s.emptyDesc}>지도에서 마음에 드는 코스를 찾아보세요!</Text>
          </View>
        )}
        renderItem={({ item: c }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => navigation.navigate('CourseDetail', { id: c.id })}
            activeOpacity={0.92}
          >
            <View style={s.imgWrap}>
              <Image
                source={{ uri: courseImage(c.id, c.image_url) }}
                style={s.img}
                resizeMode="cover"
              />
              <View style={s.unlockedBadge}>
                <Text style={s.unlockedText}>✓ 공개됨</Text>
              </View>
            </View>
            <View style={s.body}>
              <Text style={s.region}>{c.province} · {c.city}</Text>
              <Text style={s.courseTitle} numberOfLines={2}>{c.title}</Text>
              <View style={s.metaRow}>
                <Text style={s.seller}>by {c.seller}</Text>
              </View>
              <View style={s.footer}>
                <View style={s.tags}>
                  {c.tags.slice(0, 2).map((t, i) => (
                    <View key={i} style={s.tag}><Text style={s.tagText}>{t}</Text></View>
                  ))}
                </View>
                <View style={s.paidTag}>
                  <Text style={s.paidText}>구매완료</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#1A1A1E' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 paddingHorizontal: spacing.xl, paddingVertical: 12,
                 backgroundColor: '#1A1A1E', borderBottomWidth: 1, borderBottomColor: '#3A3A3E' },
  back:        { fontSize: 26, color: '#0A84FF', width: 32, lineHeight: 32 },
  title:       { fontSize: 17, fontWeight: '700', color: '#F2F2F7' },
  list:        { padding: spacing.lg, gap: 16, paddingBottom: 40 },

  card:        { backgroundColor: '#242428', borderRadius: 16, overflow: 'hidden',
                 shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
                 shadowOpacity: 0.09, shadowRadius: 10, elevation: 3 },
  imgWrap:     { width: '100%', height: IMG_H },
  img:         { width: '100%', height: '100%' },
  unlockedBadge:{ position: 'absolute', top: 10, left: 10,
                  backgroundColor: 'rgba(74,140,106,0.9)',
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  unlockedText:{ fontSize: 11, fontWeight: '700', color: '#fff' },

  body:        { padding: 14, gap: 4 },
  region:      { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
  courseTitle: { fontSize: 15, fontWeight: '700', color: '#F2F2F7', lineHeight: 21 },
  metaRow:     { marginTop: 2 },
  seller:      { fontSize: 12, color: '#8E8E93' },
  footer:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  tags:        { flexDirection: 'row', gap: 6 },
  tag:         { backgroundColor: '#242428', borderRadius: 10,
                 paddingHorizontal: 8, paddingVertical: 3 },
  tagText:     { fontSize: 11, color: '#8E8E93' },
  paidTag:     { backgroundColor: '#242428', borderRadius: 10,
                 paddingHorizontal: 10, paddingVertical: 4 },
  paidText:    { fontSize: 11, fontWeight: '700', color: '#0A84FF' },

  empty:       { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyIcon:   { fontSize: 44 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: '#F2F2F7' },
  emptyDesc:   { fontSize: 13, color: '#8E8E93', textAlign: 'center', lineHeight: 20 },
});
