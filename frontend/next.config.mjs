/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ["undici", "firebase", "@firebase/auth"],
	webpack: (config) => {
		config.resolve.alias.undici = false; // Try to ignore undici if not needed on client?
		return config;
	},
};

export default nextConfig;
