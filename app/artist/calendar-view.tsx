import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function ArtistCalendarScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { artistId } = useLocalSearchParams();
  const [events, setEvents] = useState<{ [date: string]: Array<{ id: string; title: string }> }>({});
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArtistCalendarEvents();
  }, [artistId]);

  const fetchArtistCalendarEvents = async () => {
    if (!artistId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('Calender')
      .select('id, title, date')
      .eq('user_id', artistId);
    setLoading(false);
    if (error) {
      return;
    }
    const eventsByDate: { [date: string]: Array<{ id: string; title: string }> } = {};
    data.forEach(ev => {
      if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
      eventsByDate[ev.date].push({ id: ev.id, title: ev.title });
    });
    setEvents(eventsByDate);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#fff' }]}>  
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#fff' : '#333' }]}>Artist Calendar</Text>
      </View>
      <Calendar
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
        markedDates={{
          ...Object.keys(events).reduce((acc, date) => {
            acc[date] = { marked: true, dotColor: '#0066ff' };
            return acc;
          }, {} as any),
          ...(selectedDate ? { [selectedDate]: { selected: true, selectedColor: '#0066ff' } } : {})
        }}
        style={{ marginBottom: 16 }}
        theme={{
          calendarBackground: theme === 'dark' ? '#000' : '#fff',
          dayTextColor: theme === 'dark' ? '#fff' : '#222',
          monthTextColor: theme === 'dark' ? '#fff' : '#222',
          arrowColor: '#0066ff',
        }}
      />
      {selectedDate ? (
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: theme === 'dark' ? '#fff' : '#222' }}>
            Events on {selectedDate}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color="#0066ff" />
          ) : (
            <FlatList
              data={events[selectedDate] || []}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ flex: 1, color: theme === 'dark' ? '#fff' : '#222' }}>{item.title}</Text>
                </View>
              )}
            />
          )}
        </View>
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 20, color: theme === 'dark' ? '#fff' : '#222' }}>
          Select a date to view events.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});
