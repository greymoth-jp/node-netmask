import * as assert from 'assert';
import { Netmask } from '../lib/netmask';

describe('Netmask IPv6 parsing', () => {
    it('parses CIDR notation', () => {
        const block = new Netmask('2001:db8::/32');
        assert.strictEqual(block.bitmask, 32);
        assert.strictEqual(block.base, '2001:db8::');
    });
    it('defaults to /128 without prefix', () => {
        const block = new Netmask('::1');
        assert.strictEqual(block.bitmask, 128);
        assert.strictEqual(block.base, '::1');
    });
    it('accepts mask as second argument', () => {
        const block = new Netmask('2001:db8::', 32);
        assert.strictEqual(block.bitmask, 32);
    });
    it('throws on invalid address', () => {
        assert.throws(() => new Netmask('garbage::/64'), Error);
    });
    it('throws on bitmask > 128', () => {
        assert.throws(() => new Netmask('::1/129'), Error);
    });
    it('throws on negative bitmask', () => {
        assert.throws(() => new Netmask('::1', -1), Error);
    });
});

describe('Netmask IPv6 properties', () => {
    describe('2001:db8::/32', () => {
        const block = new Netmask('2001:db8::/32');

        it('base', () => assert.strictEqual(block.base, '2001:db8::'));
        it('bitmask', () => assert.strictEqual(block.bitmask, 32));
        it('size', () => assert.strictEqual(block.size, 2 ** 96));
        it('first equals base', () => assert.strictEqual(block.first, block.base));
        it('last', () => assert.strictEqual(block.last, '2001:db8:ffff:ffff:ffff:ffff:ffff:ffff'));
        it('broadcast is undefined', () => assert.strictEqual(block.broadcast, undefined));
    });

    describe('::1/128', () => {
        const block = new Netmask('::1/128');

        it('base', () => assert.strictEqual(block.base, '::1'));
        it('size is 1', () => assert.strictEqual(block.size, 1));
        it('first equals last', () => assert.strictEqual(block.first, block.last));
    });

    describe('::/0', () => {
        const block = new Netmask('::/0');

        it('base', () => assert.strictEqual(block.base, '::'));
        it('size is 2^128', () => assert.strictEqual(block.size, 2 ** 128));
        it('last is all ones', () => assert.strictEqual(block.last, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'));
    });

    describe('fe80::/10', () => {
        const block = new Netmask('fe80::/10');

        it('base', () => assert.strictEqual(block.base, 'fe80::'));
        it('bitmask', () => assert.strictEqual(block.bitmask, 10));
    });
});

describe('Netmask IPv6 contains', () => {
    const block = new Netmask('2001:db8::/32');

    it('contains an IP in the block', () => {
        assert.ok(block.contains('2001:db8::1'));
    });
    it('contains the base address', () => {
        assert.ok(block.contains('2001:db8::'));
    });
    it('contains the last address', () => {
        assert.ok(block.contains('2001:db8:ffff:ffff:ffff:ffff:ffff:ffff'));
    });
    it('does not contain an IP outside the block', () => {
        assert.ok(!block.contains('2001:db9::1'));
    });
    it('does not contain a different network', () => {
        assert.ok(!block.contains('fe80::1'));
    });
    it('contains a sub-block', () => {
        assert.ok(block.contains('2001:db8:1::/48'));
    });
    it('contains a sub-block as Netmask object', () => {
        const sub = new Netmask('2001:db8:abcd::/48');
        assert.ok(block.contains(sub));
    });
    it('does not contain a larger block', () => {
        assert.ok(!block.contains('2001:db8::/16'));
    });
    it('does not contain an overlapping block outside', () => {
        assert.ok(!block.contains('2001:db9::/32'));
    });
});

describe('Netmask IPv6 next', () => {
    it('returns the next block', () => {
        const block = new Netmask('2001:db8::/32');
        const next = block.next();
        assert.strictEqual(next.toString(), '2001:db9::/32');
    });
    it('returns the previous block with count=-1', () => {
        const block = new Netmask('2001:db9::/32');
        const prev = block.next(-1);
        assert.strictEqual(prev.toString(), '2001:db8::/32');
    });
    it('skips multiple blocks', () => {
        const block = new Netmask('2001:db8::/32');
        const skip = block.next(2);
        assert.strictEqual(skip.toString(), '2001:dba::/32');
    });
});

describe('Netmask IPv6 forEach', () => {
    it('iterates over a /126 block (4 addresses)', () => {
        const block = new Netmask('2001:db8::0/126');
        const collected: string[] = [];
        block.forEach((ip) => { collected.push(ip); });
        assert.strictEqual(collected.length, 4);
        assert.strictEqual(collected[0], '2001:db8::');
        assert.strictEqual(collected[3], '2001:db8::3');
    });

    it('iterates over a /128 block (1 address)', () => {
        const block = new Netmask('::1/128');
        let count = 0;
        block.forEach(() => { count++; });
        assert.strictEqual(count, 1);
    });
});

describe('Netmask IPv6 toString', () => {
    it('formats as base/bitmask', () => {
        assert.strictEqual(new Netmask('2001:db8::/32').toString(), '2001:db8::/32');
    });
    it('formats loopback', () => {
        assert.strictEqual(new Netmask('::1/128').toString(), '::1/128');
    });
});

describe('Netmask IPv6 edge cases', () => {
    it('handles IPv4-mapped addresses', () => {
        const block = new Netmask('::ffff:192.168.1.0/120');
        assert.ok(block.contains('::ffff:192.168.1.1'));
        assert.ok(!block.contains('::ffff:192.168.2.1'));
    });
    it('masks off host bits in constructor', () => {
        const block = new Netmask('2001:db8::1/32');
        assert.strictEqual(block.base, '2001:db8::');
    });
});
