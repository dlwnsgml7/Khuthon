import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
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
      style={s.root}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* 상단 헤더 */}
        <View style={s.hero}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>‹</Text>
          </TouchableOpacity>
          <View style={s.mapIcon}>
            <Text style={s.mapEmoji}>🗺️</Text>
          </View>
          <Text style={s.brand}>LocalCourse</Text>
          <Text style={s.tagline}>현지인 코스 마켓플레이스</Text>
        </View>

        {/* 폼 카드 */}
        <View style={s.card}>
          <Text style={s.cardTitle}>회원가입</Text>
          <Text style={s.cardSub}>몇 가지만 입력하면 끝!</Text>

          <View style={s.field}>
            <Text style={s.label}>이메일</Text>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="email@example.com"
              autoCapitalize="none" keyboardType="email-address"
              style={s.input} placeholderTextColor="#C0B8B0"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>닉네임</Text>
            <TextInput
              value={nickname} onChangeText={setNickname}
              placeholder="여행자김"
              style={s.input} placeholderTextColor="#C0B8B0"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>비밀번호 (6자 이상)</Text>
            <TextInput
              value={password} onChangeText={setPassword}
              placeholder="••••••••" secureTextEntry
              style={s.input} placeholderTextColor="#C0B8B0"
            />
          </View>

          <TouchableOpacity
            style={[s.btn, busy && { opacity: 0.6 }]}
            onPress={onSubmit} disabled={busy}
          >
            <Text style={s.btnText}>{busy ? '가입 중...' : '가입하기'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={s.linkRow}>
            <Text style={s.link}>이미 계정이 있으신가요? </Text>
            <Text style={s.linkBold}>로그인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#1A1A1E' },
  scroll:   { flexGrow: 1 },

  hero:     { backgroundColor: '#0A84FF', paddingTop: 56, paddingBottom: 32,
              paddingHorizontal: 28, alignItems: 'center', gap: 8 },
  backBtn:  { position: 'absolute', top: 56, left: 20,
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: '#fff', fontWeight: '600', lineHeight: 28 },
  mapIcon:  { width: 60, height: 60, borderRadius: 30,
              backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  mapEmoji: { fontSize: 28 },
  brand:    { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline:  { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  card:     { backgroundColor: '#242428', margin: 20, borderRadius: 20, padding: 24,
              shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardTitle:{ fontSize: 20, fontWeight: '800', color: '#F2F2F7' },
  cardSub:  { fontSize: 13, color: '#8E8E93', marginBottom: 16 },

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
});
