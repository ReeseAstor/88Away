import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Romance-themed color palette
        romance: {
          // Primary Romance Colors
          burgundy: {
            50: "#fdf2f8",
            100: "#fce7f3",
            200: "#fbcfe8",
            300: "#f9a8d4",
            400: "#f472b6",
            500: "#ec4899",
            600: "#db2777",
            700: "#be185d",
            800: "#9d174d",
            900: "#831843",
            950: "#500724",
          },
          "rose-gold": {
            50: "#fefcfb",
            100: "#fef7f0",
            200: "#fcebe0",
            300: "#f9d5c1",
            400: "#f4b896",
            500: "#ee9968",
            600: "#e17d47",
            700: "#cf6532",
            800: "#ac522b",
            900: "#8b4526",
            950: "#4b2111",
          },
          blush: {
            50: "#fef7f7",
            100: "#feecec",
            200: "#fddede",
            300: "#fbc5c5",
            400: "#f79e9e",
            500: "#f07575",
            600: "#e25555",
            700: "#c73e3e",
            800: "#a53434",
            900: "#892f2f",
            950: "#4a1515",
          },
          champagne: {
            50: "#fefef9",
            100: "#fefce8",
            200: "#fef7c3",
            300: "#feed8e",
            400: "#fcdd57",
            500: "#f9c23c",
            600: "#f0a315",
            700: "#cc7914",
            800: "#a35f17",
            900: "#865019",
            950: "#4c2a0b",
          },
        },
        // Emotional gradients for romance themes
        passion: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        tender: {
          50: "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
          950: "#4a044e",
        },
        sensual: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      fontFamily: {
        // Romance-optimized typography
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"], // Elegant serif for headings
        script: ["var(--font-script)", "Dancing Script", "cursive"], // Script font for romantic elements
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        // Romance-specific text sizes
        'romantic-xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
        'romantic-sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        'romantic-base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.01em' }],
        'romantic-lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.01em' }],
        'romantic-xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0.0125em' }],
        'romantic-2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0.0125em' }],
        'romantic-3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '0.015em' }],
        'romantic-4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '0.02em' }],
      },
      boxShadow: {
        // Romance-themed shadows
        'romance-sm': '0 1px 2px 0 rgba(219, 39, 119, 0.05)',
        'romance': '0 1px 3px 0 rgba(219, 39, 119, 0.1), 0 1px 2px 0 rgba(219, 39, 119, 0.06)',
        'romance-md': '0 4px 6px -1px rgba(219, 39, 119, 0.1), 0 2px 4px -1px rgba(219, 39, 119, 0.06)',
        'romance-lg': '0 10px 15px -3px rgba(219, 39, 119, 0.1), 0 4px 6px -2px rgba(219, 39, 119, 0.05)',
        'romance-xl': '0 20px 25px -5px rgba(219, 39, 119, 0.1), 0 10px 10px -5px rgba(219, 39, 119, 0.04)',
        'romance-2xl': '0 25px 50px -12px rgba(219, 39, 119, 0.25)',
        'romance-inner': 'inset 0 2px 4px 0 rgba(219, 39, 119, 0.06)',
        'glow-romantic': '0 0 20px rgba(219, 39, 119, 0.3)',
      },
      backgroundImage: {
        // Romance gradient patterns
        'gradient-romance': 'linear-gradient(135deg, var(--romance-burgundy-500), var(--romance-rose-gold-400))',
        'gradient-passion': 'linear-gradient(135deg, var(--passion-600), var(--passion-400))',
        'gradient-tender': 'linear-gradient(135deg, var(--tender-500), var(--romance-blush-400))',
        'gradient-romantic-radial': 'radial-gradient(ellipse at center, var(--romance-champagne-200), var(--romance-blush-100))',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        // Romance-themed animations
        "romantic-pulse": {
          "0%, 100%": {
            opacity: "1",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "0.8",
            transform: "scale(1.05)",
          },
        },
        "romantic-float": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-6px)",
          },
        },
        "heart-beat": {
          "0%, 14%": {
            transform: "scale(1)",
          },
          "7%": {
            transform: "scale(1.3)",
          },
          "21%": {
            transform: "scale(1)",
          },
          "28%": {
            transform: "scale(1.3)",
          },
          "35%": {
            transform: "scale(1)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "romantic-pulse": "romantic-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "romantic-float": "romantic-float 3s ease-in-out infinite",
        "heart-beat": "heart-beat 1.5s ease-in-out infinite",
      },
      spacing: {
        // Romance-specific spacing
        'romantic': '1.125rem', // 18px
        'romantic-sm': '0.875rem', // 14px
        'romantic-lg': '1.375rem', // 22px
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
