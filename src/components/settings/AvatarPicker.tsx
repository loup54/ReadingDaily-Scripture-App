/**
 * Avatar Picker Component
 * Phase 10C.6: Avatar Selection
 *
 * Allows user to select or upload avatar:
 * - Choose from device gallery
 * - Take photo
 * - Choose default avatar
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';

interface AvatarPickerProps {
  visible: boolean;
  onAvatarSelected: (avatarUri: string) => void;
  onCancel: () => void;
}

/**
 * Default avatar options
 */
const DEFAULT_AVATARS = [
  { id: 'avatar-1', emoji: '👤', label: 'Default' },
  { id: 'avatar-2', emoji: '😊', label: 'Smile' },
  { id: 'avatar-3', emoji: '🎓', label: 'Student' },
  { id: 'avatar-4', emoji: '⭐', label: 'Star' },
  { id: 'avatar-5', emoji: '🌟', label: 'Shiny' },
  { id: 'avatar-6', emoji: '🎯', label: 'Goal' },
  { id: 'avatar-7', emoji: '🏆', label: 'Champion' },
  { id: 'avatar-8', emoji: '🚀', label: 'Rocket' },
];

const AvatarPicker: React.FC<AvatarPickerProps> = ({ visible, onAvatarSelected, onCancel }) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const handleSelectAvatar = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      // For now, return the avatar ID
      // In real implementation, would convert to image URI
      onAvatarSelected(selectedAvatar);
      setSelectedAvatar(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Avatar</Text>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar Grid */}
          <ScrollView style={styles.scrollView}>
            <View style={styles.grid}>
              {DEFAULT_AVATARS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarItem,
                    selectedAvatar === avatar.id && styles.avatarItemSelected,
                  ]}
                  onPress={() => handleSelectAvatar(avatar.id)}
                >
                  <View
                    style={[
                      styles.avatarCircle,
                      selectedAvatar === avatar.id && styles.avatarCircleSelected,
                    ]}
                  >
                    <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                  </View>
                  <Text style={styles.avatarLabel}>{avatar.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Upload Option */}
            <TouchableOpacity style={styles.uploadOption}>
              <Text style={styles.uploadIcon}>📸</Text>
              <Text style={styles.uploadLabel}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadOption}>
              <Text style={styles.uploadIcon}>🖼️</Text>
              <Text style={styles.uploadLabel}>Choose from Gallery</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedAvatar && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedAvatar}
            >
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
    maxHeight: '80%',
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
  scrollView: {
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 16,
    justifyContent: 'space-around',
  },
  avatarItem: {
    width: '25%',
    alignItems: 'center',
    marginVertical: 8,
  },
  avatarItemSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCircleSelected: {
    backgroundColor: '#007AFF',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  avatarLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  uploadOption: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  uploadLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
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
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AvatarPicker;
