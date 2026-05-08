import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
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
      style={s.root}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* 히어로 영역 */}
        <View style={s.hero}>
          <View style={s.mapIcon}>
            <Text style={s.mapEmoji}>🗺️</Text>
          </View>
          <Text style={s.brand}>LocalCourse</Text>
          <Text style={s.tagline}>현지인이 만든 진짜 여행 코스</Text>
          <View style={s.pills}>
            {['🍜 맛집', '🌊 휴양', '🌃 야경'].map(t => (
              <View key={t} style={s.pill}><Text style={s.pillText}>{t}</Text></View>
            ))}
          </View>
        </View>

        {/* 폼 카드 */}
        <View style={s.card}>
          <Text style={s.cardTitle}>로그인</Text>

          <View style={s.field}>
            <Text style={s.label}>이메일</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              style={s.input}
              placeholderTextColor="#C0B8B0"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>비밀번호</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              style={s.input}
              placeholderTextColor="#C0B8B0"
            />
          </View>

          <TouchableOpacity
            style={[s.btn, busy && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={busy}
          >
            <Text style={s.btnText}>{busy ? '로그인 중...' : '로그인'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={s.linkRow}>
            <Text style={s.link}>계정이 없으신가요? </Text>
            <Text style={s.linkBold}>회원가입</Text>
          </TouchableOpacity>
        </View>

        {/* 데모 계정 힌트 */}
        <View style={s.demo}>
          <Text style={s.demoText}>데모: demo@local.com / test1234</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#1A1A1E' },
  scroll:   { flexGrow: 1 },

  hero:     { backgroundColor: '#0A84FF', paddingTop: 72, paddingBottom: 40,
              paddingHorizontal: 28, alignItems: 'center', gap: 8 },
  mapIcon:  { width: 72, height: 72, borderRadius: 36,
              backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  mapEmoji: { fontSize: 36 },
  brand:    { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline:  { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  pills:    { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill:     { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
              paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  card:     { backgroundColor: '#242428', margin: 20, borderRadius: 20, padding: 24,
              shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardTitle:{ fontSize: 20, fontWeight: '800', color: '#F2F2F7', marginBottom: 20 },

  field:    { gap: 6, marginBottom: 14 },
  label:    { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  input:    { backgroundColor: '#1A1A1E', borderWidth: 1, borderColor: '#3A3A3E',
              borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
              fontSize: 15, color: '#F2F2F7' },

  btn:      { backgroundColor: '#0A84FF', borderRadius: 14,
              paddingVertical: 16, alignItems: 'center', marginTop: 6 },
  btnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },

  linkRow:  { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  link:     { fontSize: 14, color: '#8E8E93' },
  linkBold: { fontSize: 14, color: '#0A84FF', fontWeight: '700' },

  demo:     { alignItems: 'center', paddingBottom: 32 },
  demoText: { fontSize: 12, color: '#B0A898',
              backgroundColor: '#242428', borderRadius: 10,
              paddingHorizontal: 14, paddingVertical: 6 },
});
