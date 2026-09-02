import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

enum GaugeSize { xs, sm, md, lg }

class _GaugeSpec {
  final double box;
  final double stroke;
  final bool showScore;
  final double fontSize;

  const _GaugeSpec({required this.box, required this.stroke, required this.showScore, required this.fontSize});
}

const Map<GaugeSize, _GaugeSpec> _specs = {
  GaugeSize.xs: _GaugeSpec(box: 32, stroke: 4, showScore: false, fontSize: 10),
  GaugeSize.sm: _GaugeSpec(box: 48, stroke: 5, showScore: true, fontSize: 13),
  GaugeSize.md: _GaugeSpec(box: 84, stroke: 7, showScore: true, fontSize: 22),
  GaugeSize.lg: _GaugeSpec(box: 132, stroke: 10, showScore: true, fontSize: 34),
};

/// SAHAAYA's signature score visualization — a 270-degree arc gauge, band-colored,
/// used consistently anywhere a distress score appears across the app.
class RadialDistressGauge extends StatefulWidget {
  final double score;
  final String band;
  final GaugeSize size;
  final bool showLabel;

  const RadialDistressGauge({
    super.key,
    required this.score,
    required this.band,
    this.size = GaugeSize.md,
    this.showLabel = false,
  });

  static Color colorForBand(String band) {
    switch (band) {
      case 'Green':
        return AppTheme.distressGreen;
      case 'Yellow':
        return AppTheme.distressYellow;
      case 'Orange':
        return AppTheme.distressOrange;
      case 'Red':
        return AppTheme.distressRed;
      default:
        return AppTheme.textMuted;
    }
  }

  static String labelForBand(String band) {
    switch (band) {
      case 'Green':
        return 'Stable';
      case 'Yellow':
        return 'Mild';
      case 'Orange':
        return 'Significant';
      case 'Red':
        return 'Urgent';
      default:
        return band;
    }
  }

  @override
  State<RadialDistressGauge> createState() => _RadialDistressGaugeState();
}

class _RadialDistressGaugeState extends State<RadialDistressGauge> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: const Duration(milliseconds: 900), vsync: this);
    _animation = Tween<double>(begin: 0, end: widget.score.clamp(0, 100)).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
    _controller.forward();
  }

  @override
  void didUpdateWidget(covariant RadialDistressGauge oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.score != widget.score) {
      _animation = Tween<double>(begin: oldWidget.score.clamp(0, 100), end: widget.score.clamp(0, 100)).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
      );
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final spec = _specs[widget.size]!;
    final color = RadialDistressGauge.colorForBand(widget.band);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: spec.box,
          height: spec.box,
          child: AnimatedBuilder(
            animation: _animation,
            builder: (context, child) {
              return CustomPaint(
                painter: _GaugePainter(value: _animation.value, color: color, strokeWidth: spec.stroke),
                child: spec.showScore
                    ? Center(
                        child: Text(
                          _animation.value.round().toString(),
                          style: TextStyle(
                            fontFamily: 'Poppins',
                            fontSize: spec.fontSize,
                            fontWeight: FontWeight.w700,
                            color: color,
                          ),
                        ),
                      )
                    : null,
              );
            },
          ),
        ),
        if (widget.showLabel) ...[
          const SizedBox(height: 4),
          Text(
            RadialDistressGauge.labelForBand(widget.band),
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color),
          ),
        ],
      ],
    );
  }
}

class _GaugePainter extends CustomPainter {
  final double value; // 0-100
  final Color color;
  final double strokeWidth;

  _GaugePainter({required this.value, required this.color, required this.strokeWidth});

  static const double _startAngle = 135 * math.pi / 180; // start at bottom-left
  static const double _sweepTotal = 270 * math.pi / 180; // 270-degree arc

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (math.min(size.width, size.height) - strokeWidth) / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);

    final trackPaint = Paint()
      ..color = AppTheme.secondary200
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(rect, _startAngle, _sweepTotal, false, trackPaint);

    final valuePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    final sweep = _sweepTotal * (value.clamp(0, 100) / 100);
    canvas.drawArc(rect, _startAngle, sweep, false, valuePaint);
  }

  @override
  bool shouldRepaint(covariant _GaugePainter oldDelegate) {
    return oldDelegate.value != value || oldDelegate.color != color || oldDelegate.strokeWidth != strokeWidth;
  }
}
