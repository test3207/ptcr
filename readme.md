# ptcr

pt captcha recognizer

for now support NexusPHP-based pt website, will support more if i got more sites XD

## install

npm i ptcr

## usage

```typescript
import Ptcr from '../index';
(async () => {
    const ptcr = new Ptcr();
    console.log(await ptcr.run('https://photo.test3207.com/1NHND8.png')); // should be 1NHND8
    // console.log(await ptcr.run('path/to/local/file')); // support local file too
    await ptcr.close();
})();
```
