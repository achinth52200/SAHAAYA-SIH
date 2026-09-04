import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String _baseUrl = 'https://sahaaya-ten.vercel.app';
  static const String _apiVersion = 'v1';
  
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  String? _accessToken;
  String? _refreshToken;

  // Headers
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
  };

  // Initialize from storage
  Future<void> initialize() async {
    _accessToken = await _secureStorage.read(key: 'access_token');
    _refreshToken = await _secureStorage.read(key: 'refresh_token');
  }

  // Token management
  Future<void> setTokens(String access, String refresh) async {
    _accessToken = access;
    _refreshToken = refresh;
    await _secureStorage.write(key: 'access_token', value: access);
    await _secureStorage.write(key: 'refresh_token', value: refresh);
  }

  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
    await _secureStorage.delete(key: 'access_token');
    await _secureStorage.delete(key: 'refresh_token');
  }

  // HTTP methods
  Future<Map<String, dynamic>> _request({
    required String method,
    required String endpoint,
    Map<String, dynamic>? body,
    Map<String, String>? extraHeaders,
  }) async {
    final url = Uri.parse('$_baseUrl/api/$_apiVersion$endpoint');
    final headers = {..._headers, ...?extraHeaders};

    http.Response response;
    switch (method) {
      case 'GET':
        response = await http.get(url, headers: headers);
        break;
      case 'POST':
        response = await http.post(url, headers: headers, body: jsonEncode(body));
        break;
      case 'PATCH':
        response = await http.patch(url, headers: headers, body: jsonEncode(body));
        break;
      case 'DELETE':
        response = await http.delete(url, headers: headers);
        break;
      default:
        throw ArgumentError('Unsupported HTTP method: $method');
    }

    if (response.statusCode >= 400) {
      final error = jsonDecode(response.body);
      throw ApiException(
        message: error['detail'] ?? 'Request failed',
        statusCode: response.statusCode,
      );
    }

    if (response.body.isEmpty) return {};
    return jsonDecode(response.body);
  }

  // Health
  Future<Map<String, dynamic>> healthCheck() => _request(method: 'GET', endpoint: '/health');

  // Victims
  Future<List<dynamic>> getVictims() => _request(method: 'GET', endpoint: '/victims');
  Future<Map<String, dynamic>> getVictim(String victimId) => _request(method: 'GET', endpoint: '/victims/$victimId');
  Future<Map<String, dynamic>> getVictimDistress(String victimId) => _request(method: 'GET', endpoint: '/victims/$victimId/distress');
  Future<Map<String, dynamic>> getVictimExplanation(String victimId) => _request(method: 'GET', endpoint: '/victims/$victimId/explanation');

  Future<List<dynamic>> getSupportRequests() async {
    final response = await _request(method: 'GET', endpoint: '/support-requests');
    return response is List ? response : (response['items'] as List? ?? []);
  }

  Future<Map<String, dynamic>> createSupportRequest({
    required String victimId,
    required String requestType,
    required String message,
  }) => _request(
    method: 'POST',
    endpoint: '/support-requests',
    body: {'victim_id': victimId, 'request_type': requestType, 'message': message},
  );

  // Emotion prediction
  Future<Map<String, dynamic>> predictEmotion(String text) => _request(
    method: 'POST',
    endpoint: '/emotion/predict',
    body: {'text': text},
  );

  // Distress scoring
  Future<Map<String, dynamic>> computeDistressScore(Map<String, dynamic> data) => _request(
    method: 'POST',
    endpoint: '/distress/score',
    body: data,
  );

  // Alerts
  Future<List<dynamic>> getAlerts({String? band, int limit = 50}) => _request(
    method: 'GET',
    endpoint: '/alerts',
    extraHeaders: {'X-Query-Params': jsonEncode({'band': band, 'limit': limit})},
  );

  // Review endpoints
  Future<List<dynamic>> getReviewAlerts({
    String? status,
    String? priority,
    String? assignedTo,
    String? victimId,
    int limit = 50,
  }) => _request(
    method: 'GET',
    endpoint: '/review/alerts',
  );

  Future<Map<String, dynamic>> getAlert(String alertId) => _request(method: 'GET', endpoint: '/review/alerts/$alertId');

  Future<Map<String, dynamic>> assignAlert(String alertId, String assignedTo, String assignedRole) => _request(
    method: 'POST',
    endpoint: '/review/alerts/$alertId/assign',
    body: {'assigned_to': assignedTo, 'assigned_role': assignedRole},
  );

  Future<Map<String, dynamic>> reviewAlert(String alertId, Map<String, dynamic> data) => _request(
    method: 'POST',
    endpoint: '/review/alerts/$alertId/review',
    body: data,
  );

  Future<Map<String, dynamic>> generateAlerts() => _request(method: 'POST', endpoint: '/review/alerts/generate');

  // Interventions
  Future<List<dynamic>> getInterventions({
    String? alertId,
    String? victimId,
    String? status,
    String? assignedTo,
    int limit = 50,
  }) => _request(method: 'GET', endpoint: '/review/interventions');

  Future<Map<String, dynamic>> createIntervention(String alertId, Map<String, dynamic> data) => _request(
    method: 'POST',
    endpoint: '/review/alerts/$alertId/interventions',
    body: data,
  );

  Future<Map<String, dynamic>> startIntervention(String interventionId, String actorId) => _request(
    method: 'POST',
    endpoint: '/review/interventions/$interventionId/start',
    body: {'actor_id': actorId},
  );

  Future<Map<String, dynamic>> completeIntervention(String interventionId, Map<String, dynamic> data) => _request(
    method: 'POST',
    endpoint: '/review/interventions/$interventionId/complete',
    body: data,
  );

  // Review stats
  Future<Map<String, dynamic>> getReviewSummary() => _request(method: 'GET', endpoint: '/review/stats/summary');
  Future<Map<String, dynamic>> getOfficerWorkload(String officerId, String role) => _request(
    method: 'GET',
    endpoint: '/review/stats/officer/$officerId',
    extraHeaders: {'X-Query-Params': jsonEncode({'role': role})},
  );

  // Audit logs
  Future<List<dynamic>> getAuditLogs({
    String? resourceType,
    String? resourceId,
    String? actorId,
    String? action,
    int limit = 100,
  }) => _request(method: 'GET', endpoint: '/review/audit-logs');

  // Dashboards
  Future<Map<String, dynamic>> getDistrictDashboard(String districtId) => _request(
    method: 'GET',
    endpoint: '/dashboard/district/$districtId',
  );

  Future<Map<String, dynamic>> getStateDashboard(String stateId) => _request(
    method: 'GET',
    endpoint: '/dashboard/state/$stateId',
  );

  Future<Map<String, dynamic>> getNationalDashboard() => _request(
    method: 'GET',
    endpoint: '/dashboard/national',
  );
}

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException({required this.message, required this.statusCode});

  @override
  String toString() => 'ApiException: $message (Status: $statusCode)';
}