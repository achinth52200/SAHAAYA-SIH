import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../theme/app_theme.dart';
import '../../services/api_service.dart';

class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> with TickerProviderStateMixin {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isTyping = false;
  bool _loading = false;

  static const _quickReplies = ["I'm okay", "I'm feeling stressed", "I need to talk", "I need help now"];

  void _sendQuickReply(String text) {
    _controller.text = text;
    _sendMessage();
  }

  @override
  void initState() {
    super.initState();
    _addWelcomeMessage();
  }

  void _addWelcomeMessage() {
    setState(() {
      _messages.add(ChatMessage(
        text: 'Hello! I\'m here to listen. How are you feeling today?',
        isUser: false,
        timestamp: DateTime.now(),
      ));
    });
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _loading) return;

    setState(() {
      _messages.add(ChatMessage(
        text: text,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      _controller.clear();
      _loading = true;
    });

    _scrollToBottom();

    // Simulate typing indicator
    setState(() => _isTyping = true);

    try {
      final api = context.read<ApiService>();
      final response = await api.predictEmotion(text);
      
      // Remove typing indicator
      setState(() => _isTyping = false);
      
      // Add bot response with emotion
      final emotion = response['emotion'] ?? 'neutral';
      final confidence = response['confidence'] ?? 0.0;
      
      String botResponse = _getBotResponse(emotion, confidence);
      
      setState(() {
        _messages.add(ChatMessage(
          text: botResponse,
          isUser: false,
          timestamp: DateTime.now(),
          emotion: emotion,
          confidence: confidence,
        ));
      });
    } catch (e) {
      setState(() => _isTyping = false);
      setState(() {
        _messages.add(ChatMessage(
          text: 'I\'m having trouble understanding right now. Could you try again?',
          isUser: false,
          timestamp: DateTime.now(),
        ));
      });
    } finally {
      setState(() => _loading = false);
    }

    _scrollToBottom();
  }

  String _getBotResponse(String emotion, double confidence) {
    final responses = {
      'fear': [
        'I hear that you\'re feeling scared. That must be really difficult.',
        'It\'s understandable to feel afraid. You\'re not alone in this.',
        'Fear is a natural response. Let\'s talk about what\'s making you feel this way.',
      ],
      'anger': [
        'It sounds like you\'re really frustrated. That\'s completely valid.',
        'Anger is a natural emotion. What\'s been making you feel this way?',
        'I can hear how upset you are. Would you like to talk about it?',
      ],
      'hopelessness': [
        'I\'m so sorry you\'re feeling this way. You matter, and there are people who want to help.',
        'These feelings are really heavy. You don\'t have to carry them alone.',
        'Even when things feel hopeless, there can be a path forward. Let\'s explore it together.',
      ],
      'threat': [
        'Your safety is the most important thing right now. Are you in immediate danger?',
        'Threats are very serious. Please consider reaching out for immediate support.',
        'I\'m concerned about your safety. Would you like me to connect you with crisis resources?',
      ],
      'sadness': [
        'I\'m sorry you\'re going through this. It\'s okay to feel sad.',
        'Sadness can feel overwhelming. I\'m here to listen.',
        'You don\'t have to pretend to be okay. Your feelings are valid.',
      ],
      'anxiety': [
        'Anxiety can be so exhausting. What\'s been on your mind lately?',
        'It\'s hard when your mind won\'t quiet down. Would breathing exercises help?',
        'You\'re not alone with this anxiety. Let\'s take it one moment at a time.',
      ],
      'neutral': [
        'Thank you for sharing. How can I support you today?',
        'I\'m here to listen. What\'s on your mind?',
        'Is there something specific you\'d like to talk about?',
      ],
    };

    final emotionResponses = responses[emotion] ?? responses['neutral']!;
    return emotionResponses[DateTime.now().millisecond % emotionResponses.length];
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Support Chat'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.arrow_back_ios_new),
        ),
        actions: [
          IconButton(
            onPressed: () => context.go('/support'),
            icon: const Icon(Icons.help_outline),
            tooltip: 'Request Support',
          ),
        ],
      ),
      body: Column(
        children: [
          // Chat messages
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length && _isTyping) {
                  return _TypingIndicator();
                }
                final message = _messages[index];
                return _ChatBubble(message: message);
              },
            ),
          ),
          
          // Input area
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              border: Border(top: BorderSide(color: AppTheme.border)),
            ),
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    height: 36,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _quickReplies.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, i) {
                        final reply = _quickReplies[i];
                        return ActionChip(
                          label: Text(reply),
                          onPressed: _loading ? null : () => _sendQuickReply(reply),
                          backgroundColor: AppTheme.secondary100,
                          side: BorderSide(color: AppTheme.border),
                          labelStyle: Theme.of(context).textTheme.bodySmall,
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          decoration: InputDecoration(
                            hintText: 'Type a message...',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide: BorderSide.none,
                            ),
                            filled: true,
                            fillColor: AppTheme.secondary100,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          ),
                          onSubmitted: (_) => _sendMessage(),
                          maxLines: null,
                          textInputAction: TextInputAction.send,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [AppTheme.primary500, AppTheme.primary700],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primary500.withOpacity(0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          borderRadius: BorderRadius.circular(24),
                          child: InkWell(
                            onTap: _loading ? null : _sendMessage,
                            borderRadius: BorderRadius.circular(24),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: _loading
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                      ),
                                    )
                                  : const Icon(Icons.send, color: Colors.white, size: 20),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  final String? emotion;
  final double? confidence;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.emotion,
    this.confidence,
  });
}

class _ChatBubble extends StatelessWidget {
  final ChatMessage message;

  const _ChatBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: message.isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!message.isUser) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: AppTheme.primary100,
              child: const Icon(Icons.eco, size: 16, color: AppTheme.primary500),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: message.isUser ? AppTheme.primary500 : AppTheme.surface,
                borderRadius: BorderRadius.circular(20).copyWith(
                  bottomRight: message.isUser ? const Radius.circular(4) : const Radius.circular(20),
                  bottomLeft: message.isUser ? const Radius.circular(20) : const Radius.circular(4),
                ),
                border: message.isUser ? null : Border.all(color: AppTheme.border),
                boxShadow: [
                  BoxShadow(
                    color: (message.isUser ? AppTheme.primary500 : Colors.black).withOpacity(message.isUser ? 0.25 : 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message.text,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: message.isUser ? Colors.white : AppTheme.textPrimary,
                      height: 1.5,
                    ),
                  ),
                  if (message.emotion != null && !message.isUser) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Detected: ${message.emotion!.toUpperCase()} (${(message.confidence! * 100).toStringAsFixed(0)}%)',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppTheme.primary700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (message.isUser) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: AppTheme.primary500,
              child: const Icon(Icons.person, size: 16, color: Colors.white),
            ),
          ],
        ],
      ),
    );
  }
}

class _TypingIndicator extends StatefulWidget {
  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late List<Animation<double>> _dotAnimations;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    )..repeat();
    
    _dotAnimations = List.generate(3, (i) => Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Interval(i * 0.2, 0.8 + i * 0.2, curve: Curves.easeInOut),
      ),
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: AppTheme.primary100,
            child: const Icon(Icons.eco, size: 16, color: AppTheme.primary500),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(20).copyWith(
                bottomLeft: const Radius.circular(4),
              ),
              border: Border.all(color: AppTheme.border),
            ),
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(3, (i) {
                    return AnimatedBuilder(
                      animation: _dotAnimations[i],
                      builder: (context, child) {
                        return Opacity(
                          opacity: _dotAnimations[i].value,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2),
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: AppTheme.textMuted,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        );
                      },
                    );
                  }),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}