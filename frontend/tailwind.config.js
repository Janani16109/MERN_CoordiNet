module.exports = {
  content: [
    './index.html',
    './src/**/*.jsx',
    './src/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A1B3A',
        accent: '#00E5FF',
        secondary: '#2E2E3A',
        highlight: '#FF3C7E'
      }
    }
  },
  plugins: [],
};
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A1B3A',
        accent: '#00E5FF',
        secondary: '#2E2E3A',
        highlight: '#FF3C7E'
      },
      boxShadow: {
        'neon-sm': '0 8px 30px rgba(0,229,255,0.08)',
      }
    }
  },
  plugins: []
};
