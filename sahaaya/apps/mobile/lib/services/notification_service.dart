import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    tz.initializeTimeZones();
    tz.setLocalLocation(tz.getLocation('Asia/Kolkata'));

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    await _notifications.initialize(
      const InitializationSettings(android: androidSettings, iOS: iosSettings),
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Create notification channels
    await _createChannels();
    _initialized = true;
  }

  Future<void> _createChannels() async {
    const channel = AndroidNotificationChannel(
      'sahaaya_checkins',
      'Check-in Reminders',
      description: 'Periodic mental health check-in reminders',
      importance: Importance.high,
      playSound: true,
    );

    const alertChannel = AndroidNotificationChannel(
      'sahaaya_alerts',
      'Distress Alerts',
      description: 'High-risk distress alerts for officers',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
    );

    await _notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    await _notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(alertChannel);
  }

  void _onNotificationTap(NotificationResponse response) {
    // Handle notification tap - navigate to relevant screen
    // This would integrate with your navigation system
  }

  // Check-in reminders
  Future<void> scheduleCheckInReminder({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledTime,
    String? payload,
  }) async {
    await _notifications.zonedSchedule(
      id,
      title,
      body,
      tz.TZDateTime.from(scheduledTime, tz.local),
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'sahaaya_checkins',
          'Check-in Reminders',
          channelDescription: 'Periodic mental health check-in reminders',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
      payload: payload,
    );
  }

  Future<void> cancelCheckInReminder(int id) async {
    await _notifications.cancel(id);
  }

  Future<void> cancelAllCheckInReminders() async {
    await _notifications.cancelAll();
  }

  // High-risk alerts for officers
  Future<void> showDistressAlert({
    required int id,
    required String victimId,
    required double score,
    required String band,
  }) async {
    final color = _getBandColor(band);
    
    await _notifications.show(
      id,
      'SAHAAYA Alert: $band Band',
      'Victim $victimId - Distress Score: ${score.toStringAsFixed(1)} ($band)',
      NotificationDetails(
        android: AndroidNotificationDetails(
          'sahaaya_alerts',
          'Distress Alerts',
          channelDescription: 'High-risk distress alerts for officers',
          importance: Importance.max,
          priority: Priority.max,
          icon: '@mipmap/ic_launcher',
          color: color,
          enableVibration: true,
          vibrationPattern: Int64List.fromList([0, 500, 200, 500]),
          category: AndroidNotificationCategory.alarm,
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
          sound: 'default',
          interruptionLevel: InterruptionLevel.critical,
        ),
      ),
      payload: 'alert:$victimId',
    );
  }

  Color _getBandColor(String band) {
    switch (band) {
      case 'Red': return const Color(0xFFD9534F);
      case 'Orange': return const Color(0xFFE8703D);
      case 'Yellow': return const Color(0xFFE8A23D);
      case 'Green': return const Color(0xFF4E9E6B);
      default: return const Color(0xFF3E7C59);
    }
  }

  // Instant notification
  Future<void> showInstantNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    await _notifications.show(
      id,
      title,
      body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'sayaaya_general',
          'General Notifications',
          importance: Importance.defaultImportance,
          priority: Priority.defaultPriority,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      payload: payload,
    );
  }

  Future<void> cancelNotification(int id) async {
    await _notifications.cancel(id);
  }
}