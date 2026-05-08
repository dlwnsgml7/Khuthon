import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Image, Dimensions,
  ActionSheetIOS, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { useAuth } from '../api/auth';
import { radius, spacing } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 300;

function courseImage(id, imageUrl) {
  return imageUrl || `https://picsum.photos/seed/course${id}/800/500`;
}

function StarRow({ avg, count }) {
  if (!avg) return <Text style={s.noRating}>아직 평가 없음</Text>;
  return (
    <View style={s.starRow}>
      <Text style={s.starIcon}>★</Text>
      <Text style={s.starVal}>{Number(avg).toFixed(1)}</Text>
      <Text style={s.starCount}>({count}개 평가)</Text>
    </View>
  );
}

export default function CourseDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [course, setCourse]   = useState(null);
  const [reviews, setReviews] = useState({ avg: null, count: 0 });
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [{ course }, rv] = await Promise.all([
        api.courseDetail(id),
        api.getReviews(id),
      ]);
      setCourse(course);
      setReviews(rv);
    } catch (e) {
      Alert.alert('오류', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openMenu = () => {
    const options = ['코스 평가하기', '판매자에게 메시지', '취소'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2 },
        (i) => {
          if (i === 0) navigation.navigate('Review', { courseId: id, courseTitle: course.title });
          if (i === 1) navigation.navigate('ChatRoom', {
            courseId: id, courseTitle: course.title,
            otherId: course.seller_id, otherNickname: course.seller,
          });
        },
      );
    } else {
      Alert.alert('메뉴', '', [
        { text: '코스 평가하기', onPress: () => navigation.navigate('Review', { courseId: id, courseTitle: course.title }) },
        { text: '판매자에게 메시지', onPress: () => navigation.navigate('ChatRoom', {
            courseId: id, courseTitle: course.title,
            otherId: course.seller_id, otherNickname: course.seller,
          })},
        { text: '취소', style: 'cancel' },
      ]);
    }
  };

  const handlePurchase = () => {
    if (!course) return;
    if ((user?.money || 0) < course.price) {
      Alert.alert('머니가 부족합니다',
        `필요: ${course.price.toLocaleString()}원\n현재: ${(user?.money || 0).toLocaleString()}원`,
        [{ text: '취소', style: 'cancel' },
         { text: '충전하기', onPress: () => navigation.navigate('Charge') }]);
      return;
    }
    Alert.alert('코스 잠금 해제',
      `${course.price.toLocaleString()}원이 차감됩니다.`,
      [{ text: '취소', style: 'cancel' },
       { text: '결제', onPress: async () => {
          setPaying(true);
          try {
            await api.purchaseCourse(course.id);
            await refreshUser();
            await load();
            Alert.alert('🎉 잠금 해제 완료', '코스 동선이 공개되었습니다!');
          } catch (e) { Alert.alert('결제 실패', e.message); }
          finally { setPaying(false); }
        }},
      ]);
  };

  if (loading || !course) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#0A84FF" size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* 히어로 이미지 */}
        <View style={s.heroWrap}>
          <Image source={{ uri: courseImage(id, course?.image_url) }} style={s.hero} resizeMode="cover" />
          <View style={[s.heroOverlay, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={s.heroBtn} onPress={() => navigation.goBack()}>
              <Text style={s.heroBtnText}>‹</Text>
            </TouchableOpacity>
            {course.unlocked && (
              <TouchableOpacity style={s.heroBtn} onPress={openMenu}>
                <Text style={s.heroBtnText}>···</Text>
              </TouchableOpacity>
            )}
          </View>
          {course.unlocked && (
            <View style={s.premiumBadge}>
              <Text style={s.premiumText}>✓ 공개됨</Text>
            </View>
          )}
        </View>

        {/* 콘텐츠 */}
        <View style={s.content}>
          {/* 제목 영역 */}
          <Text style={s.region}>{course.province} · {course.city}</Text>
          <Text style={s.title}>{course.title}</Text>

          <View style={s.metaBar}>
            <StarRow avg={reviews.avg} count={reviews.count} />
            <View style={s.dot} />
            <Text style={s.seller}>by {course.seller}</Text>
          </View>

          {/* 태그 */}
          <View style={s.tags}>
            {course.tags.map((t, i) => (
              <View key={i} style={s.tag}>
                <Text style={s.tagText}>{t}</Text>
              </View>
            ))}
          </View>

          <View style={s.divider} />

          {/* 잠금 / 공개 분기 */}
          {course.unlocked ? (
            <View style={s.unlockedSection}>
              <Text style={s.sectionTitle}>코스 소개</Text>
              <Text style={s.desc}>{course.description}</Text>

              <Text style={s.sectionTitle}>코스 동선</Text>
              {course.places.map((p, i) => (
                <View key={i} style={s.placeRow}>
                  <View style={s.placeNum}>
                    <Text style={s.placeNumText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.placeName}>{p.name}</Text>
                    {p.desc ? <Text style={s.placeDesc}>{p.desc}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={s.lockedSection}>
              <View style={s.lockIconWrap}>
                <Text style={s.lockIcon}>🔒</Text>
              </View>
              <Text style={s.lockTitle}>Unlock this course</Text>
              <Text style={s.lockDesc}>
                현지인이 직접 짠 숨은 동선과{'\n'}장소별 비밀 팁을 모두 볼 수 있어요
              </Text>
              <View style={s.priceRow}>
                <Text style={s.balLabel}>내 머니</Text>
                <Text style={[s.balVal, (user?.money || 0) < course.price && s.balLow]}>
                  {(user?.money || 0).toLocaleString()}원
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 하단 결제 버튼 */}
      {!course.unlocked && (
        <View style={[s.payBar, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={[s.payBtn, paying && s.payBtnDisabled]}
            onPress={handlePurchase}
            disabled={paying}
          >
            <Text style={s.payBtnText}>
              {paying ? '결제 중...' : `Unlock for ₩${course.price.toLocaleString()}`}
            </Text>
          </TouchableOpacity>
          <Text style={s.secure}>🔐 Secure payment</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#1A1A1E' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1E' },
  scroll:       { flex: 1 },

  // 히어로
  heroWrap:     { width: SCREEN_W, height: HERO_H, position: 'relative' },
  hero:         { width: '100%', height: '100%' },
  heroOverlay:  { position: 'absolute', top: 0, left: 0, right: 0,
                  flexDirection: 'row', justifyContent: 'space-between',
                  paddingHorizontal: 16 },
  heroBtn:      { width: 38, height: 38, borderRadius: 19,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  alignItems: 'center', justifyContent: 'center' },
  heroBtnText:  { color: '#fff', fontSize: 20, fontWeight: '600' },
  premiumBadge: { position: 'absolute', bottom: 14, left: 16,
                  backgroundColor: 'rgba(10,132,255,0.9)',
                  paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  premiumText:  { color: '#fff', fontSize: 12, fontWeight: '700' },

  // 콘텐츠
  content:      { padding: 20, paddingBottom: 40 },
  region:       { fontSize: 12, color: '#8E8E93', fontWeight: '500', marginBottom: 4 },
  title:        { fontSize: 22, fontWeight: '800', color: '#F2F2F7', lineHeight: 30 },
  metaBar:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  starRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starIcon:     { fontSize: 14, color: '#E8A020' },
  starVal:      { fontSize: 14, fontWeight: '700', color: '#F2F2F7' },
  starCount:    { fontSize: 12, color: '#8E8E93' },
  noRating:     { fontSize: 12, color: '#B8B0A4' },
  dot:          { width: 3, height: 3, borderRadius: 2, backgroundColor: '#C8C0B4' },
  seller:       { fontSize: 13, color: '#8E8E93' },
  tags:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tag:          { backgroundColor: '#242428', paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 12 },
  tagText:      { fontSize: 12, color: '#8E8E93' },
  divider:      { height: 1, backgroundColor: '#3A3A3E', marginVertical: 20 },

  // 공개 섹션
  unlockedSection:{ gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#F2F2F7', marginTop: 8, marginBottom: 4 },
  desc:         { fontSize: 14, color: '#0A84FF', lineHeight: 22,
                  backgroundColor: '#242428', padding: 14, borderRadius: 12 },
  placeRow:     { flexDirection: 'row', gap: 12, backgroundColor: '#242428',
                  padding: 14, borderRadius: 12 },
  placeNum:     { width: 28, height: 28, borderRadius: 14,
                  backgroundColor: '#0A84FF', justifyContent: 'center', alignItems: 'center' },
  placeNumText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  placeName:    { fontSize: 15, fontWeight: '600', color: '#F2F2F7' },
  placeDesc:    { fontSize: 13, color: '#8A7868', marginTop: 2 },

  // 잠금 섹션
  lockedSection:{ alignItems: 'center', paddingVertical: 20, gap: 12 },
  lockIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#242428',
                  justifyContent: 'center', alignItems: 'center' },
  lockIcon:     { fontSize: 32 },
  lockTitle:    { fontSize: 20, fontWeight: '800', color: '#F2F2F7' },
  lockDesc:     { fontSize: 14, color: '#8A7868', textAlign: 'center', lineHeight: 22 },
  priceRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', backgroundColor: '#242428',
                  borderRadius: 12, padding: 14, marginTop: 8 },
  balLabel:     { fontSize: 14, color: '#8E8E93' },
  balVal:       { fontSize: 15, fontWeight: '700', color: '#F2F2F7' },
  balLow:       { color: '#C05050' },

  // 결제 바
  payBar:       { backgroundColor: '#242428', paddingHorizontal: 20, paddingTop: 12,
                  borderTopWidth: 1, borderTopColor: '#3A3A3E' },
  payBtn:       { backgroundColor: '#0A84FF', borderRadius: 14,
                  paddingVertical: 16, alignItems: 'center' },
  payBtnDisabled:{ opacity: 0.5 },
  payBtnText:   { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  secure:       { textAlign: 'center', fontSize: 12, color: '#8E8E93', marginTop: 8 },
});
