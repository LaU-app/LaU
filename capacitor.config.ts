import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'io.ionic.lauapp',
  appName: 'LaU',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['api.lauapp.es']
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: KeyboardResize.Ionic,
      resizeOnFullScreen: true
    }
    // StatusBar: {
    //   overlaysWebView: true,
    //   backgroundColor: '#00000000',
    // }
  }
};

export default config;
