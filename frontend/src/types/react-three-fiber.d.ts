import '@react-three/fiber';

declare global {
  namespace JSX {
    // make three/react-three-fiber intrinsic elements available in TSX
    interface IntrinsicElements
      extends import('@react-three/fiber').JSX.IntrinsicElements {}
  }
}

export {};
