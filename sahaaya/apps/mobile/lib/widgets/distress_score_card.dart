import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';
import 'radial_distress_gauge.dart';

class DistressScoreCard extends StatelessWidget {
  final double score;
  final String band;
  final String bandLabel;
  final Color bandColor;
  final String trend;
  final int escalation7d;
  final VoidCallback? onTap;

  const DistressScoreCard({
    super.key,
    required this.score,
    required this.band,
    required this.bandLabel,
    required this.bandColor,
    required this.trend,
    required this.escalation7d,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final trendIcon = trend == 'worsening' 
        ? Icons.trending_up 
        : trend == 'improving' 
            ? Icons.trending_down 
            : Icons.trending_flat;
    final trendColor = trend == 'worsening' 
        ? bandColor 
        : trend == 'improving' 
            ? AppTheme.distressGreen 
            : AppTheme.textMuted;

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Current Distress Level',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: bandColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: bandColor.withOpacity(0.3)),
                        ),
                        child: Text(
                          bandLabel,
                          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            color: bandColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(trendIcon, size: 16, color: trendColor),
                          const SizedBox(width: 4),
                          Text(
                            trend.toUpperCase(),
                            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                              color: trendColor,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$escalation7d% 7-day risk',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Score display
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  RadialDistressGauge(score: score, band: band, size: GaugeSize.lg),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          score.toStringAsFixed(1),
                          style: Theme.of(context).textTheme.displayMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: bandColor,
                            letterSpacing: -0.02,
                          ),
                        ),
                        Text(
                          'out of 100',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Band markers
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _BandMarker(label: 'Green', color: AppTheme.distressGreen, threshold: 30),
                  _BandMarker(label: 'Yellow', color: AppTheme.distressYellow, threshold: 50),
                  _BandMarker(label: 'Orange', color: AppTheme.distressOrange, threshold: 75),
                  _BandMarker(label: 'Red', color: AppTheme.distressRed, threshold: 100),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Tap hint
              Center(
                child: Text(
                  'Tap to view detailed breakdown',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textMuted,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BandMarker extends StatelessWidget {
  final String label;
  final Color color;
  final int threshold;

  const _BandMarker({
    required this.label,
    required this.color,
    required this.threshold,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.3),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '$label\n($threshold)',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: AppTheme.textMuted,
            height: 1.2,
          ),
        ),
      ],
    );
  }
}