import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class MoodOption {
  final String id;
  final String label;
  final String emoji;
  final Color color;
  final int value; // 1-5 scale

  const MoodOption({
    required this.id,
    required this.label,
    required this.emoji,
    required this.color,
    required this.value,
  });
}

final List<MoodOption> moodOptions = [
  const MoodOption(id: 'better', label: 'Better', emoji: '😊', color: AppTheme.distressGreen, value: 5),
  const MoodOption(id: 'okay', label: 'Okay', emoji: '🙂', color: AppTheme.primary400, value: 4),
  const MoodOption(id: 'stressed', label: 'Stressed', emoji: '😟', color: AppTheme.distressYellow, value: 3),
  const MoodOption(id: 'distressed', label: 'Very Distressed', emoji: '😰', color: AppTheme.distressOrange, value: 2),
  const MoodOption(id: 'help', label: 'I Need Help', emoji: '🆘', color: AppTheme.distressRed, value: 1),
];

class MoodSelector extends StatefulWidget {
  final Function(String) onMoodSelected;
  final String? preSelectedMood;

  const MoodSelector({
    super.key,
    required this.onMoodSelected,
    this.preSelectedMood,
  });

  @override
  State<MoodSelector> createState() => _MoodSelectorState();
}

class _MoodSelectorState extends State<MoodSelector> with TickerProviderStateMixin {
  String? _selectedMood;
  late List<AnimationController> _controllers;
  late List<Animation<double>> _scaleAnimations;

  @override
  void initState() {
    super.initState();
    _selectedMood = widget.preSelectedMood;
    
    _controllers = List.generate(
      moodOptions.length,
      (index) => AnimationController(
        duration: const Duration(milliseconds: 300),
        vsync: this,
      ),
    );
    
    _scaleAnimations = _controllers.map((c) => Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: c, curve: Curves.easeOutCubic),
    )).toList();
    
    if (widget.preSelectedMood != null) {
      final index = moodOptions.indexWhere((m) => m.id == widget.preSelectedMood);
      if (index >= 0) _controllers[index].forward();
    }
  }

  @override
  void dispose() {
    for (var c in _controllers) c.dispose();
    super.dispose();
  }

  void _selectMood(String moodId) {
    final index = moodOptions.indexWhere((m) => m.id == moodId);
    if (index >= 0) {
      _controllers[index].forward().then((_) => _controllers[index].reverse());
    }
    
    setState(() => _selectedMood = moodId);
    widget.onMoodSelected(moodId);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tap to select how you\'re feeling',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: List.generate(moodOptions.length, (index) {
            final option = moodOptions[index];
            final isSelected = _selectedMood == option.id;
            
            return ScaleTransition(
              scale: _scaleAnimations[index],
              child: GestureDetector(
                onTap: () => _selectMood(option.id),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                    color: isSelected ? option.color.withOpacity(0.15) : AppTheme.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isSelected ? option.color : AppTheme.border,
                      width: isSelected ? 2 : 1,
                    ),
                    boxShadow: isSelected ? [
                      BoxShadow(
                        color: option.color.withOpacity(0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ] : null,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(option.emoji, style: const TextStyle(fontSize: 24)),
                      const SizedBox(width: 10),
                      Text(
                        option.label,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: isSelected ? option.color : AppTheme.textPrimary,
                        ),
                      ),
                      if (isSelected) ...[
                        const SizedBox(width: 8),
                        Icon(Icons.check_circle, color: option.color, size: 20),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          }),
        ),
      ],
    );
  }
}