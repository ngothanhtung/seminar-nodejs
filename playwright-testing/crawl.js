const util = require('util');
const _ = require('lodash');
const { chromium } = require('playwright');

const get = async (word) => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://tratu.coviet.vn/hoc-tieng-anh/tu-dien/lac-viet/A-V/' + word + '.html');

  let elementHandle = await page.$('#mtd_0');

  let text = await elementHandle.$eval('div.w', (node) => node.innerText);
  let phonetic = await elementHandle.$eval('div.p5l.fl.cB', (node) => node.innerText);
  let audio = await elementHandle.$eval('#playSound_2020', (node) => node.getAttribute('data-link'));

  const data = await page.evaluate(() => {
    let partElements = document.querySelectorAll('div.p10 > div');
    return Array.from(partElements)
      .filter((partElement) => {
        let wt = partElement.querySelector('div.ub');
        return wt.innerText !== 'Từ liên quan';
      })
      .map((partElement) => {
        let wt = partElement.querySelector('div.ub');
        let means = partElement.querySelectorAll('div.m');
        return { wordType: wt.innerText, means: Array.from(means).map((m) => m.innerText) };
      });
  });

  const final = { text, phonetic: _.replace(_.replace(phonetic, '[', '/ '), ']', ' /'), audio, description: data, dictionary: 'LacViet' };
  console.log(util.inspect(final, { showHidden: true, depth: null, colors: true }));
  await browser.close();
};

get('knife');
