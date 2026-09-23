import React from "react";
import { motion } from "framer-motion";
import { FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa6";
import { SiLeetcode } from "react-icons/si";
import { Copy, Download } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { SITE, copyEmail } from "@/lib/site";

const LINKS = [
  {
    icon: <FaLinkedin className="text-3xl md:text-4xl" />,
    href: SITE.linkedin,
    label: "LinkedIn",
    text: `/${SITE.linkedinHandle.split("/").pop()}`,
  },
  {
    icon: <FaGithub className="text-3xl md:text-4xl" />,
    href: SITE.github,
    label: "GitHub",
    text: `/${SITE.githubHandle.split("/").pop()}`,
  },
  {
    icon: <SiLeetcode className="text-3xl md:text-4xl" />,
    href: SITE.leetcode,
    label: "LeetCode",
    text: `/${SITE.leetcodeHandle.split("/").pop()}`,
  },
  {
    icon: <FaEnvelope className="text-3xl md:text-4xl" />,
    href: `mailto:${SITE.email}`,
    label: "Email",
    text: SITE.email,
  },
];

const Connect: React.FC = () => (
  <div className="relative overflow-hidden">
    {/* The oversized circle that lifts the footer off the page background. */}
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 border-t border-line bg-surface"
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        width: "300vw",
        height: "300vw",
        borderRadius: "50%",
      }}
    />

    <div className="relative z-10 mx-auto mt-20 max-w-5xl px-6 md:px-10">
      <div className="mb-10 flex justify-center">
        <SectionHeading path="~/connect" label="Connect" />
      </div>

      <div className="mb-10 flex justify-center">
        <div className="rounded-full border border-line bg-ink px-6 py-4 md:px-10 md:py-6">
          <ul className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            {LINKS.map((item) => (
              <li key={item.label} className="group relative">
                <a
                  href={item.href}
                  target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={`${item.label}: ${item.text}`}
                  className="block rounded-full p-3 text-mute transition-colors duration-200 hover:text-blue focus-visible:text-blue"
                >
                  {item.icon}
                </a>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-xs text-fog opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mb-16 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={copyEmail}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 font-mono text-sm text-fog transition-colors hover:border-blue hover:text-blue"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy email
        </button>

        <a
          href={SITE.resume}
          download={SITE.resumeFile}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 font-mono text-sm text-fog transition-colors hover:border-blue hover:text-blue"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download resume
        </a>
      </div>

      <div className="h-px w-full bg-line" />

      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="py-6 text-center font-mono text-xs text-mute"
      >
        © {new Date().getFullYear()} {SITE.name}
      </motion.footer>
    </div>
  </div>
);

export default Connect;
