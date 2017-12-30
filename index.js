import fetch from 'node-fetch';
import cheerio from 'cheerio';
import moment from 'moment';
import fs from 'fs';
import GifCreationService from 'gif-creation-service';

class RadarNowcat {
    constructor() {
        this.temperature_now = '';
        this.temperature_max = '';
        this.temperature_min = '';
        this.rain_10 = '';
        this.rain_60 = '';
        this.sun_60 = '';
        let now_mill = Date.now();
        this.now = moment(now_mill - (now_mill % (5 * 60 * 1000)));
        this.past = moment(now_mill - (now_mill % (5 * 60 * 1000)));
        this.fetchPng().then(() => {
            console.log('fin');
        }).catch((e) => {
            console.error(e);
        });
        // this.fetchTenk()
        //     .then(text => this.parseTenk(text))
        //     .then();
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
    fetchPng() {
        return new Promise((resolve) => {
            let filenames = [
                '201712301625-01.png',
                '201712301625-02.png',
                '201712301625-03.png',
                '201712301625-04.png',
                '201712301625-05.png',
                '201712301625-06.png',
                '201712301625-07.png',
                '201712301625-08.png',
                '201712301625-09.png',
                '201712301625-10.png',
                '201712301625-11.png',
                '201712301625-12.png'
            ];
            resolve(filenames);
            // let past = this.fetchPastPng();
            // let future = this.fetchFuturePng();
            // Promise.all([past, future]).then((filenames) => {
            //     console.log("pngをダウンロードしました");
            //     resolve(filenames);
            // }).catch((e) => {
            //     console.error(e);
            // });

        });
    }
    fetchPastPng() {
        return new Promise((resolve) => {
            let requests = [];
            for (let i = 1; i <= 12; i++) {
                let time = this.past.add(-5, 'minutes').format('YYYYMMDDHHmm');
                let radar = new Promise((resolve) => {
                    let filename = time + "-00.png";
                    fetch('http://www.jma.go.jp/jp/radnowc/imgs/radar/206/' + filename)
                        .then((res) => {
                            let dest = fs.createWriteStream(filename);
                            res.body.pipe(dest);
                            resolve(filename);
                        });
                });
                requests.push(radar);
            }
            Promise.all(requests)
                .then((filenames) => {
                    resolve(filenames);
                }).catch((e) => {
                    console.error(e);
                });
        });
    }
    fetchFuturePng() {
        return new Promise((resolve) => {
            let requests = [];
            let time = this.now.format('YYYYMMDDHHmm');
            for (let i = 1; i <= 12; i++) {
                let nowcast = new Promise((resolve) => {
                    let filename = time + '-' + ('00' + i).slice(-2) + '.png';
                    fetch('http://www.jma.go.jp/jp/radnowc/imgs/nowcast/206/' + filename)
                        .then((res) => {
                            let dest = fs.createWriteStream(filename);
                            res.body.pipe(dest);
                            resolve(filename);
                        });
                });
                requests.push(nowcast);
            }
            Promise.all(requests)
                .then((filenames) => {
                    resolve(filenames);
                }).catch((e) => {
                    console.error(e);
                });
        });
    }
    pngToGif(pngImages) {
        return new Promise((resolve) => {
            const outputGifFile = 'output.gif';
            GifCreationService.createAnimatedGifFromPngImages(pngImages, outputGifFile, { repeat: true, fps: 1.5, quality: 10 })
                .then(outputGifFile => {
                    resolve(outputGifFile);
                });
        });
    }
}
let radarnowcast = new RadarNowcat();

// radarnowcast.fetchTenk()
radarnowcast.fetchPng()
    .then(filenames => radarnowcast.pngToGif(filenames))
    .then((res) => {
        console.log(res);
    });