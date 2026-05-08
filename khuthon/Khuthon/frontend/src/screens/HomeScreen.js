import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KoreaMap from '../components/KoreaMap';
import { api } from '../api/client';
import { useAuth } from '../api/auth';
import { colors, radius, spacing } from '../theme';

export default function HomeScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [{ counts }] = await Promise.all([
        api.countsByProvince(),
        refreshUser(),
      ]);
      const map = {};
      counts.forEach(c => { map[c.province] = c.count; });
      setCounts(map);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* 헤더 */}
      <View style={s.header}>
        <View>
          <Text style={s.greet}>안녕하세요, {user?.nickname}님</Text>
          <Text style={s.title}>어디로 떠나볼까요?</Text>
        </View>
        <TouchableOpacity onPress={() => {
          Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
            { text: '취소', style: 'cancel' },
            { text: '로그아웃', onPress: logout, style: 'destructive' },
          ]);
        }}>
          <Text style={s.logoutBtn}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* 머니 카드 */}
      <TouchableOpacity
        style={s.moneyCard}
        onPress={() => navigation.navigate('Charge')}
      >
        <View>
          <Text style={s.moneyLabel}>내 머니</Text>
          <Text style={s.moneyValue}>{(user?.money || 0).toLocaleString()}원</Text>
        </View>
        <Text style={s.chargeText}>충전 →</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Text style={s.mapHint}>지역을 선택해 코스를 둘러보세요</Text>

        <View style={s.mapWrap}>
          <KoreaMap
            counts={counts}
            onSelect={(p) => navigation.navigate('Province', { province: p })}
          />
        </View>

        <View style={s.legend}>
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]} />
            <Text style={s.legendText}>등록된 코스 있음</Text>
          </View>
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: '#fff', borderColor: '#C8C8C0' }]} />
            <Text style={s.legendText}>코스 없음</Text>
          </View>
        </View>
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
  greet: { fontSize: 13, color: colors.textMuted },
  title: { fontSize: 22, fontWeight: '600', color: colors.text, marginTop: 2 },
  logoutBtn: { fontSize: 13, color: colors.textMuted },
  moneyCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: spacing.xl, padding: spacing.lg,
    backgroundColor: colors.primary, borderRadius: radius.lg,
  },
  moneyLabel: { color: '#fff', fontSize: 12, opacity: 0.85 },
  moneyValue: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 2 },
  chargeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  mapHint: {
    textAlign: 'center', color: colors.textMuted, fontSize: 13,
    marginTop: spacing.lg,
  },
  mapWrap: {
    aspectRatio: 0.78,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3, borderWidth: 1 },
  legendText: { fontSize: 12, color: colors.textMuted },
});
