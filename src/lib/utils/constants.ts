export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_CONTRACT_ADDRESS || "") as `0x${string}`;
export const FACTORY = (process.env.NEXT_PUBLIC_FACTORY_CONTRACT || "") as `0x${string}`;

export default {
  CONTRACT_ADDRESS,
  FACTORY,
};
