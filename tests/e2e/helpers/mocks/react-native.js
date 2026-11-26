'use strict';

// Lightweight React Native stub for Node/Jest E2E runs when domain services
// transitively reference react-native primitives.

const noop = () => {};

const Platform = {
  OS: 'web',
  Version: 0,
  select: (specifics) => {
    if (!specifics || typeof specifics !== 'object') return undefined;
    if ('web' in specifics) return specifics.web;
    if ('default' in specifics) return specifics.default;
    return undefined;
  },
};

const Dimensions = {
  get: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
  addEventListener: () => ({ remove: noop }),
  removeEventListener: noop,
};

const PixelRatio = {
  get: () => 3,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size) => Math.round(size * 3),
  roundToNearestPixel: (size) => Math.round(size),
};

const StyleSheet = {
  create: (styles) => styles || {},
  flatten: (style) => {
    if (Array.isArray(style)) {
      return Object.assign({}, ...style.filter(Boolean));
    }
    return style || {};
  },
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
};

const Appearance = {
  getColorScheme: () => 'dark',
  addChangeListener: () => ({ remove: noop }),
};

const Alert = {
  alert: noop,
};

const Linking = {
  openURL: async () => true,
  canOpenURL: async () => true,
};

const AppState = {
  currentState: 'active',
  addEventListener: () => ({ remove: noop }),
};

const Animated = {
  Value: function AnimatedValue(initial) {
    this._value = initial;
    this.setValue = (next) => {
      this._value = next;
    };
  },
  timing: () => ({ start: (cb) => { if (typeof cb === 'function') cb({ finished: true }); } }),
  spring: () => ({ start: (cb) => { if (typeof cb === 'function') cb({ finished: true }); } }),
  View: 'Animated.View',
  Text: 'Animated.Text',
};

module.exports = {
  Platform,
  Dimensions,
  PixelRatio,
  StyleSheet,
  Appearance,
  Alert,
  Linking,
  AppState,
  Animated,
  NativeModules: {},
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  Modal: 'Modal',
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  SafeAreaView: 'SafeAreaView',
  useColorScheme: () => 'dark',
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
};
