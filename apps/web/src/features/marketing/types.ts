import { LucideIcon } from 'lucide-react';

export type HeroVariant = 'simulator' | 'tech-stack' | 'isometric';

export interface MarketingServiceItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  badge?: string;
  features: string[];
  category: 'core' | 'operations' | 'finance';
}

export interface FulfillmentStepItem {
  step: string;
  title: string;
  tagline: string;
  description: string;
  actionText: string;
  iconName: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'warehouse' | 'cod' | 'pricing';
}

export interface PricingCategory {
  title: string;
  subtitle: string;
  startingAt?: string;
  iconName: string;
  items: {
    name: string;
    description: string;
    rate: string;
  }[];
}

export interface WhoWeServeItem {
  title: string;
  audience: string;
  description: string;
  iconName: string;
  tag: string;
  benefits: string[];
}
