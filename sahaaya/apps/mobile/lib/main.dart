import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme/app_theme.dart';
import 'screens/splash_screen.dart';
import 'screens/onboarding/language_selection_screen.dart';
import 'screens/onboarding/consent_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/checkin/checkin_screen.dart';
import 'screens/chatbot/chatbot_screen.dart';
import 'screens/voice/voice_screen.dart';
import 'screens/distress/distress_trend_screen.dart';
import 'screens/support/support_request_screen.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize services
  await NotificationService().initialize();
  
  runApp(const SAHAAYAApp());
}

class SAHAAYAApp extends StatelessWidget {
  const SAHAAYAApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => ApiService()),
      ],
      child: MaterialApp(
        title: 'SAHAAYA',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.light,
        initialRoute: '/',
        routes: {
          '/': (context) => const SplashScreen(),
          '/language': (context) => const LanguageSelectionScreen(),
          '/consent': (context) => const ConsentScreen(),
          '/login': (context) => const LoginScreen(),
          '/home': (context) => const HomeScreen(),
          '/checkin': (context) => const CheckInScreen(),
          '/chatbot': (context) => const ChatbotScreen(),
          '/voice': (context) => const VoiceScreen(),
          '/distress': (context) => const DistressTrendScreen(),
          '/support': (context) => const SupportRequestScreen(),
        },
      ),
    );
  }
}