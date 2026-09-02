import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../theme/app_theme.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';
import '../../widgets/mood_selector.dart';
import '../../widgets/radial_distress_gauge.dart';

class CheckInScreen extends StatefulWidget {
  final String? preSelectedMood;

  const CheckInScreen({super.key, this.preSelectedMood});

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  int _currentStep = 0;
  final int _totalSteps = 6;

  // Form data
  String? _selectedMood;
  double _anxiety = 50;
  double _sleep = 50;
  double _safety = 50;
  double _hopelessness = 50;
  double _isolation = 50;
  bool _urgentHelp = false;

  final List<Map<String, dynamic>> _steps = [
    {'id': 'mood', 'title': 'Overall Mood', 'icon': Icons.sentiment_satisfied_outlined},
    {'id': 'anxiety', 'title': 'Anxiety / Stress', 'icon': Icons.psychology_outlined},
    {'id': 'sleep', 'title': 'Sleep Quality', 'icon': Icons.bedtime_outlined},
    {'id': 'safety', 'title': 'Feeling Safe', 'icon': Icons.shield_outlined},
    {'id': 'hopelessness', 'title': 'Hopelessness', 'icon': Icons.cloud_outlined},
    {'id': 'isolation', 'title': 'Isolation', 'icon': Icons.person_outline_outlined},
  ];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
    _controller.forward();

    if (widget.preSelectedMood != null) {
      _selectedMood = widget.preSelectedMood;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep < _totalSteps - 1) {
      setState(() => _currentStep++);
    } else {
      _submitCheckIn();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  Future<void> _submitCheckIn() async {
    final auth = context.read<AuthService>();
    final api = context.read<ApiService>();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      await api.computeDistressScore({
        'victim_id': auth.userId ?? 'VICTIM_0001',
        'checkin': {
          'scores': {
            'mood': _getMoodValue(_selectedMood),
            'anxiety_stress': _anxiety.round(),
            'sleep_quality': _sleep.round(),
            'safety': _safety.round(),
            'hopelessness': _hopelessness.round(),
            'isolation': _isolation.round(),
            'urgent_help': _urgentHelp ? 1 : 0,
          },
        },
      });

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Check-in submitted successfully')),
        );
        context.go('/home');
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit: $e')),
        );
      }
    }
  }

  int _getMoodValue(String? mood) {
    const values = {'better': 80, 'okay': 60, 'stressed': 40, 'distressed': 20, 'help': 10};
    return values[mood] ?? 50;
  }

  Widget _buildStepIndicator() {
    return Row(
      children: List.generate(_totalSteps, (i) {
        final isDone = i < _currentStep;
        final isActive = i == _currentStep;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: i < _totalSteps - 1 ? 6 : 0),
            child: Row(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  width: isActive ? 22 : 16,
                  height: 8,
                  decoration: BoxDecoration(
                    color: isDone || isActive ? AppTheme.primary500 : AppTheme.secondary200,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                if (i < _totalSteps - 1)
                  Expanded(
                    child: Container(
                      height: 2,
                      color: isDone ? AppTheme.primary500 : AppTheme.secondary200,
                    ),
                  ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _buildStep(int index) {
    final step = _steps[index];
    final isLast = index == _totalSteps - 1;

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      child: Padding(
        key: ValueKey(step['id']),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Step content
            _buildStepContent(step['id']),

            const Spacer(),

            // Navigation
            Row(
              children: [
                if (_currentStep > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _prevStep,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text('Back'),
                    ),
                  )
                else
                  const Expanded(child: SizedBox()),
                if (_currentStep > 0) const SizedBox(width: 16),
                Expanded(
                  child: FilledButton(
                    onPressed: _nextStep,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(isLast ? 'Submit Check-in' : 'Next'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepContent(String stepId) {
    switch (stepId) {
      case 'mood':
        return Column(
          key: const ValueKey('mood'),
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: MoodSelector(
                    onMoodSelected: (mood) => setState(() => _selectedMood = mood),
                    preSelectedMood: _selectedMood,
                  ),
                ),
                const SizedBox(width: 12),
                RadialDistressGauge(
                  score: (100 - _getMoodValue(_selectedMood)).toDouble(),
                  band: _bandForScore(100 - _getMoodValue(_selectedMood)),
                  size: GaugeSize.sm,
                ),
              ],
            ),
          ],
        );
      case 'anxiety':
        return _SliderQuestion(
          key: const ValueKey('anxiety'),
          label: 'How anxious or stressed have you been?',
          subtitle: '0 = Not at all anxious, 100 = Extremely anxious',
          value: _anxiety,
          onChanged: (v) => setState(() => _anxiety = v),
        );
      case 'sleep':
        return _SliderQuestion(
          key: const ValueKey('sleep'),
          label: 'How has your sleep been?',
          subtitle: '0 = Very poor, 100 = Excellent',
          value: _sleep,
          onChanged: (v) => setState(() => _sleep = v),
          invert: true,
        );
      case 'safety':
        return _SliderQuestion(
          key: const ValueKey('safety'),
          label: 'How safe do you feel?',
          subtitle: '0 = Very unsafe, 100 = Completely safe',
          value: _safety,
          onChanged: (v) => setState(() => _safety = v),
          invert: true,
        );
      case 'hopelessness':
        return _SliderQuestion(
          key: const ValueKey('hopelessness'),
          label: 'How hopeless do you feel about the future?',
          subtitle: '0 = Not at all hopeless, 100 = Completely hopeless',
          value: _hopelessness,
          onChanged: (v) => setState(() => _hopelessness = v),
        );
      case 'isolation':
        return Column(
          key: const ValueKey('isolation'),
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SliderQuestion(
              label: 'How isolated do you feel?',
              subtitle: '0 = Not isolated, 100 = Completely isolated',
              value: _isolation,
              onChanged: (v) => setState(() => _isolation = v),
            ),
            const SizedBox(height: 24),
            Card(
              color: AppTheme.distressRed.withOpacity(0.1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: AppTheme.distressRed.withOpacity(0.3)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Checkbox(
                      value: _urgentHelp,
                      onChanged: (v) => setState(() => _urgentHelp = v ?? false),
                      activeColor: AppTheme.distressRed,
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'I need urgent help right now',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: AppTheme.distressRed,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Check this if you are in immediate danger or crisis',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      default:
        return const SizedBox();
    }
  }

  String _bandForScore(num score) {
    if (score < 30) return 'Green';
    if (score < 50) return 'Yellow';
    if (score < 75) return 'Orange';
    return 'Red';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Check-in'),
        leading: _currentStep > 0
            ? IconButton(
                onPressed: _prevStep,
                icon: const Icon(Icons.arrow_back_ios_new),
              )
            : IconButton(
                onPressed: () => context.go('/home'),
                icon: const Icon(Icons.close),
              ),
      ),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: SlideTransition(
          position: _slideAnimation,
          child: Column(
            children: [
              // Progress header
              Container(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Check-in ${_currentStep + 1} of $_totalSteps',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _steps[_currentStep]['title'],
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 14),
                    _buildStepIndicator(),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  child: _buildStep(_currentStep),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SliderQuestion extends StatelessWidget {
  final String label;
  final String subtitle;
  final double value;
  final ValueChanged<double> onChanged;
  final bool invert;

  const _SliderQuestion({
    super.key,
    required this.label,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    this.invert = false,
  });

  @override
  Widget build(BuildContext context) {
    final displayScore = invert ? 100 - value : value;
    final color = RadialDistressGauge.colorForBand(
      displayScore < 30 ? 'Green' : displayScore < 50 ? 'Yellow' : displayScore < 75 ? 'Orange' : 'Red',
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          value.round().toString(),
          style: Theme.of(context).textTheme.displayLarge?.copyWith(
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        const SizedBox(height: 16),
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            activeTrackColor: color,
            inactiveTrackColor: AppTheme.secondary100,
            thumbColor: color,
            overlayColor: color.withOpacity(0.2),
            trackHeight: 6,
            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 12),
          ),
          child: Slider(
            value: value,
            min: 0,
            max: 100,
            divisions: 20,
            onChanged: onChanged,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Not at all', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.textMuted)),
            Text('Extremely', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.textMuted)),
          ],
        ),
      ],
    );
  }
}
