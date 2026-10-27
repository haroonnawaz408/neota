export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#063D32',
          dark: '#082F28',
          light: '#114D41'
        },
        emerald: {
          DEFAULT: '#063D32',
          dark: '#082F28',
          light: '#1B4D40'
        },
        ivory: {
          DEFAULT: '#FAF7EF',
          dark: '#F3EBDD'
        },
        cream: {
          DEFAULT: '#F3EBDD',
          light: '#F8F4EC'
        },
        sand: '#E8E0D1',
        border: '#E8E0D1',
        gold: {
          DEFAULT: '#D7B36A',
          hover: '#C59F54',
          light: '#F8F3E8',
          border: '#E4CCA1'
        },
        sage: {
          DEFAULT: '#27845B',
          light: '#DCE9DE',
          dark: '#1C6B48'
        },
        ink: '#202A25',
        taupe: '#77776E',
        // Backward-compatibility aliases mapped to new luxury tokens
        brown: {
          DEFAULT: '#063D32',
          dark: '#082F28',
          light: '#114D41'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', '"Manrope"', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        card: '0 2px 14px 0 rgba(21, 60, 50, 0.04)',
        elevated: '0 10px 30px -4px rgba(21, 60, 50, 0.08)'
      }
    }
  }
}
