import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/context/ThemeContext';
import { router, Stack } from 'expo-router';

export default function CalendarScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [events, setEvents] = useState<{ [date: string]: Array<{ id: string; title: string }> }>({});
  const [selectedDate, setSelectedDate] = useState('');
  const [eventInput, setEventInput] = useState('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCalendarEvents = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('Calender')
      .select('id, title, date')
      .eq('user_id', user.id);
    setLoading(false);
    if (error) {
      Alert.alert('Error', 'Failed to fetch events');
      return;
    }
    const eventsByDate: { [date: string]: Array<{ id: string; title: string }> } = {};
    data.forEach(ev => {
      if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
      eventsByDate[ev.date].push({ id: ev.id, title: ev.title });
    });
    setEvents(eventsByDate);
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, [user]);

  const handleAddOrEditEvent = async () => {
    if (!selectedDate || !eventInput.trim() || !user) return;
    setLoading(true);
    if (editingEventId) {
      // Edit event
      const { error } = await supabase
        .from('Calender')
        .update({ title: eventInput })
        .eq('id', editingEventId)
        .eq('user_id', user.id);
      setLoading(false);
      if (error) {
        Alert.alert('Error', 'Failed to update event');
        return;
      }
    } else {
      // Add event
      const { error } = await supabase
        .from('Calender')
        .insert([{ user_id: user.id, title: eventInput, date: selectedDate }]);
      setLoading(false);
      if (error) {
        Alert.alert('Error', 'Failed to add event');
        return;
      }
    }
    setEventInput('');
    setEditingEventId(null);
    fetchCalendarEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('Calender')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id);
    setLoading(false);
    if (error) {
      Alert.alert('Error', 'Failed to delete event');
      return;
    }
    setEventInput('');
    setEditingEventId(null);
    fetchCalendarEvents();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#fff' }]}>  
    <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#fff' : '#333' }]}>My Calendar</Text>
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
                  <TouchableOpacity onPress={() => {
                    setEventInput(item.title);
                    setEditingEventId(item.id);
                  }}>
                    <Ionicons name="create-outline" size={20} color="#0066ff" style={{ marginRight: 12 }} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteEvent(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 8,
                marginRight: 8,
                color: theme === 'dark' ? '#fff' : '#222',
                backgroundColor: theme === 'dark' ? '#222' : '#fff',
              }}
              placeholder="Add or edit event"
              placeholderTextColor={theme === 'dark' ? '#aaa' : '#888'}
              value={eventInput}
              onChangeText={setEventInput}
            />
            <TouchableOpacity
              style={{
                backgroundColor: '#0066ff',
                padding: 10,
                borderRadius: 8,
              }}
              onPress={handleAddOrEditEvent}
              disabled={loading}
            >
              <Ionicons name={editingEventId ? "checkmark-outline" : "add-outline"} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 20, color: theme === 'dark' ? '#fff' : '#222' }}>Select a date to view or add events.</Text>
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
