import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '../firebase';
import { useAuth } from '../api/auth';
import { colors, spacing } from '../theme';

export default function ChatScreen({ navigation }) {
  const { user } = useAuth();
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const userRoomsRef = ref(rtdb, `userRooms/${user.id}`);

    const unsub = onValue(userRoomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.entries(data)
          .map(([roomKey, meta]) => ({ roomKey, ...meta }))
          .sort((a, b) => (b.lastTime || 0) - (a.lastTime || 0));
        setRooms(arr);
      } else {
        setRooms([]);
      }
      setLoading(false);
    });

    return () => off(userRoomsRef);
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}><Text style={s.title}>채팅</Text></View>
        <View style={s.center}><ActivityIndicator color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>채팅</Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={r => r.roomKey}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>💬</Text>
            <Text style={s.emptyTitle}>아직 대화가 없어요</Text>
            <Text style={s.emptyDesc}>구매한 코스에서 판매자에게{'\n'}메시지를 보내보세요</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.room}
            onPress={() => navigation.navigate('ChatRoom', {
              courseId:      item.courseId,
              courseTitle:   item.courseTitle,
              otherId:       item.otherId,
              otherNickname: item.otherNickname,
            })}
          >
            <View style={s.avatar}>
              <Text style={s.avatarText}>{item.otherNickname?.[0] || '?'}</Text>
            </View>
            <View style={s.info}>
              <View style={s.row}>
                <Text style={s.name}>{item.otherNickname}</Text>
                <Text style={s.time}>
                  {item.lastTime
                    ? new Date(item.lastTime).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                    : ''}
                </Text>
              </View>
              <Text style={s.course} numberOfLines={1}>{item.courseTitle}</Text>
              <Text style={s.last} numberOfLines={1}>{item.lastMessage || ''}</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={s.sep} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1E' },
  header:    { paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
               borderBottomWidth: 1, borderBottomColor: '#3A3A3E' },
  title:     { fontSize: 18, fontWeight: '700', color: '#F2F2F7' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:      { paddingBottom: 20 },
  room:      { flexDirection: 'row', alignItems: 'center', gap: 12,
               paddingHorizontal: spacing.xl, paddingVertical: 14 },
  avatar:    { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary,
               alignItems: 'center', justifyContent: 'center' },
  avatarText:{ fontSize: 20, fontWeight: '700', color: '#fff' },
  info:      { flex: 1 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:      { fontSize: 15, fontWeight: '700', color: '#F2F2F7' },
  time:      { fontSize: 11, color: '#B0A898' },
  course:    { fontSize: 11, color: colors.primary, marginTop: 2 },
  last:      { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  sep:       { height: 1, backgroundColor: '#242428', marginLeft: 72 },
  empty:     { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle:{ fontSize: 17, fontWeight: '700', color: '#F2F2F7' },
  emptyDesc: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 22 },
});
