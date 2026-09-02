import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../theme/app_theme.dart';
import '../../widgets/radial_distress_gauge.dart';

class DistressTrendScreen extends StatefulWidget {
  const DistressTrendScreen({super.key});

  @override
  State<DistressTrendScreen> createState() => _DistressTrendScreenState();
}

class _DistressTrendScreenState extends State<DistressTrendScreen> with TickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  String _timeRange = '30d';
  final List<Map<String, dynamic>> _mockHistory = List.generate(30, (i) {
    final date = DateTime.now().subtract(Duration(days: 29 - i));
    final baseScore = 30 + (i * 1.2) + (i % 7 * 3);
    return {
      'date': date,
      'score': (baseScore + (i % 3 * 5)).clamp(0, 100).toDouble(),
    };
  });

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
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color _getBandColor(double score) {
    if (score < 30) return AppTheme.distressGreen;
    if (score < 50) return AppTheme.distressYellow;
    if (score < 75) return AppTheme.distressOrange;
    return AppTheme.distressRed;
  }

  String _getBand(double score) {
    if (score < 30) return 'Green';
    if (score < 50) return 'Yellow';
    if (score < 75) return 'Orange';
    return 'Red';
  }

  String _getBandLabel(double score) {
    if (score < 30) return 'Stable';
    if (score < 50) return 'Mild Concern';
    if (score < 75) return 'Significant Concern';
    return 'Urgent Review';
  }

  @override
  Widget build(BuildContext context) {
    final latestScore = _mockHistory.last['score'] as double;
    final latestBand = _getBandLabel(latestScore);
    final bandColor = _getBandColor(latestScore);
    final weekAgo = _mockHistory[_mockHistory.length - 8]['score'] as double;
    final change = latestScore - weekAgo;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Distress Trend'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.arrow_back_ios_new),
        ),
      ),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: CustomScrollView(
          slivers: [
            // Header with current score
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        RadialDistressGauge(
                          score: latestScore,
                          band: _getBand(latestScore),
                          size: GaugeSize.lg,
                        ),
                        const SizedBox(width: 20),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Current Distress Score',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: bandColor.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(999),
                                  border: Border.all(color: bandColor.withOpacity(0.3)),
                                ),
                                child: Text(
                                  latestBand,
                                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                    color: bandColor,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Icon(
                                    change > 0 ? Icons.trending_up : change < 0 ? Icons.trending_down : Icons.trending_flat,
                                    color: change > 0 ? AppTheme.distressRed : change < 0 ? AppTheme.distressGreen : AppTheme.textMuted,
                                    size: 18,
                                  ),
                                  const SizedBox(width: 6),
                                  Flexible(
                                    child: Text(
                                      '${change > 0 ? '+' : ''}${change.toStringAsFixed(1)} vs last week',
                                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: change > 0 ? AppTheme.distressRed : change < 0 ? AppTheme.distressGreen : AppTheme.textSecondary,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Time range selector
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    for (final range in ['7d', '30d', '90d'])
                      Padding(
                        padding: EdgeInsets.only(right: range == '90d' ? 0 : 8),
                        child: FilterChip(
                          label: Text(range),
                          selected: _timeRange == range,
                          onSelected: (selected) => setState(() => _timeRange = range),
                          selectedColor: AppTheme.primary100,
                          checkmarkColor: AppTheme.primary500,
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // Chart
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Distress Trend ($_timeRange)',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          height: 300,
                          child: LineChart(
                            LineChartData(
                              gridData: FlGridData(
                                show: true,
                                drawVerticalLine: false,
                                horizontalInterval: 20,
                                getDrawingHorizontalLine: (value) => FlLine(
                                  color: AppTheme.border.withOpacity(0.5),
                                  strokeWidth: 1,
                                  dashArray: [5, 5],
                                ),
                              ),
                              titlesData: FlTitlesData(
                                show: true,
                                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                bottomTitles: AxisTitles(
                                  sideTitles: SideTitles(
                                    showTitles: true,
                                    reservedSize: 30,
                                    interval: 6,
                                    getTitlesWidget: (value, meta) {
                                      if (value.toInt() % 6 != 0) return const SizedBox();
                                      final date = _mockHistory[value.toInt()]['date'] as DateTime;
                                      return Padding(
                                        padding: const EdgeInsets.only(top: 8),
                                        child: Text(
                                          '${date.day}/${date.month}',
                                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: AppTheme.textMuted,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                                leftTitles: AxisTitles(
                                  sideTitles: SideTitles(
                                    showTitles: true,
                                    interval: 20,
                                    reservedSize: 40,
                                    getTitlesWidget: (value, meta) {
                                      return Padding(
                                        padding: const EdgeInsets.only(right: 8),
                                        child: Text(
                                          value.toInt().toString(),
                                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: AppTheme.textMuted,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ),
                              borderData: FlBorderData(show: false),
                              minX: 0,
                              maxX: (_mockHistory.length - 1).toDouble(),
                              minY: 0,
                              maxY: 100,
                              lineBarsData: [
                                LineChartBarData(
                                  spots: _mockHistory.asMap().entries.map((e) =>
                                    FlSpot(e.key.toDouble(), e.value['score'])).toList(),
                                  isCurved: true,
                                  gradient: LinearGradient(
                                    colors: [AppTheme.primary500, AppTheme.primary400],
                                  ),
                                  barWidth: 3,
                                  isStrokeCapRound: true,
                                  dotData: FlDotData(
                                    show: true,
                                    getDotPainter: (spot, percent, barData, index) {
                                      return FlDotCirclePainter(
                                        radius: 4,
                                        color: _getBandColor(spot.y),
                                        strokeWidth: 2,
                                        strokeColor: Colors.white,
                                      );
                                    },
                                  ),
                                  belowBarData: BarAreaData(
                                    show: true,
                                    gradient: LinearGradient(
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                      colors: [
                                        AppTheme.primary500.withOpacity(0.3),
                                        AppTheme.primary500.withOpacity(0.0),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Band legend
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _LegendItem(label: 'Stable', color: AppTheme.distressGreen, range: '0–29'),
                            _LegendItem(label: 'Mild', color: AppTheme.distressYellow, range: '30–49'),
                            _LegendItem(label: 'Significant', color: AppTheme.distressOrange, range: '50–74'),
                            _LegendItem(label: 'Urgent', color: AppTheme.distressRed, range: '75–100'),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Insights
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Insights',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _InsightCard(
                      icon: Icons.trending_up,
                      color: AppTheme.distressOrange,
                      title: 'Increasing Trend',
                      description: 'Your distress score has increased by ${change.toStringAsFixed(1)} points over the past week.',
                    ),
                    const SizedBox(height: 12),
                    _InsightCard(
                      icon: Icons.schedule,
                      color: AppTheme.primary500,
                      title: 'Check-in Consistency',
                      description: 'You\'ve completed ${_mockHistory.length} check-ins this period. Consistent tracking helps detect patterns early.',
                    ),
                    const SizedBox(height: 12),
                    _InsightCard(
                      icon: Icons.psychology,
                      color: AppTheme.primary500,
                      title: 'Personal Baseline',
                      description: 'Your personal baseline is 30.0. Current score is ${(latestScore - 30).toStringAsFixed(1)} points above baseline.',
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  final String label;
  final Color color;
  final String range;

  const _LegendItem({
    required this.label,
    required this.color,
    required this.range,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600)),
        Text(range, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.textMuted)),
      ],
    );
  }
}

class _InsightCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String description;

  const _InsightCard({
    required this.icon,
    required this.color,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(description, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
