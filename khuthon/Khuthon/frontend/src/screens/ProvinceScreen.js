import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CITIES_BY_PROVINCE } from '../assets/regions';
import { api } from '../api/client';
import { colors, radius, spacing } from '../theme';

export default function ProvinceScreen({ route, navigation }) {
  const { province } = route.params;
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const cities = CITIES_BY_PROVINCE[province.name] || [];

  const load = async () => {
    setLoading(true);
    try {
      const { counts } = await api.countsByCity(province.name);
      const map = {};
      counts.forEach(c => { map[c.city] = c.count; });
      setCounts(map);
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
        <Text style={s.title}>{province.name}</Text>
        <View style={{ width: 50 }} />
      </View>

      <Text style={s.subtitle}>시·군·구를 선택해주세요</Text>

      <ScrollView
        contentContainerStyle={s.grid}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {cities.map((city) => {
          const count = counts[city] || 0;
          const has = count > 0;
          return (
            <TouchableOpacity
              key={city}
              style={[s.cityCard, has && s.cityCardActive]}
              onPress={() => navigation.navigate('CourseList', {
                province: province.name,
                city,
              })}
            >
              <Text style={[s.cityName, has && { color: colors.primaryDark }]}>{city}</Text>
              {has ? (
                <Text style={s.cityCount}>코스 {count}개</Text>
              ) : (
                <Text style={s.cityCountMuted}>아직 없음</Text>
              )}
            </TouchableOpacity>
          );
        })}
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
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  subtitle: {
    paddingHorizontal: spacing.xl, fontSize: 13,
    color: colors.textMuted, marginBottom: spacing.md,
  },
  grid: {
    paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl,
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  cityCard: {
    width: '48.5%',
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  cityCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  cityName: { fontSize: 15, fontWeight: '600', color: colors.text },
  cityCount: { fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '500' },
  cityCountMuted: { fontSize: 12, color: colors.textLight, marginTop: 4 },
});
