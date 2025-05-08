import {
    BarChart2,
    MessageCircle,
    MonitorSmartphone,
    ScrollText,
    Shield,
    ThumbsUp,
    TrendingUp,
    Users,
    Zap,
    Instagram,
  } from "lucide-react";

export const landingPageContent = {
  heroSection: {
    title: "Boost Your Instagram Presence",
    subtitle:
      "Supercharge your Instagram growth with our comprehensive SMM panel. Get instant likes, followers, views, and engagement for your Instagram account.",
    ctaButton: "Get Started",
    trialText: "Start growing your Instagram today!",
  },
  featuresPreview: {
    heading: "Overview",
    description:
      "Your all-in-one solution for Instagram growth. Get high-quality engagement from real users.",
    features: [
      { icon: <Instagram />, text: "Instagram Followers" },
      { icon: <Instagram />, text: "Instagram Likes" },
      { icon: <Instagram />, text: "Instagram Views" },
      { icon: <Instagram />, text: "Instagram Comments" },
    ],
  },
  benefitsSection: {
    title: "Grow Your Instagram Profile",
    description:
      "Our platform provides the fastest and most reliable Instagram services to help you achieve your growth goals.",
    benefitsList: [
      {
        icon: <Shield />,
        title: "100% Safe Services",
        description:
          "All our services are provided through secure methods that comply with Instagram guidelines.",
      },
      {
        icon: <Zap />,
        title: "Instant Delivery",
        description:
          "Get quick results with our automated delivery system for most services.",
      },
      {
        icon: <TrendingUp />,
        title: "Real Engagement",
        description:
          "High-quality engagement from genuine Instagram accounts to boost your presence.",
      },
      {
        icon: <ThumbsUp />,
        title: "Quality Guaranteed",
        description:
          "We ensure the highest quality Instagram service with replacement guarantee.",
      },
    ],
  },
  featuresSection: {
    title: "Why Choose Us",
    description:
      "We offer comprehensive Instagram marketing solutions for your growth.",
    featuresList: [
      {
        icon: <MonitorSmartphone />,
        title: "Easy to Use",
        description:
          "Simple dashboard to manage all your Instagram orders.",
      },
      {
        icon: <Users />,
        title: "Multiple Services",
        description:
          "Services for followers, likes, views, comments, and more.",
      },
      {
        icon: <ScrollText />,
        title: "Detailed Analytics",
        description:
          "Track your orders and monitor your growth in real-time.",
      },
      {
        icon: <BarChart2 />,
        title: "Custom Packages",
        description:
          "Tailored solutions to meet your specific Instagram growth requirements.",
      },
      {
        icon: <Zap />,
        title: "Quick Delivery",
        description:
          "Fast and efficient delivery for all our Instagram services.",
      },
      {
        icon: <MessageCircle />,
        title: "24/7 Support",
        description:
          "Get assistance anytime with our dedicated customer support team.",
      },
    ],
  },
  pricingSection: {
    title: "Start Growing Today",
    description:
      "Affordable pricing for all your Instagram needs. Top up your account and start ordering!",
    plansList: [
      {
        title: "Pay As You Go",
        popular: 1,
        price: 200,
        description:
          "Access all our Instagram services with flexible pricing. No monthly commitments.",
        buttonText: "Add Funds",
        benefitList: [
          "Instant account activation",
          "Access to all Instagram services",
          "24/7 customer support",
          "Real-time order tracking",
          "Secure payment methods",
          "Money-back guarantee",
        ],
      },
    ],
  },
  footerSection: {
    copyrightText: "© 2024 Instagram SMM Panel. All rights reserved.",
  },
};

export const legalPages = [
  {
    title: "Privacy Policy",
    slug: "/privacy",
  },
  {
    title: "Terms of Service",
    slug: "/terms",
  },
  {
    title: "Service Level Agreement (SLA)",
    slug: "service-level-agreement",
  },
  {
    title: "Refund Policy",
    slug: "refund-policy",
  },
];
