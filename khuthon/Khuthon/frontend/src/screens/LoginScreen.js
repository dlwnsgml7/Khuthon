import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useAuth } from '../api/auth';
import { colors, radius, spacing } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@local.com');
  const [password, setPassword] = useState('test1234');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) return Alert.alert('알림', '이메일과 비밀번호를 입력해주세요');
    setBusy(true);
    try {
      await login(email, password);
    } catch (e) {
      Alert.alert('로그인 실패', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.container}
    >
      <View style={s.brand}>
        <Text style={s.logo}>🗺️ LocalCourse</Text>
        <Text style={s.tagline}>현지인이 만든 진짜 여행 코스</Text>
      </View>

      <View style={s.form}>
        <Text style={s.label}>이메일</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          style={s.input}
          placeholderTextColor={colors.textLight}
        />

        <Text style={s.label}>비밀번호</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          style={s.input}
          placeholderTextColor={colors.textLight}
        />

        <TouchableOpacity
          style={[s.btn, busy && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={busy}
        >
          <Text style={s.btnText}>{busy ? '로그인 중...' : '로그인'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={s.link}>아직 계정이 없으신가요? 회원가입</Text>
        </TouchableOpacity>

        <View style={s.demoBox}>
          <Text style={s.demoTitle}>데모 계정</Text>
          <Text style={s.demoText}>demo@local.com / test1234</Text>
          <Text style={s.demoTextMuted}>(머니 5,000원 보유)</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: 'center' },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: { fontSize: 32, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  tagline: { fontSize: 14, color: colors.textMuted },
  form: { gap: spacing.sm },
  label: { fontSize: 13, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: colors.primary, marginTop: spacing.lg, fontSize: 14 },
  demoBox: {
    marginTop: spacing.xxl, padding: spacing.lg,
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
  },
  demoTitle: { fontSize: 12, color: colors.primaryDark, fontWeight: '600', marginBottom: 4 },
  demoText: { fontSize: 13, color: colors.primaryDark, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  demoTextMuted: { fontSize: 11, color: colors.primaryDark, opacity: 0.7, marginTop: 2 },
});
