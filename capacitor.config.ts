import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.lauapp',
  appName: 'LaU',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    // StatusBar: {
    //   overlaysWebView: true,
    //   backgroundColor: '#00000000',
    // }
  }
};

export default config;
