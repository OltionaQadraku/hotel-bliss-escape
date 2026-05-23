const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const assert = require('assert');

const service = new chrome.ServiceBuilder(chromedriver.path);

describe('Vesa - Checkout + Recepsionisti', function() {
    this.timeout(90000);

    let driver;
    const BASE_URL = 'http://localhost:3000';
    const USER_EMAIL = 'testtimi1@gmail.com';
    const USER_PASSWORD = 'oltiona123';
    const RECEPTIONIST_EMAIL = 'testtimi2@gmail.com';
    const RECEPTIONIST_PASSWORD = 'vesa1234';

    async function loginAs(email, password) {
        await driver.get(`${BASE_URL}/login`);
        const emailInput = await driver.findElement(By.css('input[type="email"]'));
        await emailInput.clear();
        await emailInput.sendKeys(email);
        const passwordInput = await driver.findElement(By.css('input[type="password"]'));
        await passwordInput.clear();
        await passwordInput.sendKeys(password);
        await driver.findElement(By.css('.btn-dark')).click();
        await driver.wait(async () => {
            const url = await driver.getCurrentUrl();
            return !url.includes('/login');
        }, 10000);
    }

    
    async function setDateInput(element, isoDate) {
        await driver.executeScript(
            `var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
             setter.call(arguments[0], arguments[1]);
             arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
             arguments[0].dispatchEvent(new Event('change', { bubbles: true }));`,
            element, isoDate
        );
    }

    async function jsClick(element) {
        await driver.executeScript('arguments[0].scrollIntoView({block:"center"}); arguments[0].click();', element);
    }

    async function navigateToPayments() {
        await driver.get(`${BASE_URL}`);
        await driver.sleep(1500);

        const checkInInput = await driver.findElement(By.id('date'));
        await setDateInput(checkInInput, '2027-08-01');

        const checkOutInput = await driver.findElement(By.id('checkOutDate'));
        await setDateInput(checkOutInput, '2027-08-05');

        const searchBtn = await driver.findElement(
            By.xpath('//button[contains(text(),"Search Rooms")]')
        );
        await jsClick(searchBtn);

        await driver.wait(until.elementLocated(By.css('.btn-dark.w-100')), 15000);
        const bookNowBtn = await driver.findElement(By.css('.btn-dark.w-100'));
        await jsClick(bookNowBtn);

        await driver.wait(until.urlContains('/payments'), 10000);
        console.log('   → Faqja /payments u ngarkua me sukses');
    }

    beforeEach(async function() {
        const options = new chrome.Options();
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .setChromeOptions(options)
            .build();
    });

    afterEach(async function() {
        if (driver) await driver.quit();
    });

    it('Test 2.1: Checkout me pagesë Visa të suksesshme', async function() {
        console.log('   → Login si user...');
        await loginAs(USER_EMAIL, USER_PASSWORD);

        console.log('   → Duke kërkuar dhomë dhe duke kaluar te /payments...');
        await navigateToPayments();

        console.log('   → Duke plotësuar formularin e pagesës...');
        await driver.findElement(By.id('customerName')).sendKeys('Vesa Morina');
        await driver.findElement(By.id('cardholder')).sendKeys('Vesa Morina');
        await driver.findElement(By.id('bankName')).sendKeys('Raiffeisen Bank');
        await driver.findElement(By.id('cardNumber')).sendKeys('4111111111111111');

        const cardTypeSelect = await driver.findElement(By.id('cardType'));
        await driver.executeScript(
            `arguments[0].value = 'visa';
             arguments[0].dispatchEvent(new Event('change', { bubbles: true }));`,
            cardTypeSelect
        );

        await driver.findElement(By.id('cvv')).sendKeys('321');

        console.log('   → Duke klikuar Confirm Reservation...');
        const confirmBtn = await driver.findElement(By.css('.btn-dark.w-100'));
        await jsClick(confirmBtn);

        console.log('   → Duke pritur redirect te /confirmation...');
        await driver.wait(until.urlContains('/confirmation'), 20000);

        const pageSource = await driver.getPageSource();
        assert.ok(
            pageSource.includes('Reservation Confirmed') || pageSource.includes('confirmed'),
            'PASS: Checkout me Visa u krye dhe u shfaq konfirmimi'
        );
        console.log('   ✓ Checkout me Visa u krye me sukses!');
    });

    it('Test 2.2: Checkout me CVV të pavlefshëm', async function() {
        console.log('   → Login si user...');
        await loginAs(USER_EMAIL, USER_PASSWORD);

        console.log('   → Duke kaluar te /payments...');
        await navigateToPayments();

        console.log('   → Duke plotësuar formularin me CVV të pavlefshëm...');
        await driver.findElement(By.id('customerName')).sendKeys('Vesa Morina');
        await driver.findElement(By.id('cardholder')).sendKeys('Vesa Morina');
        await driver.findElement(By.id('bankName')).sendKeys('Raiffeisen Bank');
        await driver.findElement(By.id('cardNumber')).sendKeys('4111111111111111');

        const cardTypeSelect = await driver.findElement(By.id('cardType'));
        await driver.executeScript(
            `arguments[0].value = 'visa';
             arguments[0].dispatchEvent(new Event('change', { bubbles: true }));`,
            cardTypeSelect
        );

        await driver.findElement(By.id('cvv')).sendKeys('ab1');

        console.log('   → Duke klikuar Confirm Reservation...');
        const confirmBtn = await driver.findElement(By.css('.btn-dark.w-100'));
        await jsClick(confirmBtn);

        await driver.sleep(2000);

        console.log('   → Duke verifikuar mesazhin e gabimit...');
        const currentUrl = await driver.getCurrentUrl();
        assert.ok(currentUrl.includes('/payments'), 'PASS: Sistemi mbeti në /payments');

        const errorEl = await driver.findElement(By.css('.text-danger'));
        const errorText = await errorEl.getText();
        assert.ok(
            errorText.includes('CVV') || errorText.includes('not valid') || errorText.includes('digits'),
            `PASS: Mesazhi i gabimit u shfaq: "${errorText}"`
        );
        console.log(`   ✓ Sistemi refuzoi CVV të pavlefshëm: "${errorText}"`);
    });

    it('Test 2.3: Recepsionisti shton rezervim manual për klient', async function() {
        console.log('   → Login si receptionist...');
        await loginAs(RECEPTIONIST_EMAIL, RECEPTIONIST_PASSWORD);

        console.log('   → Duke naviguar te /receptionist-dashboard...');
        await driver.get(`${BASE_URL}/receptionist-dashboard`);
        await driver.wait(until.urlContains('/receptionist-dashboard'), 10000);

        const customerInput = await driver.findElement(By.css('input[name="customer_name"]'));
        await driver.wait(until.elementIsEnabled(customerInput), 15000);
        console.log('   → Forma u ngarkua dhe është aktive');

        console.log('   → Duke plotësuar emrin e klientit...');
        await customerInput.clear();
        await customerInput.sendKeys('Liridon Krasniqi');

        console.log('   → Duke pritur dhomët të ngarkohen...');
        const roomSelect = await driver.findElement(By.css('select[name="room_id"]'));

        await driver.wait(async () => {
            const opts = await roomSelect.findElements(By.css('option'));
            return opts.length > 1;
        }, 15000, 'Dhomët duhet të ngarkohen në select');
        const roomOptions = await roomSelect.findElements(By.css('option'));
        console.log('   → Duke zgjedhur dhomën...');
        await roomOptions[1].click();

        console.log('   → Duke vendosur datat...');
        const checkInInput = await driver.findElement(By.css('input[name="check_in"]'));
        await setDateInput(checkInInput, '2026-10-01');

        const checkOutInput = await driver.findElement(By.css('input[name="check_out"]'));
        await setDateInput(checkOutInput, '2026-10-05');

        console.log('   → Duke dërguar formularin...');
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await jsClick(submitBtn);

        await driver.wait(async () => {
            const source = await driver.getPageSource();
            return source.includes('Liridon Krasniqi');
        }, 15000, 'Rezervimi duhet të shfaqet në tabelë');

        const pageSource = await driver.getPageSource();
        assert.ok(
            pageSource.includes('Liridon Krasniqi'),
            'PASS: Rezervimi u shtua dhe shfaqet në listën e rezervimeve'
        );
        console.log('   ✓ Recepsionisti shtoi rezervimin me sukses!');
    });
});