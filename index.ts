import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import { EventEmitter } from 'events';
import path from 'path';
import http from 'http';
import https from 'https';

const timeout = 5000;

const request = async (targetUrl:string, method='GET', retry = 3) => {
    const protocol = (new URL(targetUrl)).protocol;
    while (retry) {
        retry--;
        try {
            return await new Promise<Buffer>((resolve, reject) => {
                (protocol === 'http:' ? http : https).request(targetUrl, { method, timeout }, (oauthRes) => {
                    const chunkList:any[] = [];
                    oauthRes.on('error', (e) => {
                        reject(e);
                    });
                    oauthRes.on('data', (chunk) => {
                        chunkList.push(chunk);
                    });
                    oauthRes.on('end', () => {
                        resolve(Buffer.concat(chunkList));
                    });
                }).on('error', (e) => {
                    reject(e);
                }).end();
            });
        } catch (e) {}
    }
    throw new Error('timeout');
};

export class Ptcr extends EventEmitter {
    private worker: Tesseract.Worker;
    // hard code for NexusPHP only! won't work for the others or modified ones!
    // if you are interested in related area, you can check tesseract for more detail.
    private offset = 24;
    private step = 18;
    private top = 14;
    private width = 10;
    private height = 12;
    private charLength = 6;
    private dev = false;
    private queue:{img: string|Buffer, resolve: any, reject: any} [] = [];
    private inited = false;
    private checkQueueLock = false;
    constructor() {
        super();
        this.worker = Tesseract.createWorker({
            langPath: path.resolve(__dirname, 'lang-data'),
        });
        this.on('checkQueue', async () => {
            if (!this.inited) {
                await this.init();
            }
            if (this.checkQueueLock) {
                return;
            }
            this.checkQueueLock = true;
            const task = this.queue.shift();
            if (!task) {
                this.checkQueueLock = false;
                return;
            }
            try {
                let result = '';
                const id = Math.random().toFixed(4).slice(-4);
                for (let i = 0 ; i < this.charLength ; i++) {
                    const target = typeof task.img === 'string' && task.img.startsWith('http') ? await request(task.img) : task.img;
                    const buffer = await sharp(target).extract({
                        left: this.offset + i * this.step,
                        top: this.top,
                        width: this.width,
                        height: this.height,
                    }).toBuffer();
                    if (this.dev) {
                        fs.writeFileSync(`./temp/${id}_${i}.png`, buffer);
                    }
                    const { data: { text } } = await this.worker.recognize(
                        buffer,
                    );
                    result += text[0] || '';
                }
                if (result.length !== 6) {
                    if (this.dev) { console.log(result); }
                    throw new Error('failed');
                }
                task.resolve(result);
            } catch (e) {
                task.reject(e);
            } finally {
                this.checkQueueLock = false;
                this.emit('checkQueue');
            }
        })
    }

    async init () {
        if (this.inited) {
            return;
        }
        this.inited = true;
        await this.worker.load();
        await this.worker.loadLanguage('eng');
        await this.worker.initialize('eng');
        await this.worker.setParameters({
            tessedit_char_whitelist: '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ',
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR,
        });
    }

    async run (img:string|Buffer, dev = false) {
        const startAt = Number(new Date());
        this.dev = dev;
        const result = await new Promise((resolve, reject) => {
            this.queue.push({
                img,
                resolve,
                reject,
            });
            this.emit('checkQueue');
        })
        if (dev || true) { console.log(`cost ${Number(new Date()) - startAt}`); }
        return result;
    }

    async close () {
        await this.worker.terminate();
    }
}
