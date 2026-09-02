import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService extends ChangeNotifier {
  static const String _userKey = 'user_data';
  static const String _onboardingCompleteKey = 'onboarding_complete';
  
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  
  Map<String, dynamic>? _user;
  bool _isAuthenticated = false;
  bool _isLoading = true;
  bool _onboardingComplete = false;

  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  bool get onboardingComplete => _onboardingComplete;

  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      _onboardingComplete = prefs.getBool(_onboardingCompleteKey) ?? false;
      
      final userData = await _secureStorage.read(key: _userKey);
      if (userData != null) {
        _user = jsonDecode(userData) as Map<String, dynamic>;
        _isAuthenticated = true;
      }
    } catch (e) {
      _isAuthenticated = false;
      _user = null;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> login({
    required String id,
    required String role,
    required String name,
    String? email,
    String? district,
    String? state,
  }) async {
    _user = {
      'id': id,
      'role': role,
      'name': name,
      'email': email,
      'district': district,
      'state': state,
    };
    _isAuthenticated = true;

    await _secureStorage.write(key: _userKey, value: jsonEncode(_user));
    notifyListeners();
  }

  Future<void> logout() async {
    _user = null;
    _isAuthenticated = false;
    await _secureStorage.delete(key: _userKey);
    notifyListeners();
  }

  Future<void> completeOnboarding() async {
    _onboardingComplete = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingCompleteKey, true);
    notifyListeners();
  }

  Future<void> updateProfile(Map<String, dynamic> updates) async {
    if (_user != null) {
      _user!.addAll(updates);
      await _secureStorage.write(key: _userKey, value: jsonEncode(_user));
      notifyListeners();
    }
  }

  String? get userId => _user?['id'];
  String? get userRole => _user?['role'];
  String? get userName => _user?['name'];
  String? get userEmail => _user?['email'];
  String? get userDistrict => _user?['district'];
  String? get userState => _user?['state'];

  bool get isCounsellor => _user?['role'] == 'counsellor';
  bool get isDistrictOfficer => _user?['role'] == 'district_officer';
  bool get isStateOfficer => _user?['role'] == 'state_officer';
  bool get isNationalAdmin => _user?['role'] == 'national_admin';
  bool get isVictim => _user?['role'] == 'victim';
}