import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

const OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
];

export default function RestTimer({ onSetComplete }) {
  const [duration, setDuration] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback((seconds) => {
    clearTimer();
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  // Expose a trigger function so parent can start the timer after a set is completed
  useEffect(() => {
    if (onSetComplete) {
      onSetComplete.current = () => {
        if (duration > 0) startCountdown(duration);
      };
    }
  }, [duration, onSetComplete, startCountdown]);

  const handleSelectDuration = (value) => {
    setDuration(value);
    setExpanded(false);
    clearTimer();
    setRemaining(0);
  };

  const handleSkip = () => {
    clearTimer();
    setRemaining(0);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const isActive = remaining > 0;

  return (
    <View>
      {/* Stopwatch icon button — always visible in title row */}
      <Pressable
        style={[styles.iconBtn, isActive && styles.iconBtnActive]}
        onPress={() => setExpanded(e => !e)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isActive ? (
          <Text style={styles.countdownText}>{formatTime(remaining)}</Text>
        ) : (
          <Ionicons
            name="timer-outline"
            size={20}
            color={duration > 0 ? colors.primary : '#555'}
          />
        )}
      </Pressable>

      {/* Inline skip bar when counting down */}
      {isActive && (
        <View style={styles.skipRow}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((duration - remaining) / duration) * 100}%` },
              ]}
            />
          </View>
          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </Pressable>
        </View>
      )}

      {/* Expanded duration picker */}
      {expanded && (
        <View style={styles.picker}>
          <Text style={styles.pickerLabel}>Rest Timer</Text>
          <View style={styles.optionsRow}>
            {OPTIONS.map(opt => (
              <Pressable
                key={opt.value}
                style={[styles.chip, duration === opt.value && styles.chipActive]}
                onPress={() => handleSelectDuration(opt.value)}
              >
                <Text style={[styles.chipText, duration === opt.value && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: `${colors.primary}22`,
    borderWidth: 1,
    borderColor: `${colors.primary}66`,
    width: 56,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  skipBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  picker: {
    marginTop: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  pickerLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
});
