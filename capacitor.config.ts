import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chat.multimodal',
  appName: 'ChatMultimodal',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  server: {
    cleartext: true,
    allowNavigation: ['localhost', '127.0.0.1'],
  },
};

export default config;
