/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Semantic palettes for your theme
      colors: {
        // Brand red (primary accent across the app)
        brand: {
          DEFAULT: "#E71D36", // crimson red essence
          50:  "#FFE9EC",
          100: "#FFD2D6",
          200: "#FF9FAA",
          300: "#FF6B81",
          400: "#FF3D5C",
          500: "#E71D36",
          600: "#C3162B",
          700: "#9E1022",
          800: "#7A0B19",
          900: "#560711",
          950: "#34040A",
        },

        // Blacks / near-blacks for backgrounds and surfaces
        ink: {
          50:  "#A1A7B3",
          100: "#6B7280",
          200: "#4B525E",
          300: "#3A4049",
          400: "#2E333B",
          500: "#262A30",
          600: "#1E2125",
          700: "#17191C",
          800: "#111214",
          900: "#0B0B0C",
          950: "#050506",
        },

        // Whites / off-whites for text and elevated surfaces
        paper: {
          50:  "#FFFFFF",
          100: "#FAFAFB",
          200: "#F4F5F7",
          300: "#EAECEF",
          400: "#DFE3E8",
          500: "#D4D9E0",
        },

        // Convenient aliases for gradients and utilities
        "brand-start": "#FF2B44",
        "brand-end":   "#B3001B",
        "ink-start":   "#0B0B0C",
        "ink-end":     "#1E2125",
        "paper-start": "#FFFFFF",
        "paper-end":   "#EAECEF",
      },

      backgroundImage: {
        "brand-gradient": "linear-gradient(90deg, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%)",
      },

      keyframes: {
        scroll: {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-20px)" },
        },
      },

      animation: {
        scroll: "scroll 20s linear infinite",
        float: "float 6s ease-in-out infinite",
      },

      // Nice defaults for layout consistency
      container: {
        center: true,
        padding: "1rem",
      },

      // Optional: subtle ring/shadow tuned for dark UI with red accent
      ringColor: {
        DEFAULT: "#E71D36",
      },
      boxShadow: {
        "elev-1": "0 1px 2px 0 rgba(0,0,0,0.5)",
        "elev-2": "0 4px 12px -2px rgba(0,0,0,0.55)",
      },
    },
  },
  plugins: [],
};

// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         'gold-light': '#FFD700',
//         'gold-medium': '#FFC107',
//         'gold-dark': '#FF8C00',
//         'bronze': '#CD7F32',
//         'champagne': '#F7E7CE',
//         'golden-sand': '#DAA520',
//         'amber': '#FFBF00',

//         // Gradient Color Stops (Moved Inside Colors)
//         'gold-start': '#FFD700',
//         'gold-end': '#FF8C00',
//         'bronze-start': '#CD7F32',
//         'bronze-end': '#FFD700',
//         'champagne-start': '#F7E7CE',
//         'champagne-end': '#FFD700',
//         'sand-start': '#DAA520',
//         'sand-end': '#FFC107',
//         'amber-start': '#FFBF00',
//         'amber-end': '#FF8C00',
//       },
//       keyframes: {
//         scroll: {
//           '0%': { transform: 'translateX(100%)' },
//           '100%': { transform: 'translateX(-100%)' },
//         },
//         float: {
//           '0%, 100%': { transform: 'translateY(0)' },
//           '50%': { transform: 'translateY(-20px)' },
//         },
//       },
//       animation: {
//         scroll: 'scroll 15s linear infinite',
//         scrollfast: 'scroll 10s linear infinite',
//         float: 'float 6s ease-in-out infinite',
//       },
//     },
//   },
//   plugins: [],
// };

