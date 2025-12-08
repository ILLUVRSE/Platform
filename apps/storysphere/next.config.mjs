/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@illuvrse/ui", "@illuvrse/agent-manager", "@illuvrse/contracts"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/liveloop",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
