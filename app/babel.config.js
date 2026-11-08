module.exports = {
  presets: [
    ['/usr/share/nodejs/@babel/preset-env', { targets: { node: 'current' } }],
    '/usr/share/nodejs/@babel/preset-react',
    '/usr/share/nodejs/@babel/preset-typescript',
  ],
};
