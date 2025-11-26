/**
 * Time Picker Component
 * Phase 10C.6: Reminder Time Selection
 *
 * Allows user to select reminder time:
 * - Hour selection (0-23)
 * - Minute selection (0-59)
 * - AM/PM or 24-hour format
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';

interface TimePickerProps {
  visible: boolean;
  initialTime?: string; // Format: "HH:MM"
  onTimeSelected: (time: string) => void;
  onCancel: () => void;
}

const TimePicker: React.FC<TimePickerProps> = ({
  visible,
  initialTime = '08:00',
  onTimeSelected,
  onCancel,
}) => {
  const [hour, setHour] = useState(
    parseInt(initialTime.split(':')[0], 10) || 8
  );
  const [minute, setMinute] = useState(
    parseInt(initialTime.split(':')[1], 10) || 0
  );

  // Generate hour options
  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      label: String(i).padStart(2, '0'),
      value: i,
    }));
  }, []);

  // Generate minute options
  const minutes = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      label: String(i).padStart(2, '0'),
      value: i,
    }));
  }, []);

  const handleConfirm = () => {
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onTimeSelected(timeString);
  };

  const getAmPmLabel = (): string => {
    return hour >= 12 ? 'PM' : 'AM';
  };

  const getDisplayHour = (): string => {
    const h = hour % 12 || 12;
    return String(h).padStart(2, '0');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Time</Text>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Time Display */}
          <View style={styles.displayContainer}>
            <Text style={styles.displayTime}>
              {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
            </Text>
            <Text style={styles.ampmText}>{getAmPmLabel()}</Text>
          </View>

          {/* Picker Sections */}
          <View style={styles.pickerContainer}>
            {/* Hours */}
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <ScrollView
                style={styles.picker}
                scrollEventThrottle={16}
              >
                {hours.map((h) => (
                  <TouchableOpacity
                    key={h.value}
                    style={[
                      styles.pickerItem,
                      hour === h.value && styles.pickerItemSelected,
                    ]}
                    onPress={() => setHour(h.value)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        hour === h.value && styles.pickerItemTextSelected,
                      ]}
                    >
                      {h.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Colon Separator */}
            <View style={styles.separator}>
              <Text style={styles.separatorText}>:</Text>
            </View>

            {/* Minutes */}
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Minute</Text>
              <ScrollView
                style={styles.picker}
                scrollEventThrottle={16}
              >
                {minutes.map((m) => (
                  <TouchableOpacity
                    key={m.value}
                    style={[
                      styles.pickerItem,
                      minute === m.value && styles.pickerItemSelected,
                    ]}
                    onPress={() => setMinute(m.value)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        minute === m.value && styles.pickerItemTextSelected,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Quick Select */}
          <View style={styles.quickSelect}>
            {[
              { label: '08:00 AM', hour: 8, minute: 0 },
              { label: '12:00 PM', hour: 12, minute: 0 },
              { label: '06:00 PM', hour: 18, minute: 0 },
              { label: '09:00 PM', hour: 21, minute: 0 },
            ].map((quick) => (
              <TouchableOpacity
                key={quick.label}
                style={styles.quickButton}
                onPress={() => {
                  setHour(quick.hour);
                  setMinute(quick.minute);
                }}
              >
                <Text style={styles.quickButtonText}>{quick.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
  },
  displayContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  displayTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  ampmText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pickerSection: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  picker: {
    height: 150,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#E6F0FF',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#666',
  },
  pickerItemTextSelected: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  separator: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  separatorText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  quickSelect: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  quickButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginVertical: 4,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
  },
  buttons: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TimePicker;
