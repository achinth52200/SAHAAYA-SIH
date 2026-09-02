import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../theme/app_theme.dart';
import '../../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _showPassword = false;
  bool _remember = true;
  bool _loading = false;
  String? _error;

  final List<Map<String, String>> _demoAccounts = [
    {'email': 'victim@sahaaya.gov.in', 'role': 'Victim (Demo)', 'name': 'Anonymous Victim'},
    {'email': 'counsellor@sahaaya.gov.in', 'role': 'Counsellor', 'name': 'Dr. Priya Sharma'},
    {'email': 'district@sahaaya.gov.in', 'role': 'District Officer', 'name': 'Officer Rajesh Kumar'},
    {'email': 'state@sahaaya.gov.in', 'role': 'State Officer', 'name': 'Officer Anjali Patel'},
    {'email': 'national@sahaaya.gov.in', 'role': 'National Admin', 'name': 'Director General'},
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
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() {
      _loading = true;
      _error = null;
    });

    await Future.delayed(const Duration(milliseconds: 800));
    
    if (_emailController.text == 'victim@sahaaya.gov.in' && _passwordController.text == 'demo123') {
      context.read<AuthService>().login(
        id: 'VICTIM_0001',
        role: 'victim',
        name: 'Anonymous Victim',
        email: 'victim@sahaaya.gov.in',
      );
      if (mounted) context.go('/home');
    } else if (_emailController.text == 'counsellor@sahaaya.gov.in' && _passwordController.text == 'demo123') {
      context.read<AuthService>().login(
        id: 'COUNSELLOR_001',
        role: 'counsellor',
        name: 'Dr. Priya Sharma',
        email: 'counsellor@sahaaya.gov.in',
      );
      if (mounted) context.go('/home');
    } else if (_emailController.text == 'district@sahaaya.gov.in' && _passwordController.text == 'demo123') {
      context.read<AuthService>().login(
        id: 'DISTRICT_001',
        role: 'district_officer',
        name: 'Officer Rajesh Kumar',
        email: 'district@sahaaya.gov.in',
      );
      if (mounted) context.go('/home');
    } else if (_emailController.text == 'state@sahaaya.gov.in' && _passwordController.text == 'demo123') {
      context.read<AuthService>().login(
        id: 'STATE_001',
        role: 'state_officer',
        name: 'Officer Anjali Patel',
        email: 'state@sahaaya.gov.in',
      );
      if (mounted) context.go('/home');
    } else if (_emailController.text == 'national@sahaaya.gov.in' && _passwordController.text == 'demo123') {
      context.read<AuthService>().login(
        id: 'NATIONAL_001',
        role: 'national_admin',
        name: 'Director General',
        email: 'national@sahaaya.gov.in',
      );
      if (mounted) context.go('/home');
    } else {
      setState(() {
        _error = 'Invalid credentials. Use demo accounts with password "demo123"';
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
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
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Logo
                    Center(
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [AppTheme.primary500, AppTheme.primary600],
                          ),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primary500.withOpacity(0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.eco,
                          size: 40,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    
                    // Header
                    Text(
                      'Welcome Back',
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Sign in to access your SAHAAYA dashboard',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Error message
                    if (_error != null)
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.distressRed.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.distressRed.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: AppTheme.distressRed, size: 20),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                _error!,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppTheme.distressRed,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    
                    // Login form
                    Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextFormField(
                            controller: _emailController,
                            decoration: const InputDecoration(
                              labelText: 'Email',
                              hintText: 'officer@sahaaya.gov.in',
                              prefixIcon: Icon(Icons.mail_outline),
                            ),
                            keyboardType: TextInputType.emailAddress,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter your email';
                              }
                              if (!value.contains('@')) {
                                return 'Please enter a valid email';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: !_showPassword,
                            decoration: InputDecoration(
                              labelText: 'Password',
                              hintText: 'Enter password',
                              prefixIcon: const Icon(Icons.lock_outline),
                              suffixIcon: IconButton(
                                icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility),
                                onPressed: () => setState(() => _showPassword = !_showPassword),
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter your password';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          
                          Row(
                            children: [
                              Checkbox(
                                value: _remember,
                                onChanged: (value) => setState(() => _remember = value ?? true),
                                activeColor: AppTheme.primary500,
                              ),
                              const Text('Remember me'),
                              const Spacer(),
                              TextButton(
                                onPressed: () {},
                                child: const Text('Forgot password?'),
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 24),
                          
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton(
                              onPressed: _loading ? null : _handleLogin,
                              style: FilledButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 18),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
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
                                  : const Text('Sign In'),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Security notice
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.primary50,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.primary100),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.shield_outlined, color: AppTheme.primary500),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Secure access with audit logging. All actions tracked.',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppTheme.primary700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Demo accounts
                    Text(
                      'Demo Accounts (password: demo123)',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ..._demoAccounts.map((account) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Material(
                        color: AppTheme.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.border),
                        child: InkWell(
                          onTap: () {
                            _emailController.text = account['email']!;
                            _passwordController.text = 'demo123';
                          },
                          borderRadius: BorderRadius.circular(16),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.person_outline,
                                    color: AppTheme.primary500,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        account['name']!,
                                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      Text(
                                        account['role']!,
                                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                          color: AppTheme.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(Icons.arrow_forward_ios, size: 16, color: AppTheme.textMuted),
                              ],
                            ),
                          ),
                        ),
                    )).toList(),
                    
                    const SizedBox(height: 24),
                    
                    // Footer
                    Center(
                      child: Text(
                        'Prototype Demo — Synthetic Data Only\nNot for clinical use',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}