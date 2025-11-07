import { ThemedView } from '@/components/themed-view';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_URL = 'http://10.22.51.5:8000/transcribe';

export default function HomeScreen() {
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResponse, setUploadResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setUploadResponse(null);
        setError(null);
      }
    } catch (error) {
      console.error('Dosya seçme hatası:', error);
    }
  };

  const uploadToBackend = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      const fileToUpload: any = {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'audio/mpeg',
        name: selectedFile.name,
      };

      formData.append('audio', fileToUpload);
      console.log(API_URL)
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResponse(data);
        setUploadProgress(100);
        console.log('Transkripsiyon sonucu:', uploadResponse);
      } else {
        throw new Error(data.message || 'Yükleme başarısız');
      }
    } catch (error: any) {
      setError(error.message || 'Dosya yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (uploading && uploadProgress < 90) {
      const randomInterval = Math.random() * 800 + 200;

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return 90;

          const randomIncrement = Math.random() * 2.5 + 0.5;

          return Math.min(prev + randomIncrement, 90);
        });
      }, randomInterval);

      return () => clearInterval(interval);
    }
  }, [uploading, uploadProgress]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🎙️</Text>
          </View>
          <Text style={styles.title}>STT Demo</Text>
          <Text style={styles.subtitle}>
            Sesden metne dönüştürme
          </Text>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {!selectedFile ? (
            // Empty State - Upload Area
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={pickAudioFile}
              activeOpacity={0.9}
              disabled={uploading}
            >
              <View style={styles.uploadIcon}>
                <Text style={styles.uploadIconText}>📁</Text>
              </View>
              <Text style={styles.uploadTitle}>Dosya Seç</Text>
              <Text style={styles.uploadHint}>
                MP3 dosyası yükleyin
              </Text>
            </TouchableOpacity>
          ) : (
            // File Selected
            <View>
              {/* File Card */}
              <View style={styles.fileCard}>
                <View style={styles.fileIconCircle}>
                  <Text style={styles.fileIconText}>🎵</Text>
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={2} ellipsizeMode="middle">
                    {selectedFile.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {(selectedFile.size! / (1024 * 1024)).toFixed(2)} MB
                  </Text>
                </View>
              </View>

              {/* Change File Button - Separate Row */}
              <TouchableOpacity onPress={pickAudioFile} style={styles.changeBtn}>
                <Text style={styles.changeBtnText}>Farklı Dosya Seç</Text>
              </TouchableOpacity>

              {/* Process Button */}
              <TouchableOpacity
                style={[styles.processButton, uploading && styles.processButtonDisabled]}
                onPress={uploadToBackend}
                activeOpacity={0.9}
                disabled={uploading}
              >
                <LinearGradient
                  colors={uploading ? ['#95a5a6', '#7f8c8d'] : ['#6366f1', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtn}
                >
                  {uploading ? (
                    <View style={styles.btnContent}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.btnText}>İşleniyor...</Text>
                    </View>
                  ) : (
                    <Text style={styles.btnText}>Gönder</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Progress */}
              {uploading && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Result - sadece upload tamamlandıysa göster */}
        {!uploading && uploadResponse && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>✨</Text>
              <Text style={styles.resultTitle}>Transkripsiyon Sonucu</Text>
            </View>

            {uploadResponse && (
              <View style={styles.transcriptionBox}>
                <Text style={styles.transcriptionText}>{uploadResponse}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '400',
  },

  // Main Card
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // Upload Area (Empty State)
  uploadArea: {
    alignItems: 'center',
    paddingVertical: 48,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  uploadIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadIconText: {
    fontSize: 36,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 14,
    color: '#9ca3af',
  },

  // File Card
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fileIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  fileIconText: {
    fontSize: 24,
  },
  fileInfo: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  fileSize: {
    fontSize: 13,
    color: '#6b7280',
  },
  changeBtn: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    marginBottom: 16,
  },
  changeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },

  // Process Button
  processButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  processButtonDisabled: {
    opacity: 0.7,
  },
  gradientBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Progress
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Error Card
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  errorIcon: {
    fontSize: 24,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },

  // Result Card
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  resultIcon: {
    fontSize: 24,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  transcriptionBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transcriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  transcriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
  metaContainer: {
    gap: 8,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
});
