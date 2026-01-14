import commonContent from './common.json';
import authContent from './auth.json';
import landingContent from './landing.json';

// Type definitions
export interface FeatureItem {
  title: string;
  description: string;
}

export interface StepItem {
  step: string;
  title: string;
  description: string;
}

export interface LandingContent {
  hero: {
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  features: {
    title: string;
    items: FeatureItem[];
  };
  moreFeatures: {
    title: string;
    items: FeatureItem[];
  };
  howItWorks: {
    title: string;
    steps: StepItem[];
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
}

export interface CommonContent {
  brand: {
    name: string;
    tagline: string;
    motto: string;
  };
  footer: {
    poweredBy: string;
  };
}

export interface LoginContent {
  title: string;
  subtitle: string;
  form: {
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    rememberMe: string;
    forgotPassword: string;
    submitButton: string;
    submittingButton: string;
  };
  footer: {
    noAccount: string;
    signUpLink: string;
  };
  features: FeatureItem[];
  errors: {
    default: string;
  };
}

export interface SignupContent {
  title: string;
  subtitle: string;
  sidebarTitle: string;
  form: {
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    passwordHint: string;
    termsPrefix: string;
    termsLink: string;
    submitButton: string;
    submittingButton: string;
  };
  footer: {
    hasAccount: string;
    signInLink: string;
  };
  benefits: FeatureItem[];
  success: {
    title: string;
    message: string;
    backButton: string;
  };
  errors: {
    default: string;
  };
}

export interface AuthContent {
  login: LoginContent;
  signup: SignupContent;
}

// Typed exports
export const common: CommonContent = commonContent;
export const auth: AuthContent = authContent;
export const landing: LandingContent = landingContent;

// Convenience exports
export const brand = common.brand;
export const login = auth.login;
export const signup = auth.signup;
