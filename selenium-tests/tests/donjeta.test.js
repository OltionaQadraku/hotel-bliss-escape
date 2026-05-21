const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const assert = require('assert');
const http = require('http');

const service = new chrome.ServiceBuilder(chromedriver.path);

function apiRequest(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'localhost',
            port: 8000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        };
        const req = http.request(options, (res) => {
            let buf = '';
            res.on('data', (c) => buf += c);
            res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve(buf); } });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

describe('Donjeta - Pastruesi + Kërkimi', function() {
    this.timeout(90000);

    let driver;
    let receptionistToken;
    let dirtyRoomId;
    const BASE_URL = 'http://localhost:3000';
    const CLEANER_EMAIL = 'testtimi3@gmail.com';
    const CLEANER_PASSWORD = 'donjeta123';
    const RECEPTIONIST_EMAIL = 'testtimi2@gmail.com';
    const RECEPTIONIST_PASSWORD = 'vesa1234';

   
    before(async function() {
        const loginRes = await apiRequest('POST', '/api/login', {
            email: RECEPTIONIST_EMAIL,
            password: RECEPTIONIST_PASSWORD,
        });
        receptionistToken = loginRes.token;

        const rooms = await apiRequest('GET', '/api/rooms', null, receptionistToken);
        if (Array.isArray(rooms) && rooms.length > 0) {
            dirtyRoomId = rooms[0].id;
            await apiRequest('PUT',
                `/api/receptionist/rooms/${dirtyRoomId}/status`,
                { status: 'dirty' },
                receptionistToken
            );
        }
    });

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
        await driver.executeScript(
            'arguments[0].scrollIntoView({block:"center"}); arguments[0].click();',
            element
        );
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

    it('Test 3.1: Pastruesi shikon listën e dhomave për pastrim', async function() {
        console.log('   → Login si cleaner...');
        await loginAs(CLEANER_EMAIL, CLEANER_PASSWORD);

        console.log('   → Duke naviguar te /cleaner-dashboard...');
        await driver.get(`${BASE_URL}/cleaner-dashboard`);
        await driver.wait(until.urlContains('/cleaner-dashboard'), 10000);

        await driver.wait(async () => {
            const source = await driver.getPageSource();
            return !source.includes('Duke ngarkuar...');
        }, 15000);

        console.log('   → Duke verifikuar titullin e faqes...');
        const heading = await driver.findElement(By.css('h2'));
        const headingText = await heading.getText();
        assert.ok(
            headingText.includes('Dhomat që janë për pastrim'),
            `PASS: Titulli "${headingText}" është i saktë`
        );

        console.log('   → Duke verifikuar kartat e dhomave dirty...');
        const cards = await driver.findElements(By.css('.card.mb-3.shadow-sm'));
        assert.ok(cards.length >= 1,
            `PASS: Të paktën 1 dhomë dirty u gjet (${cards.length} gjithsej)`
        );

        const pageSource = await driver.getPageSource();
        assert.ok(pageSource.includes('dirty'),
            'PASS: Statusi "dirty" shfaqet në listë'
        );

        console.log(`   ✓ ${cards.length} dhomë(a) dirty u shfaqën me sukses!`);
    });

    it('Test 3.2: Pastruesi shënon dhomën si të pastruar', async function() {
        if (dirtyRoomId && receptionistToken) {
            await apiRequest('PUT',
                `/api/receptionist/rooms/${dirtyRoomId}/status`,
                { status: 'dirty' },
                receptionistToken
            );
        }

        console.log('   → Login si cleaner...');
        await loginAs(CLEANER_EMAIL, CLEANER_PASSWORD);

        console.log('   → Duke naviguar te /cleaner-dashboard...');
        await driver.get(`${BASE_URL}/cleaner-dashboard`);
        await driver.wait(until.urlContains('/cleaner-dashboard'), 10000);

        await driver.wait(until.elementLocated(By.css('.btn-success')), 15000);
        const markCleanBtn = await driver.findElement(By.css('.btn-success'));
        const btnText = await markCleanBtn.getText();
        console.log(`   → Duke klikuar butonin "${btnText}"...`);
        await jsClick(markCleanBtn);

        console.log('   → Duke pritur mesazhin e konfirmimit...');
        await driver.wait(until.elementLocated(By.css('.alert-success')), 10000);
        const alertEl = await driver.findElement(By.css('.alert-success'));
        const alertText = await alertEl.getText();

        assert.ok(
            alertText.includes('sukses') || alertText.includes('pastruar'),
            `PASS: Mesazhi i suksesit u shfaq: "${alertText}"`
        );
        console.log(`   ✓ Dhoma u shënua si e pastruar! Mesazhi: "${alertText}"`);
    });

    it('Test 3.3: Klienti kërkon dhoma disponueshme sipas datave', async function() {
        console.log('   → Duke hapur faqen kryesore (nuk kërkohet login)...');
        await driver.get(`${BASE_URL}`);
        await driver.sleep(1000);

        console.log('   → Duke vendosur check-in: 2027-09-01, check-out: 2027-09-05...');
        const checkInInput = await driver.findElement(By.id('date'));
        await setDateInput(checkInInput, '2027-09-01');

        const checkOutInput = await driver.findElement(By.id('checkOutDate'));
        await setDateInput(checkOutInput, '2027-09-05');

        const searchBtn = await driver.findElement(
            By.xpath('//button[contains(text(),"Search Rooms")]')
        );
        await jsClick(searchBtn);

        console.log('   → Duke pritur rezultatet e kërkimit...');
        await driver.wait(until.elementLocated(By.css('.btn-dark.w-100')), 15000);

        const bookNowBtns = await driver.findElements(By.css('.btn-dark.w-100'));
        assert.ok(
            bookNowBtns.length > 0,
            'PASS: Të paktën 1 dhomë disponueshme u gjet'
        );


        const pageSource = await driver.getPageSource();
        assert.ok(
            !pageSource.includes('class="reserved"'),
            'PASS: Asnjë dhomë e rezervuar nuk shfaqet në rezultate'
        );

        console.log(`   ✓ ${bookNowBtns.length} dhomë(a) disponueshme u gjetën!`);
    });
});
