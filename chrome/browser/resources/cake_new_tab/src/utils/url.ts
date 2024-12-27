export const toFaviconUrl = (url: string, size: number = 32, scaleFactor: number = 1) => (
  `chrome://favicon/size/${size}@${scaleFactor}x/${url}`
);
