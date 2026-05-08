import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../api/auth';
import { api } from '../api/client';
import { colors, radius, spacing } from '../theme';

function MenuItem({ icon, label, sub, onPress }) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress}>
      <View style={s.menuIconWrap}>
        <Feather name={icon} size={18} color={colors.textMuted} />
      </View>
      <View style={s.menuTextWrap}>
        <Text style={s.menuLabel}>{label}</Text>
        {sub ? <Text style={s.menuSub}>{sub}</Text> : null}
      </View>
      <Feather name="chevron-right" size={16} color={colors.textLight} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const [counts, setCounts] = useState({ courses: 0, purchases: 0 });

  useFocusEffect(useCallback(() => {
    refreshUser();
    Promise.all([api.myCourses(), api.myPurchases()])
      .then(([c, p]) => setCounts({ courses: c.courses.length, purchases: p.courses.length }))
      .catch(() => {});
  }, []));

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>프로필</Text>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* 프로필 카드 */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.nickname?.[0] || '?'}</Text>
          </View>
          <View style={s.profileInfo}>
            <View style={s.nicknameRow}>
              <Text style={s.nickname}>{user?.nickname}</Text>
              {user?.verified_region ? (
                <View style={s.verifiedBadge}>
                  <Feather name="check-circle" size={10} color={colors.primary} />
                  <Text style={s.verifiedText}> {user.verified_region} 현지인</Text>
                </View>
              ) : (
                <View style={s.unverifiedBadge}>
                  <Text style={s.unverifiedText}>미인증</Text>
                </View>
              )}
            </View>
            <Text style={s.email}>{user?.email}</Text>
          </View>
        </View>

        {/* 머니 카드 */}
        <TouchableOpacity style={s.moneyCard} onPress={() => navigation.navigate('Charge')}>
          <View>
            <Text style={s.moneyLabel}>내 머니</Text>
            <Text style={s.moneyValue}>{(user?.money || 0).toLocaleString()}원</Text>
          </View>
          <View style={s.chargeBtn}>
            <Text style={s.chargeBtnText}>충전하기</Text>
          </View>
        </TouchableOpacity>

        {/* 메뉴 그룹 */}
        <View style={s.menuGroup}>
          <MenuItem
            icon="map"
            label="내가 등록한 코스"
            sub={counts.courses > 0 ? `${counts.courses}개` : '아직 없음'}
            onPress={() => navigation.navigate('MyCourses')}
          />
          <View style={s.divider} />
          <MenuItem
            icon="shopping-bag"
            label="구매한 코스"
            sub={counts.purchases > 0 ? `${counts.purchases}개` : '아직 없음'}
            onPress={() => navigation.navigate('MyPurchases')}
          />
        </View>

        <View style={s.menuGroup}>
          <MenuItem
            icon="shield"
            label="지역 인증하기"
            sub={user?.verified_region
              ? `${user.verified_region} 인증 완료 · 재인증 가능`
              : '주민등록증으로 현지인 인증'}
            onPress={() => navigation.navigate('VerifyId')}
          />
        </View>

        <View style={s.menuGroup}>
          <MenuItem
            icon="log-out"
            label="로그아웃"
            onPress={() => Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
              { text: '취소', style: 'cancel' },
              { text: '로그아웃', onPress: logout, style: 'destructive' },
            ])}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#1A1A1E' },
  header:       { paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
                  backgroundColor: '#242428', borderBottomWidth: 1, borderBottomColor: '#3A3A3E' },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: colors.text },
  body:         { padding: spacing.lg, gap: 12, paddingBottom: 40 },

  profileCard:  { flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: '#242428', borderRadius: radius.lg, padding: spacing.lg },
  avatar:       { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primary,
                  alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 22, fontWeight: '700', color: '#fff' },
  profileInfo:  { flex: 1, gap: 4 },
  nicknameRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  nickname:     { fontSize: 17, fontWeight: '700', color: colors.text },
  verifiedBadge:{ flexDirection: 'row', alignItems: 'center',
                  backgroundColor: colors.primaryLight, borderRadius: 20,
                  paddingHorizontal: 8, paddingVertical: 3 },
  verifiedText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  unverifiedBadge:{ backgroundColor: '#242428', borderRadius: 20,
                    paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: '#3A3A3E' },
  unverifiedText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  email:        { fontSize: 13, color: colors.textMuted },

  moneyCard:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg },
  moneyLabel:   { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  moneyValue:   { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 2 },
  chargeBtn:    { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20,
                  paddingHorizontal: 14, paddingVertical: 7 },
  chargeBtnText:{ fontSize: 13, fontWeight: '700', color: '#fff' },

  menuGroup:    { backgroundColor: '#242428', borderRadius: radius.lg, overflow: 'hidden' },
  menuItem:     { flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 16, paddingVertical: 16 },
  menuIconWrap: { width: 32, alignItems: 'center' },
  menuTextWrap: { flex: 1 },
  menuLabel:    { fontSize: 15, fontWeight: '600', color: colors.text },
  menuSub:      { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  divider:      { height: 1, backgroundColor: '#3A3A3E', marginLeft: 48 },
});
