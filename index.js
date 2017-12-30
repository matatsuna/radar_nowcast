import fetch from 'node-fetch';
import cheerio from 'cheerio';

class RadarNowcat {
    constructor() {
        this.temperature_now = '';
        this.temperature_max = '';
        this.temperature_min = '';
        this.rain_10 = '';
        this.rain_60 = '';
        this.sun_60 = '';
        this.fetchTenk()
            .then(text => this.parseTenk(text))
            .then();
    }
    fetchTenk() {
        return new Promise((resolve) => {
            fetch('https://tenki.jp/amedas/3/16/44132.html')
                .then(res => res.text())
                .then((text) => {
                    resolve(text);
                });
        });
    }
    parseTenk(text) {
        return new Promise((resolve) => {
            const $ = cheerio.load(text);
            this.temperature_now = $('.amedas-table-current ul:eq(0) li:eq(0)').text();
            this.temperature_max = $('.amedas-table-current ul:eq(0) li:eq(1)').text();
            this.temperature_min = $('.amedas-table-current ul:eq(0) li:eq(2)').text();

            this.rain_10 = $('.amedas-table-current ul:eq(1) li:eq(0)').text();
            this.rain_60 = $('.amedas-table-current ul:eq(1) li:eq(1)').text();

            this.sun_60 = $('.amedas-table-current ul:eq(3) li:eq(0)').text();
            resolve();
        });
    }
}
let radarnowcast = new RadarNowcat();
// radarnowcast.fetchTenk()