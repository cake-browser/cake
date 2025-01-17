import React from 'react';
import ReactDOM from 'react-dom';
import 'prop-types';

if (typeof globalThis.React === 'undefined') {
  // @ts-ignore
  globalThis.React = React;
}

if (typeof globalThis.ReactDOM === 'undefined') {
  // @ts-ignore
  globalThis.ReactDOM = ReactDOM;
}

const {
  forwardRef,
  useLayoutEffect,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useTransition,
  createContext,
  createElement,
  Suspense,
  Fragment,
} = React;

const jsx = createElement;
const jsxs = jsx;

export {
  React,
  ReactDOM,
  forwardRef,
  useLayoutEffect,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useTransition,
  jsx,
  jsxs,
  createContext,
  createElement,
  Suspense,
  Fragment,
};
