/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#0E3024',
          50: '#06140E',
          100: '#0B231A',
          200: '#12382B',
          300: '#1B4D3E',
          400: '#2D6A4F',
          500: '#40916C',
          light: '#52B788',
        },
        earth: {
          DEFAULT: '#1A110B',
          50: '#0F0906',
          100: '#170E08',
          200: '#22150E',
          300: '#322015',
          400: '#4A3020',
          warm: '#7A5C3E',
          caramel: '#A67C52',
          tan: '#D4A373',
          light: '#EAD7C3',
        },
        gold: {
          DEFAULT: '#D4AF37',
          soft: '#E5C651',
          deep: '#B8941F',
          champagne: '#F0C060',
          amber: '#C9922A',
        },
        ivory: {
          DEFAULT: '#FBF7F0',
          dim: '#E8DFC8',
          muted: '#A39E93',
        },
        ink: {
          DEFAULT: '#06120C',
          50: '#030A06',
          100: '#091A12',
          200: '#0E281C',
          300: '#143827',
        },
        snow: {
          DEFAULT: '#FBF7F0',
          muted: '#E8DFC8',
          dim: '#A39E93',
        },
        hotpink: {
          DEFAULT: '#D4AF37',
          soft: '#F0C060',
          deep: '#B8941F',
          glow: '#E5C651',
        },
        error: {
          DEFAULT: '#EF4444',
          soft: '#F87171',
          dim: '#B91C1C',
        },
        success: {
          DEFAULT: '#52B788',
          soft: '#74C69D',
          dim: '#2D6A4F',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Cormorant Garamond', 'serif'],
        body: ['Outfit', 'Inter', 'sans-serif'],
      },
      borderColor: {
        goldline: 'rgba(212,175,55,0.25)',
        forestline: 'rgba(45,106,79,0.30)',
        earthline: 'rgba(166,124,82,0.22)',
        pinkline: 'rgba(212,175,55,0.25)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '22px',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(212,175,55,0.25), 0 8px 30px -8px rgba(11,35,26,0.6)',
        'glow-strong': '0 0 0 1px rgba(212,175,55,0.40), 0 12px 40px -6px rgba(212,175,55,0.25)',
        'gold-glow': '0 0 0 1px rgba(212,175,55,0.35), 0 8px 30px -8px rgba(212,175,55,0.25)',
        'forest-glow': '0 0 0 1px rgba(82,183,136,0.35), 0 8px 30px -8px rgba(14,48,36,0.4)',
      },
    },
  },
  plugins: [],
};
