const { build } = require('esbuild')
const esbuildPluginPino = require('esbuild-plugin-pino')

build({
  entryPoints: ['server.ts'],
  outdir: 'dist',
  platform: 'node',
  format: 'cjs',
  bundle: true,
  plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
}).catch(() => process.exit(1))


// const { build } = require('esbuild');
// const esbuildPluginPino = require('esbuild-plugin-pino');

// // Entry points for the build
// const entryPoints = ['server.ts'];

// console.log('Entry Points:', entryPoints);

// build({
//   entryPoints: entryPoints,
//   outdir: 'dist',
//   platform: 'node',
//   format: 'cjs',
//   bundle: true,
//   plugins: [esbuildPluginPino({ transports: ['pino-pretty'] })],
// })
// .then(() => {
//   console.log('Build completed successfully');
// })
// .catch((error) => {
//   console.error('Build failed with an error:', error)
//   if (error.errors) {
//     error.errors.forEach((e, i) => {
//       console.error(`Error ${i + 1}:`, e.text)
//       if (e.detail) console.error(`Detail:`, e.detail)
//     });
//   }
//   process.exit(1)
// })
