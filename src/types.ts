export type UserRole = 'admin' | 'sales' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  technicalSpecs: Record<string, string>;
  images: string[];
  tags: string[];
  relatedProducts: string[];
}

export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';

export interface CartItem {
  productId: string;
  quantity: number;
  technicalAnswers?: Record<string, string>;
  name?: string;
  category?: string;
  image?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  eventDate: string;
  location: string;
  note: string;
  status: LeadStatus;
  items: CartItem[];
  createdAt?: string;
  created_at?: string;
  userId?: string;
}

export interface SharedFile {
  id: string;
  name: string;
  link: string;
  views: number;
  expiryDate: string;
  clientName: string;
  uploadedBy: string;
}

export interface TeambuildingConcept {
  id: string;
  name: string;
  description: string;
  participantCount: string;
  isIndoor: boolean;
  purpose: string;
  tags: string[];
}

export type Locale = 'az' | 'en' | 'ru' | 'tr';

export interface LocalizedText {
  az: string;
  en: string;
  ru: string;
  tr: string;
}

export interface LocalizedTextArray {
  az: string[];
  en: string[];
  ru: string[];
  tr: string[];
}

export interface HomeHeroStatItem {
  label: LocalizedText;
  value: LocalizedText;
}

export interface HomeHeroSection {
  titleLine1: LocalizedText;
  titleLine2: LocalizedText;
  titleLine3: LocalizedText;
  subtitle: LocalizedText;
  primaryCta: LocalizedText;
  secondaryCta: LocalizedText;
  scrollLabel: LocalizedText;
  sideLabel: LocalizedText;
  stats: HomeHeroStatItem[];
}

export interface HomeCapabilityItem {
  key: string;
  title: LocalizedText;
  description: LocalizedText;
  image: string;
}

export interface HomeCapabilitiesSection {
  badge: LocalizedText;
  title: LocalizedText;
  titleAccent: LocalizedText;
  description: LocalizedText;
  cta: LocalizedText;
  items: HomeCapabilityItem[];
}

export interface HomeEventTypeItem {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  image: string;
}

export interface HomeEventTypesSection {
  badge: LocalizedText;
  title: LocalizedText;
  titleAccent: LocalizedText;
  description: LocalizedText;
  cta: LocalizedText;
  items: HomeEventTypeItem[];
}

export interface HomeFeaturedProject {
  title: LocalizedText;
  location: LocalizedText;
  category: LocalizedText;
  image: string;
  year: string;
}

export interface HomeFeaturedSetupsSection {
  badge: LocalizedText;
  title: LocalizedText;
  titleAccent: LocalizedText;
  viewAll: LocalizedText;
  projects: HomeFeaturedProject[];
}

export interface HomeProcessStep {
  title: LocalizedText;
  description: LocalizedText;
  bg: string;
}

export interface HomeProcessSection {
  badge: LocalizedText;
  title: LocalizedText;
  titleAccent: LocalizedText;
  description: LocalizedText;
  phase: LocalizedText;
  footer: LocalizedText;
  steps: HomeProcessStep[];
}

export interface HomeMetricItem {
  label: LocalizedText;
  value: string;
}

export interface HomeMetricsSection {
  items: HomeMetricItem[];
}

export interface HomeCatalogGatewayStat {
  value: string;
  label: LocalizedText;
}

export interface HomeCatalogGatewaySection {
  badge: LocalizedText;
  title: LocalizedText;
  titleAccent: LocalizedText;
  description: LocalizedText;
  cta: LocalizedText;
  stats: HomeCatalogGatewayStat[];
  image: string;
}

export interface HomeFinalCtaSection {
  title: LocalizedText;
  titleAccent: LocalizedText;
  description: LocalizedText;
  primaryCta: LocalizedText;
  secondaryCta: LocalizedText;
  email: string;
  phone: string;
  address: LocalizedText;
}

export interface ServiceSubItem {
  id: string;
  name: LocalizedText;
  desc: LocalizedText;
  questions: LocalizedTextArray;
}

export interface ServiceCategoryContent {
  id: string;
  path: string;
  title: LocalizedText;
  description: LocalizedText;
  image: string;
  subItems: ServiceSubItem[];
}

export interface HomeTeamMember {
  name: LocalizedText;
  role: LocalizedText;
  description: LocalizedText;
  image: string;
}

export interface HomeTeamSection {
  badge: LocalizedText;
  title: LocalizedText;
  titleAccent: LocalizedText;
  members: HomeTeamMember[];
}

export interface HomeClientItem {
  name: string;
  logo: string | null;
  url: string;
}

export interface HomeClientsSection {
  badge: LocalizedText;
  title: LocalizedText;
  subtitle: LocalizedText;
  clients: HomeClientItem[];
}

export interface AboutApproachStep {
  n: string;
  title: LocalizedText;
  text: LocalizedText;
}

export interface AboutStatItem {
  value: string;
  label: LocalizedText;
}

export interface AboutVisionMissionStat {
  target: number;
  suffix: string;
  label: LocalizedText;
}

export interface AboutBentoCard {
  title: LocalizedText;
  desc: LocalizedText;
}

export interface AboutValueItem {
  title: LocalizedText;
  desc: LocalizedText;
}

export interface AboutSection {
  hero: {
    badge: LocalizedText;
    titleLine1: LocalizedText;
    titleLine2: LocalizedText;
    subtitle: LocalizedText;
  };
  partnerIntro: {
    badge: LocalizedText;
    titleLine1: LocalizedText;
    titleLine2: LocalizedText;
    quote: LocalizedText;
    stats: AboutStatItem[];
  };
  approach: {
    badge: LocalizedText;
    titleLine1: LocalizedText;
    titleLine2: LocalizedText;
    steps: AboutApproachStep[];
  };
  visionMission: {
    badge: LocalizedText;
    visionLabel: LocalizedText;
    visionTitle: LocalizedText;
    visionBody: LocalizedText;
    visionTagline: LocalizedText;
    missionLabel: LocalizedText;
    missionTitle: LocalizedText;
    missionBody: LocalizedText;
    stats: AboutVisionMissionStat[];
  };
  bento: {
    badge: LocalizedText;
    cards: AboutBentoCard[];
    imageTitle: LocalizedText;
    imageTitleAccent: LocalizedText;
  };
  team: {
    badge: LocalizedText;
    titleLine1: LocalizedText;
    titleLine2: LocalizedText;
  };
  values: {
    badge: LocalizedText;
    titleLine1: LocalizedText;
    titleLine2: LocalizedText;
    items: AboutValueItem[];
  };
}

export interface ContactSection {
  hero: {
    badge: LocalizedText;
    titleLine1: LocalizedText;
    titleLine2: LocalizedText;
    subtitle: LocalizedText;
  };
  ctaHeroWord: LocalizedText;
  form: {
    labelName: LocalizedText;
    labelPhone: LocalizedText;
    labelEmail: LocalizedText;
    labelMessage: LocalizedText;
    placeholderName: LocalizedText;
    placeholderPhone: LocalizedText;
    placeholderEmail: LocalizedText;
    placeholderMessage: LocalizedText;
    errorRequired: LocalizedText;
    successTitle: LocalizedText;
    successBody: LocalizedText;
    resetButton: LocalizedText;
    submitButton: LocalizedText;
    infoPhone: LocalizedText;
    infoPhoneValue: LocalizedText;
    infoPhoneSub: LocalizedText;
    infoEmail: LocalizedText;
    infoEmailValue: LocalizedText;
    infoEmailSub: LocalizedText;
    infoAddress: LocalizedText;
    infoAddressValue: LocalizedText;
    infoAddressSub: LocalizedText;
  };
  cta: {
    badge: LocalizedText;
    subText: LocalizedText;
    bottomLabel: LocalizedText;
    bottomTagline: LocalizedText;
    bottomCta: LocalizedText;
    channelPhone: LocalizedText;
    channelEmail: LocalizedText;
    channelMap: LocalizedText;
    channelInstagram: LocalizedText;
    channelFacebook: LocalizedText;
channelTagPhone: LocalizedText;
      channelTagEmail: LocalizedText;
      channelTagMap: LocalizedText;
      channelTagInstagram: LocalizedText;
      channelTagFacebook: LocalizedText;
      channelPhoneValue: LocalizedText;
      channelEmailValue: LocalizedText;
      channelAddressValue: LocalizedText;
      channelInstagramValue: LocalizedText;
      channelFacebookValue: LocalizedText;
    };
  map: {
    overlayTitle: LocalizedText;
    overlaySubtitle: LocalizedText;
  };
}

export interface ServicesShowcaseItem {
  num: string;
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  tags: string[];
  image: string;
  iconKey: string;
}

export interface ServicesSection {
  showcase: {
    badge: LocalizedText;
    detailLink: LocalizedText;
    items: ServicesShowcaseItem[];
  };
  grid: {
    badge: LocalizedText;
    titleLine1: LocalizedText;
    titleLine2: LocalizedText;
    cta: LocalizedText;
  };
}

export interface FooterSection {
  tagline: LocalizedText;
  navHeading: LocalizedText;
  contactHeading: LocalizedText;
  navLinks: { label: LocalizedText; path: string }[];
  whatsappLine: LocalizedText;
  whatsappCta: LocalizedText;
  whatsappBadge: LocalizedText;
  copyright: LocalizedText;
  privacyPolicy: LocalizedText;
  termsOfService: LocalizedText;
}

export interface HomeVisionMissionSection {
  visionLabel: LocalizedText;
  visionBody: LocalizedText;
  missionLabel: LocalizedText;
  missionBody: LocalizedText;
}

export interface HomeMetricsEyebrow {
  text: LocalizedText;
}

export interface HomeClientsEyebrow {
  badge: LocalizedText;
  count: LocalizedText;
  trustedLabel: LocalizedText;
}

export interface HomeFinalCtaBadge {
  text: LocalizedText;
}

export interface HomeServicesTeaser {
  badge: LocalizedText;
  titleLine1: LocalizedText;
  titleLine2: LocalizedText;
  subtitle: LocalizedText;
}

/* ── Catering ── */
export interface CateringSectionContent {
  hero: {
    eyebrow: LocalizedText;
    titleLine1: LocalizedText;
    titleLine2: LocalizedText;
    subtitle: LocalizedText;
  };
  content: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    subtitle: LocalizedText;
    menuItems: { title: LocalizedText; desc: LocalizedText }[];
    galleryLabel: LocalizedText;
  };
  request: {
    eyebrow: LocalizedText;
    titleLine1: LocalizedText;
    titleLine2: LocalizedText;
    subtitle: LocalizedText;
    features: LocalizedText[];
    formTitle: LocalizedText;
    formSubtitle: LocalizedText;
    fields: {
      name: LocalizedText; phone: LocalizedText; email: LocalizedText;
      guests: LocalizedText; location: LocalizedText; date: LocalizedText;
      timeRange: LocalizedText; format: LocalizedText; menuNote: LocalizedText;
    };
    submitBtn: LocalizedText;
    waNote: LocalizedText;
    successTitle: LocalizedText;
    successSubtitle: LocalizedText;
    newOrderBtn: LocalizedText;
  };
}

/* ── Portfolio ── */
export interface PortfolioSectionContent {
  hero: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    subtitle: LocalizedText;
  };
  filters: {
    searchPlaceholder: LocalizedText;
    categoryLabel: LocalizedText;
    tagsLabel: LocalizedText;
    clearLabel: LocalizedText;
    allLabel: LocalizedText;
    emptyLabel: LocalizedText;
  };
}

export interface SiteContent {
  home: {
    hero: HomeHeroSection;
    capabilities: HomeCapabilitiesSection;
    eventTypes: HomeEventTypesSection;
    featuredSetups: HomeFeaturedSetupsSection;
    process: HomeProcessSection;
    metrics: HomeMetricsSection;
    metricsEyebrow: HomeMetricsEyebrow;
    catalogGateway: HomeCatalogGatewaySection;
    finalCta: HomeFinalCtaSection;
    finalCtaBadge: HomeFinalCtaBadge;
    team: HomeTeamSection;
    clients: HomeClientsSection;
    clientsEyebrow: HomeClientsEyebrow;
    visionMissionCompact: HomeVisionMissionSection;
    servicesTeaser: HomeServicesTeaser;
  };
  services: {
    categories: ServiceCategoryContent[];
    showcase: ServicesSection['showcase'];
    grid: ServicesSection['grid'];
  };
  about: AboutSection;
  contact: ContactSection;
  footer: FooterSection;
  catering: CateringSectionContent;
  portfolio: PortfolioSectionContent;
  cart: Record<string, LocalizedText>;
  product: Record<string, LocalizedText>;
  catalog: Record<string, LocalizedText>;
  notFound: Record<string, LocalizedText>;
}
