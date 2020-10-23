import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { Ptcr } from '../index';

const imgList = fs.readdirSync(path.resolve(__dirname, 'example'));

(async () => {
    const ptcr = new Ptcr();
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
    await ptcr.close();
    console.log('test finished');
})();
