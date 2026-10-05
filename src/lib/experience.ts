import UMLogo from "@/assets/umanitoba-logo.png";
import OutlierLogo from "@/assets/outlier-logo.jpeg";
import ProofpointLogo from "@/assets/proofpoint-logo.jpg";
import EricssonLogo from "@/assets/erricson-logo.png";
import CitiLogo from "@/assets/citi.svg";

export type { Status } from "./status";
export { statusOf } from "./status";

export interface ExperienceEntry {
  /** Set on actual roles; milestones like "started university" leave it out. */
  file?: string;
  /** Fractional year used as the chart's x position: year + (month - 1) / 12. */
  year: number;
  growth: number;
  title: string;
  company: string;
  location?: string;
  /** Display range, e.g. "May 2026 - Sept 2026". */
  dates?: string;
  /** Inclusive month bounds; `end: null` means the role is ongoing. */
  start?: { year: number; month: number };
  end?: { year: number; month: number } | null;
  /** Résumé bullets, verbatim. */
  bullets?: string[];
  metrics?: string[];
  tags?: string[];
  /** Prose used where an entry has no bullets. */
  story?: string;
  image: string;
  link: string;
}

export const experienceData: ExperienceEntry[] = [
  {
    year: 2021,
    growth: 10,
    title: "Started Computer Science Journey",
    company: "University of Manitoba",
    story:
      "Began my Bachelor of Computer Science with a minor in Mathematics & Statistics. Dove deep into Data Structures & Algorithms, Object Oriented Programming, and Software Engineering fundamentals that would shape my development career.",
    image: UMLogo,
    link: "https://umanitoba.ca/",
  },
  {
    file: "um-devclub.txt",
    year: 2022,
    growth: 25,
    title: "Active Member & Hackathon Organizer",
    company: "UM DevClub",
    dates: "2022 - Present",
    start: { year: 2022, month: 9 },
    end: null,
    bullets: [
      "Organize hackathons and technical workshops for 200+ participants",
      "Mentor 15+ junior students in React.js, Node.js, and agile methodologies",
      "Foster inclusive and innovative culture in developer community",
    ],
    story:
      "Joined UM DevClub and started organizing hackathons and technical workshops for 200+ participants. Began mentoring 15+ junior students in software development best practices, focusing on React.js, Node.js, and agile methodologies while fostering an inclusive and innovative culture.",
    image: UMLogo,
    link: "https://umanitoba.ca/",
  },
  {
    file: "outlier.txt",
    year: 2024,
    growth: 45,
    title: "AI Model Training Engineer",
    company: "Outlier",
    dates: "May 2024 - Aug 2024",
    start: { year: 2024, month: 5 },
    end: { year: 2024, month: 8 },
    bullets: [
      "Trained and fine-tuned large language models with quality data annotation",
      "Evaluated AI model outputs for accuracy and relevance",
      "Collaborated with cross-functional teams to improve model performance",
    ],
    story:
      "Worked as an AI Model Training Engineer at Outlier from May 2024 to August 2024. Contributed to training and fine-tuning large language models by providing high-quality data annotation, validation, and feedback. Evaluated AI model outputs for accuracy, relevance, and alignment with project objectives while collaborating with cross-functional teams to improve model performance.",
    image: OutlierLogo,
    link: "https://outlier.ai/",
  },
  {
    file: "proofpoint.txt",
    year: 2024.75,
    growth: 65,
    title: "Software Developer Intern",
    company: "Proofpoint",
    location: "Toronto, ON",
    dates: "Oct 2024 - Dec 2025",
    start: { year: 2024, month: 10 },
    end: { year: 2025, month: 12 },
    metrics: [
      "99.9% uptime",
      "50% fewer post-deployment defects",
      "3x release velocity",
    ],
    bullets: [
      "Applied strong problem-solving skills to architect scalable RESTful services in Flask, MySQL, and Docker handling 10,000+ daily requests, achieving 99.9% uptime through circuit-breaker patterns.",
      "Automated multi-step business workflows and networking pipelines using Python and AWS (S3, Lambda), eliminating 35% of manual processing time and improving cross-team process reliability.",
      "Implemented CI/CD pipelines with automated test gates, reducing post-deployment defects by 50% and accelerating release velocity by 3x across the engineering team.",
    ],
    tags: [
      "Flask",
      "MySQL",
      "Docker",
      "Python",
      "AWS S3",
      "AWS Lambda",
      "CI/CD",
    ],
    image: ProofpointLogo,
    link: "https://www.proofpoint.com/",
  },
  {
    file: "ericsson.txt",
    year: 2026.0,
    growth: 80,
    title: "Software Developer Intern",
    company: "Ericsson",
    location: "Montreal, QC",
    dates: "Jan 2026 - April 2026",
    start: { year: 2026, month: 1 },
    end: { year: 2026, month: 4 },
    metrics: [
      "25% uptime improvement",
      "40% shorter release cycles",
      "35% lower MTTD",
    ],
    bullets: [
      "Applied large-scale system design and distributed computing principles to build cloud-native backend microservices in Java and Python across multi-cluster Kubernetes environments, improving service uptime by 25%.",
      "Redesigned CI/CD pipelines across GitLab, Jenkins, and Spinnaker, reducing release cycle time by 40% and enabling fully automated end-to-end deployments with zero manual intervention.",
      "Navigated highly ambiguous systems to build observability and evaluation tooling on Linux infrastructure, proactively surfacing failure modes and cutting mean time to detection (MTTD) by 35%.",
    ],
    tags: [
      "Java",
      "Python",
      "Kubernetes",
      "GitLab",
      "Jenkins",
      "Spinnaker",
      "Linux",
    ],
    image: EricssonLogo,
    link: "https://www.ericsson.com/",
  },
  {
    file: "citi.txt",
    year: 2026.33,
    growth: 90,
    title: "Software Developer Intern",
    company: "Citi",
    location: "Toronto, ON",
    dates: "May 2026 - Sept 2026",
    start: { year: 2026, month: 5 },
    end: { year: 2026, month: 9 },
    metrics: [
      "40% lower data retrieval latency",
      "60% lower query response time",
      "85% test coverage",
    ],
    bullets: [
      "Built a full-stack user management platform with a focus on intuitive UI design, using React 18, TypeScript, and AG Grid Enterprise integrated with a Spring Boot 3 backend, reducing data retrieval latency by 40% through optimized API design.",
      "Engineered event-driven backend microservices in Java 21 with Apache Kafka and Oracle DB for scalable data storage, applying distributed computing principles across 5+ services to cut workflow execution time by 30%.",
      "Built information retrieval and analytics infrastructure by integrating Elasticsearch across 500K+ records, cutting query response times by 60%; implemented resilient inter-service routing via Netflix Eureka.",
      "Hardened service security using CyberArk secrets management and improved test coverage to 85% via JUnit 5, Mockito, and JaCoCo across containerized Docker deployments.",
    ],
    tags: [
      "React 18",
      "TypeScript",
      "AG Grid Enterprise",
      "Spring Boot 3",
      "Java 21",
      "Apache Kafka",
      "Oracle DB",
      "Elasticsearch",
      "Netflix Eureka",
      "CyberArk",
      "JUnit 5",
      "Mockito",
      "JaCoCo",
      "Docker",
    ],
    image: CitiLogo,
    link: "https://www.citigroup.com/",
  },
  {
    year: 2027,
    growth: 98,
    title: "Future Opportunities",
    company: "?",
    story:
      "The journey continues... Always learning, always building, always growing.",
    image: "",
    link: "",
  },
];
