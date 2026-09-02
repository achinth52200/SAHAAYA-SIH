import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import '../../theme/app_theme.dart';

class VoiceScreen extends StatefulWidget {
  const VoiceScreen({super.key});

  @override
  State<VoiceScreen> createState() => _VoiceScreenState();
}

class _VoiceScreenState extends State<VoiceScreen> with TickerProviderStateMixin {
  final AudioRecorder _recorder = AudioRecorder();
  final AudioPlayer _player = AudioPlayer();
  
  bool _isRecording = false;
  bool _hasRecording = false;
  bool _isPlaying = false;
  Duration _recordingDuration = Duration.zero;
  Duration _playbackDuration = Duration.zero;
  String? _recordingPath;
  
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _initRecorder();
  }

  Future<void> _initRecorder() async {
    final status = await _recorder.hasPermission();
    if (!status) {
      await _recorder.requestPermission();
    }
  }

  Future<void> _startRecording() async {
    if (await _recorder.hasPermission()) {
      _recordingPath = await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          sampleRate: 44100,
          bitRate: 128000,
        ),
        path: 'voice_checkin_${DateTime.now().millisecondsSinceEpoch}.m4a',
      );
      setState(() {
        _isRecording = true;
        _recordingDuration = Duration.zero;
      });
      _startRecordingTimer();
    }
  }

  void _startRecordingTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (_isRecording) {
        setState(() => _recordingDuration += const Duration(seconds: 1));
        return true;
      }
      return false;
    });
  }

  Future<void> _stopRecording() async {
    final path = await _recorder.stop();
    setState(() {
      _isRecording = false;
      _hasRecording = path != null;
      _recordingPath = path;
    });
  }

  Future<void> _playRecording() async {
    if (_recordingPath == null) return;
    setState(() => _isPlaying = true);
    await _player.play(DeviceFileSource(_recordingPath!));
    setState(() => _isPlaying = false);
  }

  Future<void> _deleteRecording() async {
    setState(() {
      _hasRecording = false;
      _recordingPath = null;
    });
  }

  Future<void> _submitVoiceCheckIn() async {
    if (_recordingPath == null) return;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    // Simulate API call
    await Future.delayed(const Duration(seconds: 2));
    
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Voice check-in submitted for analysis')),
      );
      context.go('/home');
    }
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.toString().padLeft(2, '0');
    final seconds = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _recorder.dispose();
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Voice Check-in'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.arrow_back_ios_new),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Info card
            Card(
              color: AppTheme.primary50,
              border: Border.all(color: AppTheme.primary200),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Icon(
                      Icons.mic_outlined,
                      size: 48,
                      color: AppTheme.primary500,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Voice Check-in',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Record a brief voice message about how you\'re feeling. '
                      'Your voice patterns (pitch, energy, pace) are analyzed as a supporting signal only.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.primary100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.info_outline, color: AppTheme.primary700, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Voice analysis is a supporting signal only — never the sole basis for any decision. '
                              'You can delete this recording at any time.',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppTheme.primary700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            
            const SizedBox(height: 24),
            
            // Recording interface
            if (!_hasRecording) ...[
              // Record button
              AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _isRecording ? _pulseAnimation.value : 1.0,
                    child: GestureDetector(
                      onTap: _isRecording ? _stopRecording : _startRecording,
                      child: Container(
                        width: 160,
                        height: 160,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: _isRecording 
                                ? [AppTheme.distressRed, AppTheme.distressOrange]
                                : [AppTheme.primary500, AppTheme.primary600],
                          ),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: (_isRecording ? AppTheme.distressRed : AppTheme.primary500).withOpacity(0.4),
                              blurRadius: _isRecording ? 30 : 20,
                              offset: const Offset(0, 10),
                              spreadRadius: _isRecording ? 10 : 0,
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _isRecording ? Icons.stop : Icons.mic,
                              size: 48,
                              color: Colors.white,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _isRecording ? 'Recording...' : 'Tap to Record',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              _formatDuration(_recordingDuration),
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: Colors.white.withOpacity(0.9),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            if (_isRecording)
              FilledButton.icon(
                onPressed: _stopRecording,
                icon: const Icon(Icons.stop),
                label: const Text('Stop Recording'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.distressRed,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
              ),
            
            if (_hasRecording) ...[
              // Recording preview card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [AppTheme.primary500, AppTheme.primary600],
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Icon(Icons.audiotrack, color: Colors.white, size: 28),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Voice Recording',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  'Duration: ${_formatDuration(_recordingDuration)}',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _isPlaying ? null : _playRecording,
                              icon: Icon(_isPlaying ? Icons.pause : Icons.play_arrow),
                              label: Text(_isPlaying ? 'Playing...' : 'Play'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _deleteRecording,
                              icon: const Icon(Icons.delete_outline),
                              label: const Text('Delete'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.distressRed,
                                side: BorderSide(color: AppTheme.distressRed),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Submit button
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _submitVoiceCheckIn,
                  icon: const Icon(Icons.send),
                  label: const Text('Submit for Analysis'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.toString().padLeft(2, '0');
    final seconds = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }
}