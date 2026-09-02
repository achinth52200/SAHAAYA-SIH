import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Leafcare-inspired color palette
  static const Color primary50 = Color(0xFFF0F5F1);
  static const Color primary100 = Color(0xFFDCEADF);
  static const Color primary200 = Color(0xFFBAD4BF);
  static const Color primary300 = Color(0xFF8EB996);
  static const Color primary400 = Color(0xFF5E9A6D);
  static const Color primary500 = Color(0xFF3E7C59); // Main sage/forest green
  static const Color primary600 = Color(0xFF316649);
  static const Color primary700 = Color(0xFF274E3A);
  static const Color primary800 = Color(0xFF1F3D30);
  static const Color primary900 = Color(0xFF1A3328);

  static const Color secondary50 = Color(0xFFFDFDFB);
  static const Color secondary100 = Color(0xFFF6F5EF); // Soft cream background
  static const Color secondary200 = Color(0xFFECEAE0);
  static const Color secondary300 = Color(0xFFDDDAC6);
  static const Color secondary400 = Color(0xFFC9C4A3);
  static const Color secondary500 = Color(0xFFB3AB80);

  // Distress bands - desaturated for calm but legible
  static const Color distressGreen = Color(0xFF4E9E6B);    // Stable
  static const Color distressYellow = Color(0xFFE8A23D);   // Mild concern
  static const Color distressOrange = Color(0xFFE8703D);   // Significant concern
  static const Color distressRed = Color(0xFFD9534F);      // Urgent (desaturated)

  // Semantic colors
  static const Color background = secondary100;
  static const Color surface = Colors.white;
  static const Color textPrimary = Color(0xFF1F2A24); // Charcoal
  static const Color textSecondary = Color(0xFF4A5D50);
  static const Color textMuted = Color(0xFF7A8D7F);
  static const Color border = Color(0xFFD4D8D5);
  static const Color focus = primary500;

  // Shadows
  static const BoxShadow softShadow = BoxShadow(
    color: Color(0x0F1F2A24),
    blurRadius: 8,
    offset: Offset(0, 2),
  );
  static const BoxShadow cardShadow = BoxShadow(
    color: Color(0x141F2A24),
    blurRadius: 16,
    offset: Offset(0, 4),
  );
  static const BoxShadow elevatedShadow = BoxShadow(
    color: Color(0x1A1F2A24),
    blurRadius: 32,
    offset: Offset(0, 8),
  );

  static ThemeData get lightTheme {
    final base = ThemeData.light();
    return base.copyWith(
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      colorScheme: ColorScheme.light(
        primary: primary500,
        secondary: primary400,
        surface: surface,
        background: background,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: textPrimary,
        onBackground: textPrimary,
        error: distressRed,
        onError: Colors.white,
      ),
      textTheme: GoogleFonts.interTextTheme(base.textTheme).copyWith(
        displayLarge: GoogleFonts.poppins(
          fontSize: 48,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.02,
          color: textPrimary,
        ),
        displayMedium: GoogleFonts.poppins(
          fontSize: 36,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.02,
          color: textPrimary,
        ),
        displaySmall: GoogleFonts.poppins(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.01,
          color: textPrimary,
        ),
        headlineLarge: GoogleFonts.poppins(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        headlineMedium: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        headlineSmall: GoogleFonts.poppins(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        titleLarge: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        titleMedium: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        titleSmall: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          height: 1.7,
          color: textPrimary,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          height: 1.6,
          color: textPrimary,
        ),
        bodySmall: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          height: 1.5,
          color: textSecondary,
        ),
        labelLarge: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        labelMedium: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textSecondary,
        ),
        labelSmall: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: textMuted,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        iconTheme: const IconThemeData(color: textPrimary),
        actionsIconTheme: const IconThemeData(color: textPrimary),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: border, width: 1),
        ),
        shadowColor: Colors.transparent,
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary500,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ).copyWith(
          overlayColor: WidgetStateProperty.resolveWith<Color?>(
            (states) {
              if (states.contains(WidgetState.pressed)) {
                return primary700;
              }
              if (states.contains(WidgetState.hovered)) {
                return primary600;
              }
              return null;
            },
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary500,
          side: const BorderSide(color: primary500, width: 2),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary500,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: border, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: border, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: focus, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: distressRed, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: distressRed, width: 2),
        ),
        labelStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        hintStyle: GoogleFonts.inter(
          fontSize: 14,
          color: textMuted,
        ),
        floatingLabelStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: focus,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: secondary100,
        selectedColor: primary100,
        labelStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        secondaryLabelStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: Colors.white,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
        ),
        side: const BorderSide(color: border),
      ),
      dividerTheme: DividerThemeData(
        color: border,
        thickness: 1,
        space: 1,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: primary500,
        unselectedItemColor: textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
        unselectedLabelStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w400,
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        elevation: 16,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        contentTextStyle: GoogleFonts.inter(
          fontSize: 14,
          color: textSecondary,
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: textPrimary,
        contentTextStyle: GoogleFonts.inter(
          fontSize: 14,
          color: Colors.white,
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        actionTextColor: primary300,
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: textPrimary,
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: GoogleFonts.inter(
          fontSize: 12,
          color: Colors.white,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }

  static ThemeData get darkTheme {
    return lightTheme.copyWith(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF161E1A),
      colorScheme: ColorScheme.dark(
        primary: primary400,
        secondary: primary300,
        surface: const Color(0xFF1F2A24),
        background: const Color(0xFF161E1A),
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: Colors.white,
        onBackground: Colors.white,
        error: distressRed,
        onError: Colors.white,
      ),
      cardTheme: CardThemeData(
        color: const Color(0xFF1F2A24),
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: BorderSide(color: Colors.white.withOpacity(0.1), width: 1),
        ),
        shadowColor: Colors.transparent,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: const Color(0xFF161E1A),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
    );
  }
}