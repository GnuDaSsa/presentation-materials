import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const deckDir = resolve(process.cwd(), "decks", "donawa-presentation");
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Users/sajw1/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe",
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(resolve(deckDir, "index.html")).href, { waitUntil: "networkidle" });

const report = await page.locator(".slide").evaluateAll((slides) => slides.map((slide, index) => ({
  slide: index + 1,
  overflowX: slide.scrollWidth - slide.clientWidth,
  overflowY: slide.scrollHeight - slide.clientHeight,
})));
const slideCount = report.length;

const alignmentChecks = [];
for (const viewport of [{ width: 1920, height: 840 }, { width: 1365, height: 768 }]) {
  await page.setViewportSize(viewport);
  await page.goto(`${pathToFileURL(resolve(deckDir, "index.html")).href}#slide-4`, { waitUntil: "networkidle" });
  await page.waitForTimeout(450);
  const alignment = await page.locator(".slide.is-active").evaluate((slide) => {
    const rect = slide.getBoundingClientRect();
    return {
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      transform: getComputedStyle(slide).transform,
      deckScale: getComputedStyle(document.documentElement).getPropertyValue('--deck-scale'),
      position: { left: getComputedStyle(slide).left, top: getComputedStyle(slide).top, margin: getComputedStyle(slide).margin, position: getComputedStyle(slide).position },
      window: { width: window.innerWidth, height: window.innerHeight, documentWidth: document.documentElement.clientWidth, bodyWidth: document.body.clientWidth },
      horizontalOffset: Math.abs(rect.left - ((window.innerWidth - rect.width) / 2)),
      verticalOffset: Math.abs(rect.top - ((window.innerHeight - rect.height) / 2)),
    };
  });
  alignmentChecks.push({ viewport, ...alignment });
}

await page.setViewportSize({ width: 1920, height: 1080 });
await page.goto(`${pathToFileURL(resolve(deckDir, "index.html")).href}#slide-3`, { waitUntil: "networkidle" });
await page.waitForTimeout(450);
const getNaumState = () => page.locator('.naum-photo').evaluate((slide) => ({
  stage: slide.dataset.nameStage || '0',
  name: slide.querySelector('.naum-name')?.textContent?.replace(/\s/g, ''),
  opacity: getComputedStyle(slide.querySelector('.naum-name')).opacity,
  prefix: (() => {
    const prefix = slide.querySelector('.naum-prefix');
    return { visibleWidth: prefix.clientWidth, contentWidth: prefix.scrollWidth };
  })(),
  hash: window.location.hash,
}));
const naumSequence = [await getNaumState()];
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(600);
naumSequence.push(await getNaumState());
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(600);
naumSequence.push(await getNaumState());
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(450);
naumSequence.push(await getNaumState());

await page.goto(`${pathToFileURL(resolve(deckDir, "index.html")).href}#slide-14`, { waitUntil: "networkidle" });
await page.waitForTimeout(450);
const getExpoState = () => page.locator('.expo-banner-slide').evaluate((slide) => ({
  stage: slide.dataset.expoStage || '0',
  problemOpacity: getComputedStyle(slide.querySelector('.expo-problem')).opacity,
  solutionOpacity: getComputedStyle(slide.querySelector('.expo-solution')).opacity,
  mergedOpacity: getComputedStyle(slide.querySelector('.expo-merged-banner')).opacity,
  hash: window.location.hash,
}));
const expoSequence = [await getExpoState()];
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(3400);
expoSequence.push(await getExpoState());
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(450);
expoSequence.push(await getExpoState());

console.log(JSON.stringify({ slideCount, overflow: report, alignment: alignmentChecks, naumSequence, expoSequence }, null, 2));
const failures = report.filter((slide) => slide.overflowX > 0 || slide.overflowY > 0);
const alignmentFailures = alignmentChecks.filter((check) => check.horizontalOffset > 1 || check.verticalOffset > 1);
const naumFailure = naumSequence[0].stage !== '0'
  || naumSequence[0].opacity !== '0'
  || naumSequence[1].stage !== '1'
  || naumSequence[1].opacity !== '1'
  || naumSequence[2].stage !== '2'
  || naumSequence[2].name !== '사나움'
  || naumSequence[2].prefix.visibleWidth < naumSequence[2].prefix.contentWidth
  || naumSequence[3].hash !== '#slide-4';
const expoFailure = expoSequence[0].stage !== '0'
  || expoSequence[0].problemOpacity !== '1'
  || expoSequence[0].solutionOpacity !== '0'
  || expoSequence[1].stage !== '1'
  || expoSequence[1].problemOpacity !== '0'
  || expoSequence[1].solutionOpacity !== '1'
  || expoSequence[1].mergedOpacity !== '1'
  || expoSequence[2].hash !== '#slide-15';
const serviceLink = await page.locator('.service-link').first().evaluate((link) => ({ href: link.href, target: link.target }));
const serviceLinkFailure = serviceLink.href !== 'https://donawa-gecko-price.vercel.app/' || serviceLink.target !== '_blank';
const closingServiceLink = await page.locator('.closing-service-link').evaluate((link) => ({ href: link.href, target: link.target }));
const closingServiceLinkFailure = closingServiceLink.href !== 'https://donawa-gecko-price.vercel.app/' || closingServiceLink.target !== '_blank';
const morphSearchImage = await page.locator('.morph-search-slide img').evaluate((image) => ({ src: image.src, width: image.naturalWidth, height: image.naturalHeight }));
const morphSearchFailure = !morphSearchImage.src.endsWith('/assets/morph-search-cards.png') || morphSearchImage.width === 0 || morphSearchImage.height === 0;
const questionLayout = await page.locator('.question-type').evaluate((question) => {
  const style = getComputedStyle(question);
  return { html: question.innerHTML, height: question.getBoundingClientRect().height, lineHeight: parseFloat(style.lineHeight), whiteSpace: style.whiteSpace };
});
const questionFailure = questionLayout.html !== '생명의 가치를<br>돈으로 매길 수 있을까?'
  || questionLayout.whiteSpace !== 'nowrap'
  || questionLayout.height > questionLayout.lineHeight * 2.1;
const closingText = await page.locator('.slide:last-of-type').textContent();
const closingFailure = !closingText?.includes('파충류 입문자,')
  || !closingText.includes('파충류 애호가,')
  || !closingText.includes('파충류 브리더들의 합리적인 소비를 바라며,')
  || !closingText.includes('감사합니다.');
const expansionSlide = page.locator('.species-expansion-slide');
const speciesBackgrounds = await expansionSlide.locator('.species-rail article').evaluateAll((cards) => cards.map((card) => getComputedStyle(card).backgroundImage));
const expansionFailure = await expansionSlide.count() !== 1
  || await expansionSlide.locator('.species-rail article').count() !== 4
  || speciesBackgrounds.length !== 4
  || speciesBackgrounds.some((background) => !background.includes('species-expansion-panels.png'));
await browser.close();
if (slideCount !== 17 || failures.length || alignmentFailures.length || naumFailure || expoFailure || serviceLinkFailure || closingServiceLinkFailure || morphSearchFailure || questionFailure || closingFailure || expansionFailure) process.exitCode = 1;
