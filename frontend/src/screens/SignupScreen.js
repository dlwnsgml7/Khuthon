import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useAuth } from '../api/auth';
import { colors, radius, spacing } from '../theme';

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email || !password || !nickname) {
      return Alert.alert('알림', '모든 항목을 입력해주세요');
    }
    if (password.length < 6) {
      return Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다');
    }
    setBusy(true);
    try {
      await signup(email, password, nickname);
    } catch (e) {
      Alert.alert('가입 실패', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.container}
    >
      <Text style={s.title}>회원가입</Text>
      <Text style={s.subtitle}>몇 가지만 입력하면 끝!</Text>

      <Text style={s.label}>이메일</Text>
      <TextInput
        value={email} onChangeText={setEmail}
        placeholder="email@example.com"
        autoCapitalize="none" keyboardType="email-address"
        style={s.input} placeholderTextColor={colors.textLight}
      />

      <Text style={s.label}>닉네임</Text>
      <TextInput
        value={nickname} onChangeText={setNickname}
        placeholder="여행자김"
        style={s.input} placeholderTextColor={colors.textLight}
      />

      <Text style={s.label}>비밀번호 (6자 이상)</Text>
      <TextInput
        value={password} onChangeText={setPassword}
        placeholder="••••••••" secureTextEntry
        style={s.input} placeholderTextColor={colors.textLight}
      />

      <TouchableOpacity
        style={[s.btn, busy && { opacity: 0.6 }]}
        onPress={onSubmit} disabled={busy}
      >
        <Text style={s.btnText}>{busy ? '가입 중...' : '가입하기'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={s.link}>이미 계정이 있으신가요? 로그인</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xl },
  label: { fontSize: 13, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    fontSize: 16, color: colors.text,
  },
  btn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.lg, alignItems: 'center', marginTop: spacing.lg,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: colors.primary, marginTop: spacing.lg, fontSize: 14 },
});
