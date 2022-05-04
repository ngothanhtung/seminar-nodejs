const util = require('util');
const _ = require('lodash');
const { chromium } = require('playwright');
const { forEach } = require('lodash');

const get = async (word) => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://chonsoc3.mobifone.vn');

  await page.click('#ui-id-2');
  await page.fill('#so_cuoi', '9*804');
  await page.click('label:has-text("Trả trước")');
  await page.click('#btnSearch');
  await page.waitForSelector('#table-column-toggle');
  let elementHandle = await page.$('#table-column-toggle');

  let trNodes = await elementHandle.$$eval('tbody > tr', (nodes) => nodes);

  forEach(trNodes, async (trNode) => {
    let tdNodes = await trNode.$$eval('td', (nodes) => nodes);
    console.log(tdNodes);
  });

  console.log(util.inspect(text, { showHidden: true, depth: null, colors: true }));
  // console.log(text);
  // let text = await elementHandle.$eval('div.w', (node) => node.innerText);
  // let phonetic = await elementHandle.$eval('div.p5l.fl.cB', (node) => node.innerText);
  // let audio = await elementHandle.$eval('#playSound_2020', (node) => node.getAttribute('data-link'));

  // const data = await page.evaluate(() => {
  //   let partElements = document.querySelectorAll('div.p10 > div');
  //   return Array.from(partElements)
  //     .filter((partElement) => {
  //       let wt = partElement.querySelector('div.ub');
  //       return wt.innerText !== 'Từ liên quan';
  //     })
  //     .map((partElement) => {
  //       let wt = partElement.querySelector('div.ub');
  //       let means = partElement.querySelectorAll('div.m');
  //       return { wordType: wt.innerText, means: Array.from(means).map((m) => m.innerText) };
  //     });
  // });

  // const final = { text, phonetic: _.replace(_.replace(phonetic, '[', '/ '), ']', ' /'), audio, description: data, dictionary: 'LacViet' };
  // console.log(util.inspect(final, { showHidden: true, depth: null, colors: true }));
  // await browser.close();
};

get('knife');
