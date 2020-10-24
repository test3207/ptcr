import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { Ptcr } from '../index';

const imgList = fs.readdirSync(path.resolve(__dirname, 'example'));

(async () => {
    const ptcr = new Ptcr();

    console.log('local test start');
    for (const img of imgList) {
        const imgDir = path.resolve(__dirname, 'example', img);
        const realCode = img.match(/^(.*?)(\..*?)?$/)![1];

        try {
            const result = await ptcr.run(imgDir);
            assert.strictEqual(result, realCode, `not ok for ${imgDir}`);
            console.log(`ok for ${imgDir}`);
        } catch (e) {
            console.log(e);
            try {            
                await ptcr.run(imgDir, true);
            } catch (e) {}
        }
    }
    console.log('local test done');

    console.log('online test start');
    const onlineImg = 'https://photo.test3207.com/1NHND8.png'
    try {
        const result = await ptcr.run(onlineImg);
        assert.strictEqual(result, '1NHND8', `not ok for online test`);
    } catch (e) {
        console.log(e);
        try {
            await ptcr.run(onlineImg, true);
        } catch (e) {}
    }
    console.log('online test done');

    await ptcr.close();
    console.log('test finished');
})();
