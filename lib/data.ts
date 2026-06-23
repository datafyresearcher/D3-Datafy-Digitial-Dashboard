import {
  Target,
  Zap,
  Award,
  Sun,
  Map,
  ScanEye,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  MapPin,
  FileCheck,
} from "lucide-react";

export const company = {
  name: "Datafy Associate",
  shortName: "Datafy",
  email: "info@datafyassociates.com",
  phone: "+92 3042451070",
  address: "LDA Avenue, Raiwind Road, Lahore",
  portalName: "D\u00b3 Portal",
  socials: {
    facebook: "#",
    instagram: "#",
    linkedin: "#",
    youtube: "#",
  },
};

export const nav = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  {
    label: "Services",
    href: "/#services",
    children: [
      {
        label: "Solar Services",
        href: "/#services",
        grandchildren: [
          { label: "Solar O&M", href: "/services/solar-om" },
          { label: "Comprehensive Solar Inspection", href: "/services/comprehensive-solar-inspection" },
          { label: "Third Party Verification", href: "/services/third-party-verification" },
        ],
      },
      { label: "Topographical Mapping", href: "/topographical-mapping" },
    ],
  },
  { label: "Blogs", href: "/blogs" },
  { label: "SDGS", href: "/sdgs" },
  { label: "Contact", href: "/#contact" },
];


export const heroFeatures = [
  {
    icon: Target,
    title: "Accuracy",
    text: "Using advanced drones and AI, we provide precise inspection reports to help you make informed asset decisions.",
  },
  {
    icon: Zap,
    title: "Efficiency",
    text: "Our automated systems and real-time monitoring ensure minimal downtime and maximum energy output.",
  },
  {
    icon: Award,
    title: "Expertise",
    text: "With years of industry knowledge and a 24/7 NOC, we\u2019re your trusted partner for complete solar asset management.",
  },
];

export const whoWeAre = {
  eyebrow: "Who we are",
  title: "Empowering Clean Energy with Smart Solar Intelligence",
  text: "Datafy Associate is leading the charge in clean energy transformation, delivering innovative solar asset management and advanced geospatial solutions. We provide cutting-edge Operations & Maintenance (O&M), inspection services, and drone-based mapping, empowering asset owners to maximize performance and reduce risk.",
  cards: [
    {
      icon: Sun,
      title: "Solar Asset Management",
      text: "AI-driven drone inspections that detect faults, hotspots, and performance issues \u2014 faster and more accurately.",
    },
    {
      icon: Map,
      title: "Topographical Mapping",
      text: "We deliver precise aerial insights through efficient, affordable and reliable drone survey & mapping.",
    },
  ],
};

export const solarServices = {
  eyebrow: "What we offer",
  title: "Solar Services",
  tagline: "INSIGHT. ACCURACY. IMPACT.",
  subtagline: "From solar assets to landscapes\u2014make every decision count",
  items: [
    {
      icon: Activity,
      title: "Solar O & M Services",
      text: "Ensure peak performance and long-term reliability with our expert operations and maintenance services tailored for solar assets.",
      image:
        "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80",
      href: "/services/solar-om",
    },
    {
      icon: ScanEye,
      title: "Comprehensive Solar Inspection Services",
      text: "Leverage AI-powered drone inspections and GIS technology for accurate, fast, and efficient assessment of your solar infrastructure.",
      image:
        "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80",
      href: "/services/comprehensive-solar-inspection",
    },
    {
      icon: ShieldCheck,
      title: "Third Party Verification Services",
      text: "Get unbiased, professional evaluation of your solar systems to ensure quality, safety, and compliance with industry standards.",
      image:
        "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?auto=format&fit=crop&w=800&q=80",
      href: "/services/third-party-verification",
    },
  ],
};

export const digitalTwin = {
  eyebrow: "Datafy Associate Solution",
  title: "D\u00b3 \u2014 Datafy Digital Dashboard",
  text: "Empower solar asset owners, field teams, performance engineers, and plant managers with comprehensive control of their solar assets, including DC health, system components, civil works, and critical infrastructure, through a precise, GPS-enabled digital twin of the system.",
  features: [
    { icon: Activity, text: "Monitor DC health in real time" },
    { icon: MapPin, text: "Track components with GPS precision" },
    { icon: Layers, text: "Inspect infrastructure via digital twin" },
  ],
  images: [
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
  ],
};

export const topoMapping = {
  eyebrow: "Topographical Mapping",
  title: "Precise Aerial Insights",
  text: "We deliver precise aerial insights through efficient, affordable and reliable drone survey & mapping. Precise drone survey and mapping for efficient, reliable and affordable aerial insights that optimize operations and asset management.",
  images: [
    "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
  ],
};

export const whyChooseUs = {
  eyebrow: "Why Choose Us",
  title: "Empowering the Planet with Solar Innovation",
  items: [
    {
      icon: Cpu,
      title: "End-to-End Solar Asset Management Services",
      text: "From O&M services to Comprehensive inspection and third-party verifications, we offer complete solar asset management support with experienced teams.",
    },
    {
      icon: ScanEye,
      title: "AI-Enabled NOC Monitoring and Drone Inspections",
      text: "Our Advanced Network Operations Centre (NOC) integrates AI-powered monitoring and drone-based inspections to deliver rapid issue detection and enhanced solar system performance.",
    },
    {
      icon: FileCheck,
      title: "Customized Software for Asset Management & Digital Records",
      text: "Dedicated and customized web-based software solution enables full control, real-time monitoring and seamless digital record keeping of solar systems.",
    },
  ],
};

export const testimonials = {
  eyebrow: "Client Feedback & Reviews",
  items: [
    {
      text: "Datafy Associate\u2019s drone-based thermal inspection has revolutionized our approach to solar panel maintenance. Identifying faults that were previously undetectable manually, they significantly reduced inspection time from six months to just two days. Their AI-driven analysis provided actionable insights, enabling us to implement corrective actions swiftly and efficiently.",
      name: "Muhammad Badar Ul Munir",
      role: "CEO, Quaid-e-Azam Solar Power (Pvt.) Ltd.",
    },
    {
      text: "Datafy Associate\u2019s drone-based thermal inspection at our farm was truly transformative. Their expert team conducted a thorough assessment, swiftly identifying inefficiencies that were previously undetectable through conventional methods. The detailed report gave us clear direction on how to enhance our system\u2019s performance and reinforced the long-term reliability of our entire solar infrastructure.",
      name: "Shahzad Hassan",
      role: "Farm Manager",
    },
  ],
};

export const partners = [
  "Quaid-e-Azam Solar",
  "Nestl\u00e9",
  "JZS Farm",
  "EnerTech",
  "SolarPeak",
  "GreenGrid",
  "SkySurveys",
  "AeroMap",
  "CleanVolt",
  "TerraScan",
];

export const faqs = [
  {
    q: "Why should I inspect my solar sites?",
    a: "Aerial inspections provide essential diagnostics to help ensure your equipment is running at peak performance. They allow solar asset owners and operators to identify hidden issues, conduct root cause analysis, and minimize potential revenue losses. When combined with the Datafy D\u00b3 platform, this inspection data adds a valuable layer of intelligence to your overall performance insights.",
  },
  {
    q: "How does Datafy Associate\u2019s inspection solution analyze thermal images and detect issues in PV systems?",
    a: "Our inspection solution leverages proprietary AI-driven tools to process thermal images of PV systems, automatically identifying and geo-referencing anomalies for precise follow-up. This streamlined process supports fast and effective remediation, helping operators address issues with efficiency and accuracy.",
  },
  {
    q: "Can drone thermography support warranty claims?",
    a: "Yes, drone thermography provides the data necessary to support warranty claims by pinpointing issues like hot spots and bypass diode activation, both of which indicate potential failures. Our inspections document specific temperature variations between cells, a method that aligns with many manufacturers\u2019 warranty requirements.",
  },
];

export const stats = [
  { value: 500, suffix: "+", label: "MW Inspected" },
  { value: 99, suffix: "%", label: "Accuracy Rate" },
  { value: 24, suffix: "/7", label: "NOC Monitoring" },
  { value: 2, suffix: "x", label: "Faster Inspections" },
];
