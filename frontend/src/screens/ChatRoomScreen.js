import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ref, push, onValue, off, set, update } from 'firebase/database';
import { rtdb, roomKey } from '../firebase';
import { useAuth } from '../api/auth';
import { colors, spacing } from '../theme';

export default function ChatRoomScreen({ route, navigation }) {
  const { courseId, courseTitle, otherId, otherNickname } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const listRef = useRef(null);

  const rKey = roomKey(courseId, user?.id, otherId);
  const msgsRef = ref(rtdb, `chats/${rKey}/messages`);

  useEffect(() => {
    // Firebase 실시간 리스너
    const unsub = onValue(msgsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.entries(data)
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => a.createdAt - b.createdAt);
        setMessages(arr);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      } else {
        setMessages([]);
      }
    });
    return () => off(msgsRef);
  }, [rKey]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    try {
      const now = Date.now();
      // 메시지 저장
      await push(msgsRef, {
        senderId:       user.id,
        senderNickname: user.nickname,
        content:        text,
        createdAt:      now,
      });
      // 채팅방 메타 (대화목록용)
      const metaRef = ref(rtdb, `chats/${rKey}/meta`);
      await set(metaRef, {
        courseId, courseTitle,
        lastMessage: text,
        lastTime:    now,
        [`user_${user.id}`]:  user.nickname,
        [`user_${otherId}`]:  otherNickname,
      });
      // 각 유저 인덱스
      await update(ref(rtdb, `userRooms/${user.id}/${rKey}`), {
        courseId, courseTitle, otherId, otherNickname, lastTime: now,
      });
      await update(ref(rtdb, `userRooms/${otherId}/${rKey}`), {
        courseId, courseTitle,
        otherId:       user.id,
        otherNickname: user.nickname,
        lastTime:      now,
      });
    } catch (e) {
      console.warn('send error', e);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMine = item.senderId === user?.id;
    return (
      <View style={[s.bubbleWrap, isMine && s.bubbleWrapMine]}>
        <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
          {!isMine && <Text style={s.nick}>{item.senderNickname}</Text>}
          <Text style={[s.text, isMine && s.textMine]}>{item.content}</Text>
          <Text style={[s.time, isMine && s.timeMine]}>
            {new Date(item.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={20}>
          <Text style={s.back}>‹ 뒤로</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerName}>{otherNickname}</Text>
          <Text style={s.headerSub}>{courseTitle}</Text>
        </View>
        <View style={{ width: 50 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>첫 메시지를 보내보세요 👋</Text>
            </View>
          }
          renderItem={renderItem}
        />

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="메시지 입력..."
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnOff]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            <Text style={s.sendText}>전송</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#1A1A1E' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: spacing.xl, paddingVertical: 10,
                   backgroundColor: '#1A1A1E', borderBottomWidth: 1, borderBottomColor: '#3A3A3E' },
  back:          { fontSize: 16, color: colors.primary, width: 50 },
  headerCenter:  { alignItems: 'center' },
  headerName:    { fontSize: 15, fontWeight: '700', color: '#F2F2F7' },
  headerSub:     { fontSize: 11, color: '#8E8E93', marginTop: 1 },
  list:          { padding: 16, gap: 6, paddingBottom: 8 },
  empty:         { alignItems: 'center', paddingVertical: 60 },
  emptyText:     { fontSize: 14, color: '#8E8E93' },

  bubbleWrap:    { alignSelf: 'flex-start', maxWidth: '78%' },
  bubbleWrapMine:{ alignSelf: 'flex-end' },
  bubble:        { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine:    { backgroundColor: colors.primary },
  bubbleOther:   { backgroundColor: '#242428' },
  nick:          { fontSize: 11, fontWeight: '600', color: '#8E8E93', marginBottom: 3 },
  text:          { fontSize: 15, color: '#F2F2F7', lineHeight: 21 },
  textMine:      { color: '#fff' },
  time:          { fontSize: 10, color: '#B0A898', marginTop: 4, alignSelf: 'flex-end' },
  timeMine:      { color: 'rgba(255,255,255,0.65)' },

  inputRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8,
                   padding: 12, backgroundColor: '#1A1A1E',
                   borderTopWidth: 1, borderTopColor: '#3A3A3E' },
  input:         { flex: 1, backgroundColor: '#242428', borderWidth: 1, borderColor: '#3A3A3E',
                   borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
                   fontSize: 15, maxHeight: 100 },
  sendBtn:       { backgroundColor: colors.primary, borderRadius: 22,
                   paddingHorizontal: 18, paddingVertical: 10 },
  sendBtnOff:    { opacity: 0.4 },
  sendText:      { fontSize: 14, fontWeight: '700', color: '#fff' },
});
