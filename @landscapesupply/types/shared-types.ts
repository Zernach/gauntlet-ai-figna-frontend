export type SHARED_FIELDS = {
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
};

export type DEVICE_FIELDS = {
  platform?: string;
  osVersion?: string;
  deviceModel?: string;
  deviceManufacturer?: string;
};

export type ANALYTIC_EVENT_FIELDS = {
  eventType: string;
  screenName?: string;
  appVersion?: string;
  value?: string;
};

export type ERROR_FIELDS = {
  title?: string;
  cause?: string;
  description?: string;
  type?: 'ErrorBoundary' | 'other';
  stack?: string;
  stackTrace?: string;
  wasGracefullyHandled?: boolean;
  appVersion?: string;
  resolvedAt?: string;
};

export type INFERENCE_FIELDS = {
  type?: INFERENCE_TYPES;
  model?: MODELS;
  prompt?: string;
  response?: string;
  error?: string;
  responseMetadata?: string;
};

export type REFERRER_FIELDS = {
  url?: string;
  hostUrl?: string;
  hostDomain?: string;
  name?: string;
  description?: string;
};

export type ErrorResponse =
  | {
      error?: {
        message?: string;
      };
    }
  | undefined;

export enum MODELS {
  OPENAI_4o = 'gpt-4o',
  OPENAI_4o_nano = 'gpt-4.1-nano-2025-04-14',
  DEEPSEEK_r1 = 'deepseek_r1',
  KIMI_2 = 'kimi_2',
}

export enum INFERENCE_TYPES {
  // For to decide which prompt to use.
  ADD_BULK_PRODUCTS = 'add-bulk-products',
  TRANSLATE_WALLPAPER = 'translate-wallpaper',
  TRANSLATE_SOURCE_VOCABULARY = 'translate-source-vocabulary',
}

export enum INBOUND_MAIL_TYPES {
  UNDELIVERED = 'email-undelivered-report',
  DMARC = 'email-dmarc-report',
  OTHER = 'email-other',
}

export enum DATABASES {
  DEFAULT = 'defaultdb',
  LANDSCAPE_SUPPLY = 'landscapesupplydb',
  TRANSLATE_WALLPAPER = 'translatewallpaperdb',
  GAUNTLET_AI = 'gauntletaidb',
}

export enum PROJECTS {
  // For to decide which API key to use.
  DEFAULT = 'default',
  LANDSCAPE_SUPPLY = 'landscapesupply',
  TRANSLATE_WALLPAPER = 'translatewallpaper',
  GROW_WILDFIRES = 'growwildfires',
  GAUNTLET_AI = 'gauntletai',
}

export enum QUEUE_TYPES {
  EMAIL = 'email',
  PUSH = 'push',
  SMS_TEXT = 'sms_text',
  INFERENCE = 'inference',
}

export enum MARKETING_SENT_EVENTS {
  VIEWED = 'viewed',
  LINK_PRESSED = 'link_pressed',
  UNSUBSCRIBED = 'unsubscribed',
  REMOVED = 'removed',
}
