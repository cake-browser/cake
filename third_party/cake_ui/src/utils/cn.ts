export const cn = (...classes: any[]) =>
  classes.filter((c) => ![undefined, null, ''].includes(c)).join(' ');

export const getPrefixer = (pre: string) => {
  return (str: string) => `${pre}${str || ''}`;
};

export const getPCN = (pre: string) => {
  return (...classes: any[]) =>
    classes
      .filter((c) => ![undefined, null, ''].includes(c))
      .map((c) => `${pre}${c}`)
      .join(' ');
};
