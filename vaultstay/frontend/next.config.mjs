/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    webpack: (config) => {
        // Silence spurious React Native / pino-pretty imports from WalletConnect & MetaMask SDK
        config.resolve.alias = {
            ...config.resolve.alias,
            "@react-native-async-storage/async-storage": false,
            "pino-pretty": false,
        };
        return config;
    },
};

export default nextConfig;
