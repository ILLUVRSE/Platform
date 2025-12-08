/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@illuvrse/ui"],
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
