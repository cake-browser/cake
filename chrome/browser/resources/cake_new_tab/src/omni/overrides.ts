/**
 * Override Hostnames
 */
const Hostnames = {
  GitHub: 'github.com',
};

/**
 * Icons
 */
const iconOverrideHostnames = new Set<string>([
  Hostnames.GitHub,
]);

const iconOverrides = {
  [Hostnames.GitHub]: 'github',
};

export const hasOverrideIcon = (hostname: string): boolean => {
  return iconOverrideHostnames.has(hostname);
};

export const getOverrideIcon = (hostname: string): string => {
  return iconOverrides[hostname] || '';
};

/**
 * Annotations
 */
const annotationOverrideHostnames = new Set<string>([
  Hostnames.GitHub,
]);

export const hasOverrideAnnotation = (hostname: string): boolean => {
  return annotationOverrideHostnames.has(hostname);
};

export const getOverrideAnnotation = (destinationUrl: string): string => {
  const url = new URL(destinationUrl);
  const hostname = url.hostname;
  
  if (hostname === Hostnames.GitHub) {
    const firstPathSection = url.pathname.split('/')[1];
    return firstPathSection ? [hostname, firstPathSection].join('/') : hostname;
  }

  return hostname;
};
