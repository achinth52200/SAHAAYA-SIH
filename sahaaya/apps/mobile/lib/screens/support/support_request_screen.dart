import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../theme/app_theme.dart';
import '../../services/auth_service.dart';
import '../../services/api_service.dart';

class SupportRequestScreen extends StatefulWidget {
  const SupportRequestScreen({super.key});

  @override
  State<SupportRequestScreen> createState() => _SupportRequestScreenState();
}

class _SupportRequestScreenState extends State<SupportRequestScreen> with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  String _selectedSupportType = 'counselling';
  final _formKey = GlobalKey<FormState>();
  final _detailsController = TextEditingController();
  bool _urgent = false;
  bool _loading = false;

  final List<Map<String, dynamic>> _supportTypes = [
    {
      'id': 'counselling',
      'title': 'Counselling Session',
      'description': 'Schedule a session with a mental health professional',
      'icon': Icons.psychology_outlined,
      'color': AppTheme.primary500,
      'urgency': 'Within 24-72 hours',
    },
    {
      'id': 'legal_aid',
      'title': 'Legal Aid',
      'description': 'Get help with legal proceedings and rights',
      'icon': Icons.gavel_outlined,
      'color': AppTheme.primary400,
      'urgency': 'Within 1-2 weeks',
    },
    {
      'id': 'protection_support',
      'title': 'Protection Support',
      'description': 'Request safety planning or protection measures',
      'icon': Icons.shield_outlined,
      'color': AppTheme.distressOrange,
      'urgency': 'Within 24 hours',
    },
    {
      'id': 'financial_assistance',
      'title': 'Financial Assistance',
      'description': 'Apply for compensation or financial relief',
      'icon': Icons.currency_rupee_outlined,
      'color': AppTheme.distressGreen,
      'urgency': 'Within 2-4 weeks',
    },
    {
      'id': 'rehabilitation_referral',
      'title': 'Rehabilitation Referral',
      'description': 'Connect with rehabilitation and recovery services',
      'icon': Icons.healing_outlined,
      'color': AppTheme.distressYellow,
      'urgency': 'Within 1-2 weeks',
    },
    {
      'id': 'safety_planning',
      'title': 'Safety Planning',
      'description': 'Create a personalized safety plan',
      'icon': Icons.security_outlined,
      color: AppTheme.distressRed,
      'urgency': 'Immediate / Within 4 hours',
    },
    {
      'id': 'crisis_hotline',
      'title': 'Crisis Hotline',
      'description': 'Immediate crisis support and helpline',
      'icon': Icons.phone_outlined,
      color: AppTheme.distressRed,
      'urgency': 'Available 24/7',
    },
    {
      'id': 'medical_referral',
      'title': 'Medical Referral',
      'description': 'Referral to medical/psychiatric services',
      'icon': Icons.medical_services_outlined,
      color: AppTheme.primary600,
      'urgency': 'Within 1-2 weeks',
    },
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
  }

  @override
  void dispose() {
    _controller.dispose();
    _detailsController.dispose();
    super.dispose();
  }

  Future<void> _submitRequest() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      final auth = context.read<AuthService>();
      final api = context.read<ApiService>();

      // Create intervention via API
      await api.createIntervention('ALERT_TEMP', {
        'created_by': auth.userId,
        'type': _selectedSupportType,
        'title': _supportTypes.firstWhere((t) => t['id'] == _selectedSupportType)['title'],
        'description': _detailsController.text,
        'priority': _urgent ? 'critical' : 'high',
        'assigned_to': auth.userId,
        'assigned_role': auth.userRole,
      });

      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Support request submitted successfully')),
        );
        context.go('/home');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit request: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _detailsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Request Support'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.arrow_back_ios_new),
        ),
      ),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: SlideTransition(
          position: _slideAnimation,
          child: Form(
            key: _formKey,
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'What kind of support do you need?',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Select a support type and provide details. A human will review and respond based on urgency.',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),

                // Support type selection
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final type = _supportTypes[index];
                        final isSelected = _selectedSupportType == type['id'];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            child: Material(
                              color: isSelected ? type['color'].withOpacity(0.1) : AppTheme.surface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: isSelected ? type['color'] : AppTheme.border,
                                width: isSelected ? 2 : 1,
                              ),
                              child: InkWell(
                                onTap: () => setState(() => _selectedSupportType = type['id']),
                                borderRadius: BorderRadius.circular(20),
                                child: Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 56,
                                        height: 56,
                                        decoration: BoxDecoration(
                                          color: isSelected ? type['color'] : type['color'].withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                        child: Icon(
                                          type['icon'],
                                          color: isSelected ? Colors.white : type['color'],
                                          size: 28,
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    type['title'],
                                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                ),
                                                if (isSelected)
                                                  Icon(Icons.check_circle, color: type['color'], size: 20),
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              type['description'],
                                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                                color: AppTheme.textSecondary,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: type['color'].withOpacity(0.1),
                                                borderRadius: BorderRadius.circular(999),
                                              ),
                                              child: Text(
                                                'Response: ${type['urgency']}',
                                                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                                  color: type['color'],
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      if (isSelected)
                                        Container(
                                          width: 28,
                                          height: 28,
                                          decoration: BoxDecoration(
                                            color: type['color'],
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(Icons.check, color: Colors.white, size: 18),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                      },
                      childCount: _supportTypes.length,
                    ),
                  ),
                ),

                // Details form
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Additional Details',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Please provide any additional information that would help us understand your needs better.',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _detailsController,
                          maxLines: 5,
                          decoration: const InputDecoration(
                            labelText: 'Details',
                            hintText: 'Describe your situation, concerns, or specific needs...',
                            alignLabelWithHint: true,
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please provide some details about your request';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        
                        // Urgent checkbox
                        Card(
                          color: AppTheme.distressRed.withOpacity(0.1),
                          border: Border.all(color: AppTheme.distressRed.withOpacity(0.3)),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Checkbox(
                                  value: _urgent,
                                  onChanged: (v) => setState(() => _urgent = v ?? false),
                                  activeColor: AppTheme.distressRed,
                                  checkColor: Colors.white,
                                ),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Mark as Urgent',
                                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                          fontWeight: FontWeight.w600,
                                          color: AppTheme.distressRed,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Check this if you are in immediate danger or crisis and need the fastest possible response.',
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
                        const SizedBox(height: 24),
                        
                        // Submit button
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: _loading ? null : _submitRequest,
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 18),
                              backgroundColor: _urgent ? AppTheme.distressRed : null,
                            ),
                            child: _loading
                                ? const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : Text(_urgent ? 'Send Urgent Request' : 'Submit Request'),
                          ),
                        ),
                        
                        const SizedBox(height: 16),
                        
                        // Emergency resources
                        Card(
                          color: AppTheme.distressRed.withOpacity(0.1),
                          border: Border.all(color: AppTheme.distressRed.withOpacity(0.3)),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.emergency, color: AppTheme.distressRed, size: 24),
                                    const SizedBox(width: 12),
                                    Text(
                                      'Immediate Crisis Resources',
                                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.distressRed,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                _EmergencyContact(
                                  label: 'National Emergency',
                                  number: '112',
                                  available: '24/7',
                                ),
                                _EmergencyContact(
                                  label: 'Women\'s Helpline',
                                  number: '1091',
                                  available: '24/7',
                                ),
                                _EmergencyContact(
                                  label: 'Child Helpline',
                                  number: '1098',
                                  available: '24/7',
                                ),
                                _EmergencyContact(
                                  label: 'Mental Health Helpline',
                                  number: '1800-599-0019',
                                  available: '24/7',
                                ),
                              ],
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 32),
                      ],
                    ),
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

class _EmergencyContact extends StatelessWidget {
  final String label;
  final String number;
  final String available;

  const _EmergencyContact({
    required this.label,
    required this.number,
    required this.available,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500)),
                Text(available, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.textSecondary)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.distressRed,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              number,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}