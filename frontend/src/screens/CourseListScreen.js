import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { radius, spacing } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_IMG_H = 200;

function courseImage(id, imageUrl) {
  return imageUrl || `https://picsum.photos/seed/course${id}/800/400`;
}

function StarRow({ rating, reviewCount, purchaseCount }) {
  return (
    <View style={ss.row}>
      <Text style={ss.star}>★</Text>
      <Text style={ss.rating}>{rating ? rating.toFixed(1) : '-'}</Text>
      {reviewCount > 0 && <Text style={ss.count}>({reviewCount})</Text>}
      <Text style={ss.dot}> · </Text>
      <Text style={ss.meta}>🛍 {purchaseCount > 100 ? '100+' : purchaseCount}명 구매</Text>
    </View>
  );
}

const FILTERS = ['전체', '맛집', '휴양', '액티비티', '야경', '혼자', '연인과 함께'];

export default function CourseListScreen({ route, navigation }) {
  const { province, city } = route.params;
  const [courses, setCourses]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTag, setActiveTag] = useState('전체');

  const load = async () => {
    setLoading(true);
    try {
      const { courses } = await api.listCourses(province, city);
      setCourses(courses);
      setFiltered(courses);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (tag) => {
    setActiveTag(tag);
    if (tag === '전체') { setFiltered(courses); return; }
    setFiltered(courses.filter(c => c.tags.some(t => t.includes(tag))));
  };

  const isBestSeller = (c) => c.purchase_count >= 10;
  const isNew = (c) => {
    const created = new Date(c.created_at || Date.now());
    return (Date.now() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* 헤더 */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={20}>
          <Text style={s.back}>‹</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.title}>{city}</Text>
          <Text style={s.subtitle}>{province}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* 태그 필터 */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={t => t}
        style={s.filterBar}
        contentContainerStyle={s.filterContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.filterChip, activeTag === item && s.filterChipActive]}
            onPress={() => handleFilter(item)}
          >
            <Text style={[s.filterText, activeTag === item && s.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* 코스 목록 */}
      <FlatList
        data={filtered}
        keyExtractor={c => String(c.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={s.list}
        ListEmptyComponent={!loading && (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>등록된 코스가 없어요</Text>
            <Text style={s.emptyText}>이 지역의 첫 번째 코스를 만들어보세요</Text>
          </View>
        )}
        renderItem={({ item: c }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => navigation.navigate('CourseDetail', { id: c.id })}
            activeOpacity={0.92}
          >
            {/* 이미지 */}
            <View style={s.imgWrap}>
              <Image
                source={{ uri: courseImage(c.id, c.image_url) }}
                style={s.img}
                resizeMode="cover"
              />
              {/* 배지 */}
              {isBestSeller(c) && (
                <View style={[s.badge, s.badgeBest]}>
                  <Text style={s.badgeText}>BEST SELLER</Text>
                </View>
              )}
              {!isBestSeller(c) && isNew(c) && (
                <View style={[s.badge, s.badgeNew]}>
                  <Text style={s.badgeText}>NEW</Text>
                </View>
              )}
              {/* 구매완료 */}
              {c.purchased && (
                <View style={s.purchasedOverlay}>
                  <Text style={s.purchasedText}>✓ 공개됨</Text>
                </View>
              )}
            </View>

            {/* 카드 내용 */}
            <View style={s.cardBody}>
              <Text style={s.courseTitle} numberOfLines={2}>{c.title}</Text>
              <View style={s.metaLine}>
                <StarRow
                  rating={c.avg_rating}
                  reviewCount={c.review_count}
                  purchaseCount={c.purchase_count}
                />
                <Text style={s.seller}>by {c.seller}</Text>
              </View>

              <View style={s.cardFooter}>
                <View style={s.tags}>
                  {c.tags.slice(0, 2).map((t, i) => (
                    <View key={i} style={s.tag}>
                      <Text style={s.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
                <Text style={s.price}>{c.price.toLocaleString()}원</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  star:   { fontSize: 13, color: '#E8A020' },
  rating: { fontSize: 13, fontWeight: '700', color: '#3A3028' },
  count:  { fontSize: 12, color: '#8E8E93' },
  dot:    { fontSize: 12, color: '#C8C0B4' },
  meta:   { fontSize: 12, color: '#8E8E93' },
});

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#1A1A1E' },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: spacing.xl, paddingVertical: 12,
                  borderBottomWidth: 1, borderBottomColor: '#3A3A3E' },
  back:         { fontSize: 26, color: '#0A84FF', width: 32, lineHeight: 32 },
  headerCenter: { alignItems: 'center' },
  title:        { fontSize: 17, fontWeight: '700', color: '#F2F2F7' },
  subtitle:     { fontSize: 12, color: '#8E8E93', marginTop: 1 },

  filterBar:    { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: '#3A3A3E' },
  filterContent:{ paddingHorizontal: spacing.lg, paddingVertical: 8, gap: 8 },
  filterChip:   { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: '#242428', borderWidth: 1, borderColor: '#3A3A3E' },
  filterChipActive: { backgroundColor: '#0A84FF', borderColor: '#0A84FF' },
  filterText:   { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '700' },

  list:         { padding: spacing.lg, gap: 20, paddingBottom: 40 },

  card:         { backgroundColor: '#242428', borderRadius: 16,
                  overflow: 'hidden',
                  shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.10, shadowRadius: 10, elevation: 4 },

  imgWrap:      { width: '100%', height: CARD_IMG_H },
  img:          { width: '100%', height: '100%' },

  badge:        { position: 'absolute', top: 12, left: 12,
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeBest:    { backgroundColor: '#0A84FF' },
  badgeNew:     { backgroundColor: '#9A6E4C' },
  badgeText:    { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  purchasedOverlay: { position: 'absolute', top: 12, right: 12,
                      backgroundColor: 'rgba(10,132,255,0.9)',
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  purchasedText:{ fontSize: 11, fontWeight: '700', color: '#fff' },

  cardBody:     { padding: 16, gap: 8 },
  courseTitle:  { fontSize: 16, fontWeight: '700', color: '#F2F2F7', lineHeight: 22 },
  metaLine:     { gap: 4 },
  seller:       { fontSize: 12, color: '#8E8E93' },

  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  marginTop: 4 },
  tags:         { flexDirection: 'row', gap: 6 },
  tag:          { backgroundColor: '#242428', paddingHorizontal: 8, paddingVertical: 3,
                  borderRadius: 10 },
  tagText:      { fontSize: 11, color: '#8E8E93' },
  price:        { fontSize: 16, fontWeight: '700', color: '#0A84FF' },

  empty:        { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:   { fontSize: 16, color: '#3A3028', fontWeight: '600' },
  emptyText:    { fontSize: 13, color: '#8E8E93', marginTop: 8 },
});
