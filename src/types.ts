export interface ArticleItem {
  id: string;
  slug: string;
  title: {
    el: string;
    en: string;
  };
  category: string;
  categoryLabel: {
    el: string;
    en: string;
  };
  readTime: string;
  difficulty?: string;
  difficultyLabel?: {
    el: string;
    en: string;
  };
  date: string;
  dateFormatted?: {
    el: string;
    en: string;
  };
  author: {
    name: string;
    role: {
      el: string;
      en: string;
    };
    avatar: string;
  };
  image: string;
  videoUrl?: string;
  summary: {
    el: string;
    en: string;
  };
  content: {
    el: string;
    en: string;
  };
  keyTakeaways: {
    el: string[];
    en: string[];
  };
  socialScriptReady?: boolean;
  likes?: number;
  featured?: boolean;
  views?: number;
  tags?: string[];
  shares?: number;
  [key: string]: any;
}

export interface LiveWeatherData {
  cityName: string;
  temperature: number;
  humidity: number;
  uvIndex: number;
  evapotranspiration: number;
  windSpeed: number;
  weatherIcon: string;
  conditionText: string;
  agronomyTip: string;
}
