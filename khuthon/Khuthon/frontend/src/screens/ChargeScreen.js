import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { useAuth } from '../api/auth';
import { colors, radius, spacing } from '../theme';

const PRESETS = [1000, 3000, 5000, 10000];

export default function ChargeScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const [busy, setBusy] = useState(false);

  const charge = async (amount) => {
    setBusy(true);
    try {
      const { user: updated } = await api.charge(amount);
      setUser(updated);
      Alert.alert('충전 완료', `${amount.toLocaleString()}원이 충전되었습니다`);
    } catch (e) {
      Alert.alert('충전 실패', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={20}>
          <Text style={s.back}>‹ 뒤로</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>머니 충전</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={s.body}>
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>현재 잔액</Text>
          <Text style={s.balanceValue}>
            {(user?.money || 0).toLocaleString()}<Text style={s.balanceUnit}>원</Text>
          </Text>
        </View>

        <Text style={s.sectionTitle}>충전 금액 선택</Text>

        <View style={s.grid}>
          {PRESETS.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[s.presetBtn, busy && { opacity: 0.5 }]}
              onPress={() => charge(amt)}
              disabled={busy}
            >
              <Text style={s.presetText}>+{amt.toLocaleString()}원</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.note}>
          <Text style={s.noteText}>
            ※ 데모 환경에서는 실제 결제 없이 즉시 충전됩니다.
          </Text>
        </View>
      </View>
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { padding: spacing.xl },
  balanceCard: {
    backgroundColor: colors.primary,
    padding: spacing.xl, borderRadius: radius.lg,
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 13, color: '#fff', opacity: 0.85 },
  balanceValue: { fontSize: 36, fontWeight: '700', color: '#fff', marginTop: spacing.xs },
  balanceUnit: { fontSize: 18, fontWeight: '500' },
  sectionTitle: {
    fontSize: 14, color: colors.text, fontWeight: '600',
    marginTop: spacing.xl, marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  presetBtn: {
    width: '48.5%',
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  presetText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  note: {
    marginTop: spacing.xl, padding: spacing.md,
    backgroundColor: '#FBF6E8', borderRadius: radius.md,
  },
  noteText: { fontSize: 12, color: '#7A5C0E' },
});
