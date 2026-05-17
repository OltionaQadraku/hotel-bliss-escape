const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const assert = require('assert');

const service = new chrome.ServiceBuilder(chromedriver.path);

describe('Oltiona - Autentifikimi + Rezervimi', function() {
    this.timeout(60000);

    let driver;
    const BASE_URL = 'http://localhost:3000';

    beforeEach(async function() {
        const options = new chrome.Options();
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .setChromeOptions(options)
            .build();
    });

   
    afterEach(async function() {
        if (driver) {
            await driver.quit();
        }
    });

    it('Test 1.1: Login me kredenciale të sakta', async function() {
        console.log('   → Duke hapur faqen e login-it...');
        await driver.get(`${BASE_URL}/login`);

        console.log('   → Duke plotësuar email-in...');
        const emailInput = await driver.findElement(By.css('input[type="email"]'));
        await emailInput.clear();
        await emailInput.sendKeys('testtimi1@gmail.com');

        console.log('   → Duke plotësuar password-in...');
        const passwordInput = await driver.findElement(By.css('input[type="password"]'));
        await passwordInput.clear();
        await passwordInput.sendKeys('oltiona123');

        console.log('   → Duke klikuar butonin Identifikohu...');
        const submitButton = await driver.findElement(By.css('.btn-dark'));
        await submitButton.click();

        console.log('   → Duke pritur redirect pas login-it...');
        await driver.wait(async () => {
            const url = await driver.getCurrentUrl();
            return !url.includes('/login');
        }, 10000);

        const currentUrl = await driver.getCurrentUrl();
        assert.ok(!currentUrl.includes('/login'),
            'PASS: Login u krye me sukses dhe userja u ridrejtua pas login-it');
        console.log('   ✓ Login me sukses!');
    });

    it('Test 1.2: Login me kredenciale të gabuara', async function() {
        console.log('   → Duke hapur faqen e login-it...');
        await driver.get(`${BASE_URL}/login`);

        console.log('   → Duke plotësuar kredenciale të gabuara...');
        const emailInput = await driver.findElement(By.css('input[type="email"]'));
        await emailInput.sendKeys('wrong@hotel.com');

        const passwordInput = await driver.findElement(By.css('input[type="password"]'));
        await passwordInput.sendKeys('wrongpassword');

        const submitButton = await driver.findElement(By.css('.btn-dark'));
        await submitButton.click();

        await driver.sleep(3000);

        console.log('   → Duke verifikuar që NUK ka redirect...');
        const currentUrl = await driver.getCurrentUrl();
        assert.ok(currentUrl.includes('/login'),
            'PASS: Sistemi nuk lejoi login me kredenciale të gabuara');
        console.log('   ✓ Sistemi refuzoi login-in me sukses!');
    });

    it('Test 1.3: Hyrja te dashboard pas login-it', async function() {
        console.log('   → Login fillimisht...');
        await driver.get(`${BASE_URL}/login`);

        await driver.findElement(By.css('input[type="email"]'))
            .sendKeys('testtimi1@gmail.com');
        await driver.findElement(By.css('input[type="password"]'))
            .sendKeys('oltiona123');
        await driver.findElement(By.css('.btn-dark')).click();

        await driver.wait(async () => {
            const url = await driver.getCurrentUrl();
            return !url.includes('/login');
        }, 10000);
        console.log('   → Login OK, tani te faqja kryesore...');

        await driver.sleep(2000);
        const pageSource = await driver.getPageSource();
        assert.ok(pageSource.length > 0, 'PASS: Faqja u ngarkua pas login-it');
        console.log('   ✓ Faqja u shfaq me sukses!');
    });
});
