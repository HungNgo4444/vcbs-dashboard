export const theme = {
  colors: {
    // Primary - Forest Green
    primary: {
      900: '#081C15',
      800: '#1B4332',
      700: '#2D6A4F',
      600: '#40916C',
      500: '#52B788',
      400: '#74C69D',
      300: '#95D5B2',
      200: '#B7E4C7',
      100: '#D8F3DC',
      50: '#F0FDF4',
    },
    // Sentiment colors
    sentiment: {
      positive: {
        bg: '#D8F3DC',
        text: '#1B4332',
        border: '#95D5B2',
      },
      negative: {
        bg: '#FFE5E5',
        text: '#C41E3A',
        border: '#FFB3B3',
      },
      neutral: {
        bg: '#F5F5F5',
        text: '#666666',
        border: '#DDDDDD',
      },
    },
    // Channel colors
    channel: {
      'Báo mạng': { bg: '#E8F5E9', text: '#1B4332' },
      'Facebook': { bg: '#E3F2FD', text: '#1565C0' },
      'Youtube': { bg: '#FFEBEE', text: '#C62828' },
      'Tiktok': { bg: '#FCE4EC', text: '#AD1457' },
    },
    // Chart colors
    chart: {
      line: ['#1B4332', '#2D6A4F', '#40916C', '#52B788'],
      bar: ['#1B4332', '#40916C', '#74C69D'],
    },
  },
  gradients: {
    header: 'linear-gradient(135deg, #081C15 0%, #1B4332 40%, #2D6A4F 100%)',
    card: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
    button: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
    accent: 'linear-gradient(180deg, #1B4332 0%, #52B788 100%)',
    background: 'linear-gradient(180deg, #F0FDF4 0%, #F8FDF9 50%, #fff 100%)',
  },
  shadows: {
    card: '0 4px 24px rgba(27, 67, 50, 0.06)',
    cardHover: '0 10px 40px rgba(27, 67, 50, 0.15)',
    button: '0 4px 12px rgba(27, 67, 50, 0.2)',
    header: '0 4px 30px rgba(0, 0, 0, 0.15)',
  },
};
