import React from "react";
import {
  FaAws,
  FaCss3Alt,
  FaDocker,
  FaGitAlt,
  FaHtml5,
  FaJava,
  FaJs,
  FaNodeJs,
  FaPython,
  FaReact,
} from "react-icons/fa";
import {
  SiApachekafka,
  SiCplusplus,
  SiElasticsearch,
  SiFlask,
  SiMysql,
  SiOpenai,
  SiRedis,
  SiSpringboot,
  SiTypescript,
} from "react-icons/si";

interface Tool {
  icon: React.ReactNode;
  label: string;
}

const GROUPS: { title: string; tools: Tool[] }[] = [
  {
    title: "Languages",
    tools: [
      { icon: <FaJava />, label: "Java" },
      { icon: <FaPython />, label: "Python" },
      { icon: <FaJs />, label: "JavaScript" },
      { icon: <SiTypescript />, label: "TypeScript" },
      { icon: <SiCplusplus />, label: "C++" },
      { icon: <SiMysql />, label: "SQL" },
    ],
  },
  {
    title: "Frameworks",
    tools: [
      { icon: <FaReact />, label: "React.js" },
      { icon: <FaHtml5 />, label: "HTML5" },
      { icon: <FaCss3Alt />, label: "CSS3" },
      { icon: <FaNodeJs />, label: "Node.js" },
      { icon: <SiFlask />, label: "Flask" },
      { icon: <SiSpringboot />, label: "Spring Boot" },
    ],
  },
  {
    title: "Cloud & data",
    tools: [
      { icon: <FaDocker />, label: "Docker" },
      { icon: <FaAws />, label: "AWS" },
      { icon: <FaGitAlt />, label: "Git" },
      { icon: <SiMysql />, label: "MySQL" },
      { icon: <SiMysql />, label: "MS SQL Server" },
      { icon: <SiRedis />, label: "Redis" },
      { icon: <SiApachekafka />, label: "Apache Kafka" },
      { icon: <SiElasticsearch />, label: "Elasticsearch" },
    ],
  },
  {
    title: "AI",
    tools: [{ icon: <SiOpenai />, label: "OpenAI APIs" }],
  },
];

const ToolItem: React.FC<Tool> = ({ icon, label }) => (
  <li className="group flex items-center gap-2 rounded-full border border-line px-3 py-1.5">
    <span className="text-base text-mute transition-colors duration-200 group-hover:text-blue">
      {icon}
    </span>
    <span className="font-mono text-xs text-fog/90">{label}</span>
  </li>
);

const ToolsSection: React.FC = () => (
  <section
    aria-label="Tools and technologies"
    className="mx-auto mb-20 mt-24 w-full max-w-5xl px-4 sm:px-6 lg:px-8"
  >
    <h3 className="mb-6 text-center font-mono text-sm text-mute">
      Tools and technologies
    </h3>

    <div className="space-y-5">
      {GROUPS.map((group) => (
        <div
          key={group.title}
          className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4"
        >
          <p className="w-28 shrink-0 pt-1.5 font-mono text-xs text-mute">
            {group.title}
          </p>
          <ul className="flex flex-wrap gap-2">
            {group.tools.map((tool) => (
              <ToolItem key={tool.label} {...tool} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

export default ToolsSection;
