export type Language = 'el' | 'en';

export interface CityTelemetry {
  id: string;
  name: { el: string; en: string };
  region: { el: string; en: string };
  temp: number;
  condition: { el: string; en: string; icon: string };
  humidity: number;
  uvIndex: number;
  uvLevel: { el: string; en: string; color: string };
  evapotranspiration: number; // in mm
  solarRadiation: number; // W/m2
  windSpeed: number; // km/h
  soilMoistureLevel: number; // percentage estimate
  smartTip: {
    el: string;
    en: string;
  };
  recommendedWateringTime: {
    el: string;
    en: string;
  };
}

export type ArticleCategory = 
  | 'all'
  | 'balcony'
  | 'vegetable_garden'
  | 'irrigation_iot'
  | 'robotic_mowers'
  | 'plant_care';

export interface Article {
  id: string;
  slug: string;
  title: { el: string; en: string };
  category: ArticleCategory;
  categoryLabel: { el: string; en: string };
  readTime: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  difficultyLabel: { el: string; en: string };
  date: string;
  author: {
    name: string;
    role: { el: string; en: string };
    avatar: string;
  };
  image: string;
  summary: { el: string; en: string };
  content: { el: string; en: string };
  keyTakeaways: { el: string[]; en: string[] };
  socialScriptReady: boolean;
  socialScriptPreview?: {
    hook: string;
    caption: string;
    hashtags: string[];
  };
  likes: number;
  featured?: boolean;
}

export interface SocialScript {
  id: string;
  title: { el: string; en: string };
  platform: 'tiktok' | 'instagram' | 'facebook' | 'youtube_shorts';
  category: string;
  targetDuration: string;
  hook: { el: string; en: string };
  scriptScenes: Array<{
    timestamp: string;
    visual: { el: string; en: string };
    voiceover: { el: string; en: string };
    onScreenText: { el: string; en: string };
  }>;
  caption: { el: string; en: string };
  hashtags: string[];
  callToAction: { el: string; en: string };
}

export interface RoboticMower {
  id: string;
  name: string;
  brand: string;
  badge?: string;
  coverageM2: number;
  maxSlope: number; // %
  navigation: string; // e.g. "RTK-GPS + AI Camera"
  cuttingHeight: string;
  batteryLife: string;
  rating: number;
  reviewsCount: number;
  price: string;
  image: string;
  pros: { el: string[]; en: string[] };
  cons: { el: string[]; en: string[] };
  bestFor: { el: string; en: string };
  affiliateLink: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  plantDiagnosis?: {
    plantName: string;
    condition: string;
    confidence: number;
    actions: string[];
    waterAdjustment: string;
  };
}

export type VideoFormat = '9:16' | '16:9' | '1:1';

export interface CartoonSceneStep {
  id: string;
  timeStart: number; // in seconds, e.g. 0
  timeEnd: number; // in seconds, e.g. 2.5
  phaseName: { el: string; en: string };
  actionDescription: { el: string; en: string };
  botanicalFocus: { el: string; en: string };
  cartoonElements: {
    characterAction: string; // e.g. 'inspecting', 'snipping', 'watering', 'fertilizing', 'celebrating'
    tool: string; // 'pruning_shears', 'water_can', 'iot_sensor', 'iron_chelate', 'mower_robot'
    plantState: 'yellowing' | 'wilting' | 'cut' | 'blooming' | 'lush_green' | 'fruiting' | 'fresh_cut';
    particles: 'water_drops' | 'sparkles' | 'leaves' | 'laser_scans' | 'red_powder' | 'sun_rays';
    onScreenBanner: { el: string; en: string };
    audioEffect: string; // 'snip', 'whoosh', 'ding', 'water_flow', 'robot_hum'
  };
}

export interface MultiAgentVideoProject {
  id: string;
  articleId?: string;
  articleTitle: { el: string; en: string };
  topic: string;
  status: 'idle' | 'scripting' | 'reviewing' | 'animating' | 'ready';
  durationSeconds: number; // 10
  agent1Script: {
    agentName: string;
    status: 'pending' | 'working' | 'done';
    storyboard: CartoonSceneStep[];
    notes: { el: string; en: string };
  };
  agent2Review: {
    agentName: string;
    status: 'pending' | 'working' | 'done';
    accuracyScore: number;
    botanicalCorrections: { el: string[]; en: string[] };
    safetyNotice: { el: string; en: string };
    approvedSeal: boolean;
  };
  agent3Animator: {
    agentName: string;
    status: 'pending' | 'working' | 'done';
    fps: number;
    motionSpeedMultiplier: number;
    colorPalette: string;
  };
}

