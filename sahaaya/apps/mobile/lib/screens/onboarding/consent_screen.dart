import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../theme/app_theme.dart';
import '../../services/auth_service.dart';

class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key});

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  final List<bool> _consents = [false, false, false, false];
  bool _allConsented = false;

  final List<Map<String, String>> _consentItems = [
    {
      'title': 'Personal Check-in Data',
      'description': 'We collect your mood, anxiety, sleep, safety, hopelessness, and isolation scores through periodic check-ins to calculate your distress level.',
      'required': true,
    },
    {
      'title': 'Text & Chatbot Analysis',
      'description': 'With your consent, we analyze emotions (fear, anger, hopelessness, threat) in your chatbot messages to detect distress signals.',
      'required': false,
    },
    {
      'title': 'Behavioural Patterns',
      'description': 'We track engagement patterns like missed check-ins, cancelled appointments, and response timing to identify withdrawal.',
      'required': false,
    },
    {
      'title': 'Voice Analysis (Optional)',
      'description': 'If you choose to use voice check-ins, we analyze acoustic features (pitch, energy, speaking rate) as a supporting signal only.',
      'required': false,
    },
  ];

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
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _updateConsent(int index, bool value) {
    setState(() {
      _consents[index] = value;
      _allConsented = _consents[0]; // Only first (required) consent is mandatory
      // In reality, all should be reviewed
      _allConsented = _consents.every((c) => c);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Back button
                  IconButton(
                    onPressed: () => context.go('/language'),
                    icon: const Icon(Icons.arrow_back_ios_new),
                    color: AppTheme.textPrimary,
                  ),
                  
                  // Progress indicator
                  LinearProgressIndicator(
                    value: 2 / 3,
                    backgroundColor: AppTheme.primary100,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary500),
                    minHeight: 4,
                    borderRadius: BorderRadius.circular(2),
                  ),
                  
                  const SizedBox(height: 40),
                  
                  // Header
                  Text(
                    'Consent & Privacy',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'We respect your privacy. Please review and consent to each item below.',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Consent items
                  Expanded(
                    child: ListView.separated(
                      itemCount: _consentItems.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final item = _consentItems[index];
                        final isRequired = item['required'] == 'true';
                        return Card(
                          padding: EdgeInsets.zero,
                          child: Padding(
                            padding: const EdgeInsets.all(20.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                item['title']!,
                                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                              if (isRequired) ...[
                                                const SizedBox(width: 8),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: AppTheme.distressRed.withOpacity(0.1),
                                                    borderRadius: BorderRadius.circular(999),
                                                  ),
                                                  child: Text(
                                                    'Required',
                                                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                                      color: AppTheme.distressRed,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            item['description']!,
                                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                              color: AppTheme.textSecondary,
                                              height: 1.6,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Checkbox(
                                      value: _consents[index],
                                      onChanged: (value) => _updateConsent(index, value ?? false),
                                      activeColor: AppTheme.primary500,
                                      checkColor: Colors.white,
                                      side: BorderSide(
                                        color: isRequired ? AppTheme.distressRed : AppTheme.border,
                                        width: 2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                      },
                    ),
                  ),
                  
                  // Key privacy notes
                  Card(
                    color: AppTheme.primary50,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.shield_outlined, color: AppTheme.primary500, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                'Your Rights',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.primary700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ...[
                            'You can withdraw consent at any time in Settings',
                            'No real victim data — this is a prototype with synthetic data',
                            'AI never diagnoses, prescribes, or triggers interventions without human review',
                            'All data is encrypted in transit and at rest',
                            'Audit logs track every access to your data',
                          ].map((note) => Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('• ', style: TextStyle(color: AppTheme.primary500)),
                                Expanded(
                                  child: Text(
                                    note,
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          )),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Continue button
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _allConsented ? () {
                        context.read<AuthService>().completeOnboarding();
                        context.read<AuthService>().updateProfile({
                          'consents': {
                            'checkin': _consents[0],
                            'text_analysis': _consents[1],
                            'behavioural': _consents[2],
                            'voice': _consents[3],
                          },
                          'consent_date': DateTime.now().toIso8601String(),
                        });
                        context.go('/login');
                      } : null,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: const Text('I Consent & Continue'),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}