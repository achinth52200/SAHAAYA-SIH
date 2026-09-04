import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../theme/app_theme.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../services/notification_service.dart';
import '../../widgets/mood_selector.dart';
import '../../widgets/distress_score_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  Map<String, dynamic>? _distressData;
  bool _loading = true;
  Timer? _supportTimer;
  final Set<String> _notifiedSupportRequests = {};

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
    _controller.forward();
    _loadData();
    final auth = context.read<AuthService>();
    if (auth.userRole != 'victim') {
      _supportTimer = Timer.periodic(const Duration(seconds: 5), (_) => _pollSupportRequests());
    }
  }

  Future<void> _pollSupportRequests() async {
    final api = context.read<ApiService>();
    try {
      final requests = await api.getSupportRequests();
      for (final raw in requests) {
        if (raw is! Map<String, dynamic>) continue;
        final id = raw['id']?.toString();
        if (id == null || !_notifiedSupportRequests.add(id)) continue;
        await NotificationService().showInstantNotification(
          id: id.hashCode,
          title: 'SAHAAYA support request',
          body: '${raw['request_type'] ?? 'Support'} request from ${raw['victim_id'] ?? 'victim'}',
          payload: 'support:$id',
        );
      }
    } catch (error) {
      debugPrint('Support notification poll failed: $error');
    }
  }

  Future<void> _loadData() async {
    final auth = context.read<AuthService>();
    final api = context.read<ApiService>();
    try {
      final data = await api.getVictimDistress(auth.userId ?? 'VICTIM_0001');
      if (mounted) {
        setState(() {
          _distressData = data;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _supportTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  Color _getBandColor(String band) {
    switch (band) {
      case 'Green': return AppTheme.distressGreen;
      case 'Yellow': return AppTheme.distressYellow;
      case 'Orange': return AppTheme.distressOrange;
      case 'Red': return AppTheme.distressRed;
      default: return AppTheme.primary500;
    }
  }

  String _getBandLabel(String band) {
    switch (band) {
      case 'Green': return 'Stable';
      case 'Yellow': return 'Mild Concern';
      case 'Orange': return 'Significant Concern';
      case 'Red': return 'Urgent Review';
      default: return 'Unknown';
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final userName = auth.userName?.split(' ').first ?? 'there';
    final band = _distressData?['band'] ?? 'Green';
    final score = _distressData?['distress_score']?.toDouble() ?? 0.0;
    final trend = _distressData?['trend_direction'] ?? 'stable';
    final escalation7d = (_distressData?['escalation_probability_7d'] ?? 0.0) * 100;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: CustomScrollView(
              slivers: [
                // App bar
                SliverAppBar(
                  floating: true,
                  pinned: false,
                  backgroundColor: AppTheme.background,
                  surfaceTintColor: Colors.transparent,
                  elevation: 0,
                  title: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Good morning, $userName',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        'How are you feeling today?',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  actions: [
                    IconButton(
                      onPressed: () => context.go('/distress'),
                      icon: const Icon(Icons.show_chart_outlined),
                      tooltip: 'View Distress Trend',
                    ),
                    IconButton(
                      onPressed: () => context.go('/support'),
                      icon: const Icon(Icons.help_outline),
                      tooltip: 'Request Support',
                    ),
                  ],
                ),
                
                // Content
                SliverPadding(
                  padding: const EdgeInsets.all(20),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      // Distress Score Card
                      if (!_loading)
                        DistressScoreCard(
                          score: score,
                          band: band,
                          bandLabel: _getBandLabel(band),
                          bandColor: _getBandColor(band),
                          trend: trend,
                          escalation7d: escalation7d.toInt(),
                          onTap: () => context.go('/distress'),
                        )
                      else
                        const DistressScoreCardSkeleton(),
                      
                      const SizedBox(height: 24),
                      
                      // Quick Actions
                      Text(
                        'Quick Actions',
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Action cards
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 16,
                        crossAxisSpacing: 16,
                        childAspectRatio: 1.1,
                        children: [
                          _ActionCard(
                            icon: Icons.favorite_outline,
                            label: 'Check-in',
                            color: AppTheme.primary500,
                            onTap: () => context.go('/checkin'),
                          ),
                          _ActionCard(
                            icon: Icons.chat_bubble_outline,
                            label: 'Chat',
                            color: AppTheme.primary400,
                            onTap: () => context.go('/chatbot'),
                          ),
                          _ActionCard(
                            icon: Icons.mic_outlined,
                            label: 'Voice',
                            color: AppTheme.distressOrange,
                            onTap: () => context.go('/voice'),
                          ),
                          _ActionCard(
                            icon: Icons.help_outline,
                            label: 'Support',
                            color: AppTheme.distressRed,
                            onTap: () => context.go('/support'),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // Mood check-in prompt
                      if (!_loading) ...[
                        Text(
                          'How are you feeling?',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 16),
                        MoodSelector(
                          onMoodSelected: (mood) {
                            // Navigate to check-in with pre-selected mood
                            context.go('/checkin', extra: {'preSelectedMood': mood});
                          },
                        ),
                      ],
                      
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(icon, size: 32, color: color),
              ),
              const SizedBox(height: 16),
              Text(
                label,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class DistressScoreCardSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _SkeletonLine(width: 120, height: 24),
                _SkeletonLine(width: 100, height: 28),
              ],
            ),
            const SizedBox(height: 24),
            _SkeletonLine(width: 100, height: 56),
            const SizedBox(height: 16),
            _SkeletonLine(width: 200, height: 16),
          ],
        ),
      ),
    );
  }
}

class _SkeletonLine extends StatelessWidget {
  final double width;
  final double height;
  const _SkeletonLine({required this.width, required this.height});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppTheme.secondary100,
        borderRadius: BorderRadius.circular(8),
      ),
    );
  }
}