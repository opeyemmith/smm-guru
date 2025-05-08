export const setToLocalStorage = (key: string, value: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, value);
  }
};

export const getFromLocalStorage = (key: string) => {
  if (typeof window !== "undefined") {
    const info = localStorage.getItem(key);

    return info;
  }

  return;
};
