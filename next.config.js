/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@yxc/types", "@yxc/permissions", "@yxc/gateway-types"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**.3aka.com",
      },
    ],
  },
};

export default nextConfig;
