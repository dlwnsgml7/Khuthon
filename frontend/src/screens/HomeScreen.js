import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KoreaMap from '../components/KoreaMap';
import { api } from '../api/client';
import { useAuth } from '../api/auth';
import { colors, radius, spacing } from '../theme';

export default function HomeScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [counts, setCounts]         = useState({});
  const [cityCounts, setCityCounts] = useState({});

  const load = async () => {
    try {
      const [provRes] = await Promise.all([api.countsByProvince(), refreshUser()]);
      const pMap = {};
      provRes.counts.forEach(c => { pMap[c.province] = c.count; });
      setCounts(pMap);
    } catch (e) { console.warn(e); }
  };

  const loadCityCounts = async (provinceName) => {
    try {
      const { counts } = await api.countsByCity(provinceName);
      const cMap = {};
      counts.forEach(c => { cMap[c.city] = c.count; });
      setCityCounts(cMap);
    } catch (e) { console.warn(e); }
  };

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* 고정 헤더 */}
      <View style={s.header}>
        <View>
          <Text style={s.greet}>안녕하세요, {user?.nickname}님</Text>
          <Text style={s.title}>어디로 떠나볼까요?</Text>
        </View>
        <TouchableOpacity style={s.moneyCard} onPress={() => navigation.navigate('Charge')}>
          <Text style={s.moneyLabel}>내 머니</Text>
          <Text style={s.moneyValue}>{(user?.money || 0).toLocaleString()}원</Text>
        </TouchableOpacity>
      </View>

      {/* 지도 */}
      <View style={s.mapContainer}>
        <KoreaMap
          counts={counts}
          cityCounts={cityCounts}
          onProvinceSelect={loadCityCounts}
          onSelectCity={(province, city) =>
            navigation.navigate('CourseList', { province, city })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#1A1A1E' },
  header:      {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    backgroundColor: '#1A1A1E',
    borderBottomWidth: 1, borderBottomColor: '#3A3A3E',
  },
  greet:       { fontSize: 12, color: colors.textMuted },
  title:       { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 2 },
  moneyCard:   {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 6,
    alignItems: 'flex-end',
  },
  moneyLabel:  { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
  moneyValue:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  mapContainer: { flex: 1 },
});
