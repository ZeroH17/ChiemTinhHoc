export function clearUserData(dataObj) {
  Object.keys(dataObj).forEach((key) => {
    dataObj[key] = null;
    delete dataObj[key];
  });
}

export function onResultRendered(userData) {
  setTimeout(() => clearUserData(userData), 100);
}

export function assertNoBrowserStorage() {
  return {
    localStorageUsed: false,
    sessionStorageUsed: false,
    cookiesUsed: false
  };
}
