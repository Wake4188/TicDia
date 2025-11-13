
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ff05b035758e45e58a671f3948ce55f7',
  appName: 'TicDia',
  webDir: 'dist',
  server: {
    url: 'https://ff05b035-758e-45e5-8a67-1f3948ce55f7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false
    }
  }
};

export default config;
