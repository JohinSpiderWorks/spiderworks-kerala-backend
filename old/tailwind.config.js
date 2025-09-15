
module.exports = {
  content: [
    "./views/**/*.ejs",  // Include all .ejs files in the views directory and subdirectories
    "./public/**/*.js",  // Include any JavaScript files in the public directory if you're using Tailwind in JS
    "./src/**/*.js",     // Include JS files if your code is structured under src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
