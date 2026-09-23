export default {
  content: [
    './index.html', 
    './src/**/*.{js,jsx,ts,tsx}', 
  ],
  darkMode: 'class',
  theme: {
    extend: { 
      colors:{
        "darkmoss": "#294240",
        "lightmoss": "#D3C6AB",
        "yellowmoss": "#959165",
        "darkorange": "#E87A30",
        "lightorange": "#FFB347",
        "mutedlavendar": "#A59EB3",
        "darkscarlet": "#E65C4C",
        "lightbeige": "#FDECBF",
        "babyyellow": "#FFEC8F",
      },
      fontFamily:{
        dmsans: ["DM Sans", "sans-serif"],
        shippori: ["Shippori Antique B1", "sans-serif"],
      }, 
      content:{
        headline_graphic: "url('/src/assets/sample-headline-graphic.svg')",
      }, 
      screens: {
        'xs': '480px',
        'sm': '768px',
        'md': '1060px',
      },
    },
  },
  plugins: [],
};
