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
    "/dashboard-1.png",
    "/dashboard-2.png",
    "/dashboard-3.png",
    "/dashboard-4.png",
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

export const blogPosts = [
  {
    slug: "future-of-solar-asset-management",
    title: "The Future of Solar Asset Management: AI & Drones",
    excerpt: "How machine learning is revolutionizing the way we maintain large-scale solar installations.",
    date: "Jun 20, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80",
    author: "Expert Team",
    content: `The solar energy industry is undergoing a profound transformation, driven by the convergence of artificial intelligence (AI) and drone technology. As solar installations grow larger and more distributed, traditional manual inspection and maintenance methods are no longer sufficient.

## The Rise of AI-Powered Inspections

AI algorithms can analyze thousands of solar panels in minutes, detecting anomalies that would take human inspectors weeks to identify. Thermal imaging drones capture high-resolution data, which AI models process to pinpoint hotspots, bypass diode failures, and cell cracks with remarkable accuracy.

### Key Benefits

- **Speed**: What once took months now takes days
- **Accuracy**: AI detects issues invisible to the naked eye
- **Cost Savings**: Reduced labor and downtime
- **Predictive Maintenance**: Early detection prevents catastrophic failures

## Real-World Applications

At Datafy Associate, we've deployed our AI-powered drone inspection system across multiple solar farms, achieving a 99% accuracy rate in fault detection. Our clients have reported a 40% reduction in unplanned downtime and significant improvements in energy yield.

## The Future

As AI models become more sophisticated and drone technology advances, we expect to see fully autonomous inspection systems that can operate 24/7, providing real-time insights into solar asset health. The integration with digital twin platforms will enable operators to simulate and optimize performance like never before.`,
  },
  {
    slug: "drone-thermography-identifying-the-invisible",
    title: "Drone Thermography: Identifying the Invisible",
    excerpt: "A deep dive into how thermal imaging uncovers critical hotspots and electrical faults.",
    date: "Jun 15, 2026",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    author: "Engineering Dept",
    content: `Thermography, or thermal imaging, has become an indispensable tool in solar asset management. By capturing the infrared radiation emitted by solar panels, drone-mounted thermal cameras can reveal temperature anomalies that indicate underlying issues.

## How Thermal Imaging Works

Solar panels naturally heat up during operation, but defective cells or connections often exhibit abnormal temperature patterns. Thermal cameras detect these patterns, producing detailed thermograms that trained analysts can interpret.

### Common Faults Detected

- **Hotspots**: Localized overheating due to cell damage or shading
- **Bypass Diode Failures**: Components that fail to redirect current around damaged cells
- **String Imbalances**: Uneven current distribution across panel strings
- **Connection Issues**: Loose or corroded electrical connections

## The Datafy Approach

Our drone thermography service combines high-resolution thermal cameras with AI-powered analysis software. Each inspection generates thousands of data points, which are processed and mapped to specific GPS coordinates for precise remediation.

## Case Study

In a recent inspection of a 50MW solar farm, our thermal survey identified 127 panels with critical hotspots that were not visible during visual inspection. Prompt replacement of these panels prevented an estimated 15% loss in annual energy production.`,
  },
  {
    slug: "why-accurate-topographical-data-matters",
    title: "Why Accurate Topographical Data Matters",
    excerpt: "Understanding the critical role of terrain modeling in large-scale construction and solar projects.",
    date: "Jun 10, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    author: "Geospatial Team",
    content: `Accurate topographical data is the foundation of successful large-scale projects. Whether you're planning a solar farm, a construction site, or an infrastructure development, understanding the terrain is critical.

## Why Topography Matters

Topographical mapping provides essential information about elevation, slope, drainage patterns, and vegetation. This data influences everything from panel layout optimization to foundation design and stormwater management.

### Applications in Solar Projects

- **Site Selection**: Identifying optimal locations based on solar exposure and terrain
- **Panel Layout**: Optimizing array orientation for maximum energy capture
- **Drainage Planning**: Preventing water damage and erosion
- **Access Roads**: Planning efficient construction and maintenance routes

## Drone-Based Surveying

Traditional ground-based surveys are time-consuming and expensive. Drone-based photogrammetry and LiDAR surveys can capture millions of data points in a single flight, producing highly accurate digital elevation models (DEMs).

## Accuracy Matters

With our drone surveying services, we achieve sub-centimeter accuracy in topographical mapping. This level of precision ensures that your project starts with reliable data, reducing costly errors during construction and operation.`,
  },
  {
    slug: "maximizing-roi-predictive-maintenance",
    title: "Maximizing ROI through Predictive Maintenance",
    excerpt: "Shifting from reactive to proactive maintenance using real-time IoT and drone data.",
    date: "Jun 05, 2026",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    author: "Data Analyst",
    content: `Predictive maintenance is revolutionizing the solar industry by shifting the paradigm from reactive repairs to proactive asset management. By leveraging real-time data from IoT sensors and drone inspections, operators can predict and prevent failures before they occur.

## The Cost of Reactive Maintenance

Reactive maintenance—fixing things only after they break—is expensive and inefficient. Unplanned downtime, emergency repair costs, and lost energy production can significantly impact the bottom line.

## How Predictive Maintenance Works

Our predictive maintenance system combines multiple data sources:

- **IoT Sensors**: Real-time monitoring of temperature, voltage, and current
- **Drone Inspections**: Regular thermal and visual surveys
- **Weather Data**: Historical and forecast data for environmental context
- **AI Models**: Machine learning algorithms that predict failure patterns

### Benefits

- **Reduced Downtime**: Address issues before they cause outages
- **Lower Costs**: Scheduled maintenance is cheaper than emergency repairs
- **Extended Asset Life**: Early intervention prevents cascading damage
- **Improved ROI**: Maximize energy production and revenue

## Implementation at Scale

Datafy Associate's predictive maintenance platform has been deployed across multiple solar installations, resulting in a 30% reduction in maintenance costs and a 15% improvement in overall equipment effectiveness (OEE).`,
  },
];
