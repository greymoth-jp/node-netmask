import * as assert from 'assert';
import { Netmask } from '../lib/netmask';

const fixtures: [string, string | null, string, string, number][] = [
    ['209.157.68.22/255.255.224.0', null, '209.157.64.0', '255.255.224.0', 19],
    ['209.157.68.22', '255.255.224.0', '209.157.64.0', '255.255.224.0', 19],
    ['209.157.70.33/19', null, '209.157.64.0', '255.255.224.0', 19],
    ['209.157.70.33', null, '209.157.70.33', '255.255.255.255', 32],
    ['140.174.82', null, '140.174.0.82', '255.255.255.255', 32],
    ['140.174', null, '140.0.0.174', '255.255.255.255', 32],
    ['10', null, '0.0.0.10', '255.255.255.255', 32],
    ['10/8', null, '0.0.0.0', '255.0.0.0', 8],
    ['209.157.64/19', null, '209.157.0.0', '255.255.224.0', 19],
    ['216.140.48.16/32', null, '216.140.48.16', '255.255.255.255', 32],
    ['209.157/17', null, '209.0.0.0', '255.255.128.0', 17],
    ['0.0.0.0/0', null, '0.0.0.0', '0.0.0.0', 0],
    ['0xffffffff', null, '255.255.255.255', '255.255.255.255', 32],
    ['1.1', null, '1.0.0.1', '255.255.255.255', 32],
    ['1.0xffffff', null, '1.255.255.255', '255.255.255.255', 32],
    ['1.2.3', null, '1.2.0.3', '255.255.255.255', 32],
    ['1.2.0xffff', null, '1.2.255.255', '255.255.255.255', 32],
];

describe('Netmask parsing', () => {
    fixtures.forEach(([addr, mask, base, expectedMask, bitmask]) => {
        const label = mask ? `${addr} with ${mask}` : addr;
        describe(label, () => {
            const block = new Netmask(addr, mask!);

            it(`base is '${base}'`, () => {
                assert.strictEqual(block.base, base);
            });
            it(`mask is '${expectedMask}'`, () => {
                assert.strictEqual(block.mask, expectedMask);
            });
            it(`bitmask is ${bitmask}`, () => {
                assert.strictEqual(block.bitmask, bitmask);
            });
            it(`toString is '${base}/${bitmask}'`, () => {
                assert.strictEqual(block.toString(), block.base + '/' + block.bitmask);
            });
        });
    });
});

describe('Netmask contains IP', () => {
    describe('block 192.168.1.0/24', () => {
        const block = new Netmask('192.168.1.0/24');

        it('contains IP 192.168.1.0', () => assert.ok(block.contains('192.168.1.0')));
        it('contains IP 192.168.1.255', () => assert.ok(block.contains('192.168.1.255')));
        it('contains IP 192.168.1.63', () => assert.ok(block.contains('192.168.1.63')));
        it('does not contain IP 192.168.0.255', () => assert.ok(!block.contains('192.168.0.255')));
        it('does not contain IP 192.168.2.0', () => assert.ok(!block.contains('192.168.2.0')));
        it('does not contain IP 10.168.2.0', () => assert.ok(!block.contains('10.168.2.0')));
        it('does not contain IP 209.168.2.0', () => assert.ok(!block.contains('209.168.2.0')));
        it('contains block 192.168.1.0/24', () => assert.ok(block.contains('192.168.1.0/24')));
        it('does not contain block 192.168.1 (0.192.168.1)', () => assert.ok(!block.contains('192.168.1')));
        it('contains block 192.168.1.128/25', () => assert.ok(block.contains('192.168.1.128/25')));
        it('does not contain block 192.168.1.0/23', () => assert.ok(!block.contains('192.168.1.0/23')));
        it('does not contain block 192.168.2.0/24', () => assert.ok(!block.contains('192.168.2.0/24')));
        it('toString equals 192.168.1.0/24', () => assert.strictEqual(block.toString(), '192.168.1.0/24'));
    });

    describe('block 192.168.0.0/24', () => {
        const block = new Netmask('192.168.0.0/24');

        it('does not contain block 192.168 (0.0.192.168)', () => assert.ok(!block.contains('192.168')));
        it('does not contain block 192.168.0.0/16', () => assert.ok(!block.contains('192.168.0.0/16')));
    });

    describe('block 31.0.0.0/8', () => {
        const block = new Netmask('31.0.0.0/8');

        it('contains IP 31.5.5.5', () => assert.ok(block.contains('31.5.5.5')));
        it('does not contain IP 031.5.5.5 (25.5.5.5)', () => assert.ok(!block.contains('031.5.5.5')));
        it('does not contain IP 0x31.5.5.5 (49.5.5.5)', () => assert.ok(!block.contains('0x31.5.5.5')));
        it('does not contain IP 0X31.5.5.5 (49.5.5.5)', () => assert.ok(!block.contains('0X31.5.5.5')));
    });

    describe('block 127.0.0.0/8', () => {
        const block = new Netmask('127.0.0.0/8');

        it('contains IP 127.0.0.2', () => assert.ok(block.contains('127.0.0.2')));
        it('contains IP 0177.0.0.2 (127.0.0.2)', () => assert.ok(block.contains('0177.0.0.2')));
        it('contains IP 0x7f.0.0.2 (127.0.0.2)', () => assert.ok(block.contains('0x7f.0.0.2')));
        it('does not contain IP 127 (0.0.0.127)', () => assert.ok(!block.contains('127')));
        it('does not contain IP 0177 (0.0.0.127)', () => assert.ok(!block.contains('0177')));
    });

    describe('block 0.0.0.0/0', () => {
        const block = new Netmask('0.0.0.0/0');

        it('contains IP 0.0.0.0', () => assert.ok(block.contains('0.0.0.0')));
        it('contains IP 0', () => assert.ok(block.contains('0')));
        it('contains IP 10 (0.0.0.10)', () => assert.ok(block.contains('10')));
        it('contains IP 010 (0.0.0.8)', () => assert.ok(block.contains('010')));
        it('contains IP 0x10 (0.0.0.16)', () => assert.ok(block.contains('0x10')));
    });
});

describe('Netmask forEach', () => {
    it('block 192.168.1.0/24 loops through 254 addresses', () => {
        const block = new Netmask('192.168.1.0/24');
        let called = 0;
        block.forEach((_ip, _long, index) => { called = index; });
        assert.strictEqual(called + 1, 254);
    });

    it('block 192.168.1.0/23 loops through 510 addresses', () => {
        const block = new Netmask('192.168.1.0/23');
        let called = 0;
        block.forEach((_ip, _long, index) => { called = index; });
        assert.strictEqual(called + 1, 510);
    });
});

describe('Netmask block containment', () => {
    describe('can build a block', () => {
        const block = new Netmask('10.1.2.0/24');

        it('should contain a sub-block', () => {
            const block1 = new Netmask('10.1.2.10/29');
            assert.ok(block.contains(block1));
        });

        it('should contain another sub-block', () => {
            const block2 = new Netmask('10.1.2.10/31');
            assert.ok(block.contains(block2));
        });

        it('should contain a third sub-block', () => {
            const block3 = new Netmask('10.1.2.20/32');
            assert.ok(block.contains(block3));
        });
    });

    describe('when presented with an octet which is not a number', () => {
        const block = new Netmask('192.168.0.0/29');

        it('should throw', () => {
            assert.throws(() => block.contains('192.168.~.4'), Error);
        });
    });

    describe('can handle hexadecimal, octal, & decimal octets in input IP', () => {
        const block1 = new Netmask('31.0.0.0/19');
        const block2 = new Netmask('127.0.0.0/8');
        const block3 = new Netmask('255.0.0.1/12');
        const block4 = new Netmask('10.0.0.1/8');
        const block5 = new Netmask('1.0.0.1/4');

        describe('octal', () => {
            it('block 31.0.0.0/19 does not contain 031.0.5.5', () => assert.ok(!block1.contains('031.0.5.5')));
            it('block 127.0.0.0/8 contains 0177.0.0.2 (127.0.0.2)', () => assert.ok(block2.contains('0177.0.0.2')));
            it('block 255.0.0.1/12 does not contain 0255.0.0.2 (173.0.0.2)', () => assert.ok(!block3.contains('0255.0.0.2')));
            it('block 10.0.0.1/8 contains 012.0.0.255 (10.0.0.255)', () => assert.ok(block4.contains('012.0.0.255')));
            it('block 1.0.0.1/4 contains 01.02.03.04', () => assert.ok(block5.contains('01.02.03.04')));
        });

        describe('hexadecimal', () => {
            it('block 31.0.0.0/19 does not contain 0x31.0.5.5', () => assert.ok(!block1.contains('0x31.0.5.5')));
            it('block 127.0.0.0/8 contains 0x7f.0.0.0x2 (127.0.0.2)', () => assert.ok(block2.contains('0x7f.0.0.0x2')));
            it('block 255.0.0.1/12 contains 0xff.0.0.2', () => assert.ok(block3.contains('0xff.0.0.2')));
            it('block 10.0.0.1/8 does not contain 0x10.0.0.255', () => assert.ok(!block4.contains('0x10.0.0.255')));
            it('block 1.0.0.1/4 contains 0x1.0x2.0x3.0x4', () => assert.ok(block5.contains('0x1.0x2.0x3.0x4')));
        });

        describe('decimal', () => {
            it('block 31.0.0.0/19 contains 31.0.5.5', () => assert.ok(block1.contains('31.0.5.5')));
            it('block 127.0.0.0/8 does not contain 128.0.0.2', () => assert.ok(!block2.contains('128.0.0.2')));
            it('block 255.0.0.1/12 contains 255.0.0.2', () => assert.ok(block3.contains('255.0.0.2')));
            it('block 10.0.0.1/8 contains 10.0.0.255', () => assert.ok(block4.contains('10.0.0.255')));
            it('block 1.0.0.1/4 contains 1.2.3.4', () => assert.ok(block5.contains('1.2.3.4')));
        });
    });
});
