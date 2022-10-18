import { Uint, UINT64 } from "cuint";
export const TS_OFFSET = 1073741823;

const fromNumber64 = (n: number) =>
    UINT64(n % 4294967296, (n / 4294967296) | 0);

const toNumberCUInt = (n: Uint) => {
    return Number.parseInt(n.toString(32), 32);
    // Uint.toNumber only have the last 20 bits for the result
    // Here is a workaround
};

function byteswap(n: Uint): Uint {
    const s = n.toString(16).split("");
    const b: string[] = [];
    s.forEach((value, index) => {
        if (index % 2 === 0) {
            b[Math.floor(index / 2)] = value;
        } else {
            b[Math.floor(index / 2)] += value;
        }
    });
    return UINT64(0).fromString(b.reverse().join(""), 16);
}

function byte2int20(randBytes: Uint8Array): Uint {
    return UINT64(
        ((randBytes[0] << 16) | (randBytes[1] << 8) | randBytes[2]) >>> 4
    );
}

export function makeeuid(unixTimestamp: number, randBytes: Uint8Array): number {
    const mappedTs = fromNumber64(unixTimestamp).subtract(
        fromNumber64(TS_OFFSET)
    );
    const ts = mappedTs;
    const lsts = byteswap(ts).shiftLeft(20);
    const byteint = byte2int20(randBytes);
    const result = lsts.or(byteint);
    return toNumberCUInt(result);
}

export function inspectTimestamp(id: number): number {
    const id64 = fromNumber64(id);
    const ts = byteswap(id64.shiftRight(20));
    return toNumberCUInt(ts.add(fromNumber64(TS_OFFSET)));
}

export function inspectDate(id: number): Date {
    return new Date(inspectTimestamp(id) * 1000);
}

export function randeuid(unixTs?: number): number {
    const rand = new Uint8Array(3);
    crypto.getRandomValues(rand);
    const ts = unixTs || Math.floor(Date.now() / 1000);
    return makeeuid(ts, rand);
}
