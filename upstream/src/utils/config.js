export const defaultConfig = {
  articleWidth: 90,
  fontSize: 1.05,
  homePage: "all",
  layout: "large",
  markReadOnScroll: false,
  orderBy: "created_at",
  orderDirection: "desc",
  pageSize: 100,
  showAllFeeds: false,
  showFeedIcon: true,
  showStatus: "all",
  theme: "light",
  themeColor: "Blue",
};

export const getConfig = (name) => {
  const config = JSON.parse(localStorage.getItem("config")) || {};
  if (Object.hasOwn(config, name)) {
    return config[name];
  }
  if (Object.hasOwn(defaultConfig, name)) {
    return defaultConfig[name];
  }
  return null;
};
