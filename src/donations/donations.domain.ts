
export const calculatePvcdPoints = (amount: number): number => {
    if (amount < 20_000) return 0;
    if (amount < 30_000) return 5;
    if (amount < 50_000) return 7;
    if (amount < 100_000) return 8;
    return 10;
};
