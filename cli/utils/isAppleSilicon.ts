import { execSync } from "child_process";

const isAppleSilicon = (): boolean => {
  const isMac = process.platform === "darwin";
  if (isMac) {
    const cpuArchitecture = execSync(
      `sysctl -n machdep.cpu.brand_string`
    ).toString();
    return cpuArchitecture.toLowerCase().includes("apple m");
  }

  return false;
};

export default isAppleSilicon;
