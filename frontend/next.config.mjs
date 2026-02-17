import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ["undici"],

	// Image optimization for question assets — AVIF/WebP for speed advantage over competitors
	images: {
		formats: ["image/avif", "image/webp"],
		deviceSizes: [640, 750, 828, 1080, 1200],
		imageSizes: [16, 32, 48, 64, 96, 128, 256],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**.illmora.com",
			},
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
			},
		],
		minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
	},

	// Tree-shake heavy libraries for faster bundles
	experimental: {
		optimizePackageImports: ["recharts", "date-fns", "lucide-react"],
	},

	webpack: (config) => {
		config.resolve.alias.undici = false;
		return config;
	},

	// Cache static question assets aggressively
	async headers() {
		return [
			{
				source: "/question-assets/:path*",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
		];
	},
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
