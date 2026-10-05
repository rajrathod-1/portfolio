export const SITE = {
  name: "Raj Rathod",
  role: "Software developer",
  status: "Open to new grad software roles",
  email: "rajrathod2323@gmail.com",
  github: "https://github.com/rajrathod-1",
  githubHandle: "github.com/rajrathod-1",
  linkedin: "https://linkedin.com/in/raj-rathod1",
  linkedinHandle: "linkedin.com/in/raj-rathod1",
  leetcode: "https://leetcode.com/u/popple_1/",
  leetcodeHandle: "leetcode.com/u/popple_1",
  resume: "/Raj_Rathod_Resume.pdf",
  resumeFile: "Raj_Rathod_Resume.pdf",
} as const;

export const TOAST_EVENT = "toast";

export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }));
}

export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(SITE.email);
    showToast("Copied email");
  } catch {
    // Clipboard access can be denied; show the address so it can be copied by hand.
    showToast(SITE.email);
  }
}
