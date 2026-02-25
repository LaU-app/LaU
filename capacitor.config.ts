import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.lauapp',
  appName: 'LaU',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['api.sivarsocial.com']
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    CapacitorHttp: {
      enabled: true,
    }
    // StatusBar: {
    //   overlaysWebView: true,
    //   backgroundColor: '#00000000',
    // }
  }
};

export default config;
