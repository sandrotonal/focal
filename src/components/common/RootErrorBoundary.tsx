import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
}

export class RootErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    resetKey: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) {
      console.error('[RootErrorBoundary] Application crash caught:', error?.message, errorInfo?.componentStack);
    }

    try {
      const errorPayload = JSON.stringify({
        message: error?.message || 'Unknown error',
        stack: error?.stack || null,
        componentStack: errorInfo?.componentStack || null,
        timestamp: new Date().toISOString(),
      });
      void AsyncStorage.setItem('focal.last-error', errorPayload).catch(() => {});
    } catch {
      // Storage write failure should never crash the error boundary
    }
  }

  private handleReset = async (): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Updates = require('expo-updates') as typeof import('expo-updates');
      if (typeof Updates?.reloadAsync === 'function' && !__DEV__) {
        await Updates.reloadAsync();
        return;
      }
    } catch {
      // Fallback to key-based clean component remount
    }

    this.setState((prev) => ({
      hasError: false,
      error: null,
      resetKey: prev.resetKey + 1,
    }));
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View
          style={styles.container}
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.indicator} />
              <Text style={styles.tag}>SYSTEM RECOVERY</Text>
            </View>

            <Text style={styles.title}>Beklenmeyen bir durum oluştu</Text>
            <Text style={styles.subtitle}>
              Uygulama güvenli kurtarma moduna alındı. Verileriniz kalıcı hafızada korunmaktadır.
            </Text>

            {__DEV__ && this.state.error?.message && (
              <View style={styles.devBox}>
                <Text style={styles.devText} numberOfLines={3}>
                  {this.state.error.message}
                </Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Uygulamayı yeniden başlat"
              onPress={this.handleReset}
              hitSlop={12}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>YENİDEN BAŞLAT</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111215',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#17191E',
    borderColor: '#272930',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0533C',
  },
  tag: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#747681',
  },
  title: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F5F7',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'System',
    fontSize: 13,
    lineHeight: 18,
    color: '#8C8E99',
    marginBottom: 20,
  },
  devBox: {
    backgroundColor: '#111215',
    borderColor: '#272930',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 18,
  },
  devText: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: '#E0533C',
  },
  button: {
    height: 44,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#111215',
  },
});
