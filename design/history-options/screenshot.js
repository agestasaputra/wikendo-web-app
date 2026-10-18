
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const dir = process.argv[2];
  const files = fs.readdirSync(dir).filter(f=>f.startsWith('option') && f.endsWith('.html'));
  for(const file of files){
    const url = 'file://' + path.join(dir, file);
    await page.goto(url);
    await page.setViewport({width:800,height:600});
    const out = path.join(dir, file.replace('.html','.png'));
    await page.screenshot({path:out,fullPage:true});
    console.log('shot',out);
  }
  await browser.close();
})();
