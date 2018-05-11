import fetch from 'node-fetch';
import cheerio from 'cheerio';
import moment from 'moment';
import fs from 'fs';
import GifCreationService from 'gif-creation-service';
import config from './config.json';
import Twitter from 'twitter';

class RadarNowcat {
    constructor() {
        this.temperature = '';
        this.rain = '';
        this.sun = '';
        let now_mill = Date.now();
        this.now = moment(now_mill - (now_mill % (5 * 60 * 1000)));
        this.past = moment(now_mill - (now_mill % (5 * 60 * 1000)));
        this.future = moment(now_mill - (5 * 60 * 1000) - (now_mill % (5 * 60 * 1000)));
        this.client = new Twitter({
            consumer_key: config.twitter.consumer_key,
            consumer_secret: config.twitter.consumer_secret,
            access_token_key: config.twitter.access_token_key,
            access_token_secret: config.twitter.access_token_secret
        });
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
            // console.log($('.amedas-current-list li');
            let temperature_now = $('.amedas-current-list li').eq(0).text();
            let temperature_max = $('.amedas-current-list li').eq(1).text();
            let temperature_min = $('.amedas-current-list li').eq(2).text();
            this.temperature = temperature_now + '\n' + temperature_max + '\n' + temperature_min;

            let rain_10 = $('.amedas-current-list li').eq(3).text();
            let rain_60 = $('.amedas-current-list li').eq(4).text();
            this.rain = rain_10 + '\n' + rain_60;

            this.sun = $('.amedas-current-list li').eq(7).text();

            resolve();
        }).catch((e) => { console.error(e) });
    }
    fetchPng() {
        return new Promise((resolve) => {
            let past = this.fetchPastPng();
            let future = this.fetchFuturePng();
            Promise.all([past, future]).then((filenames) => {
                console.log("pngをダウンロードしました");
                let pastFilename = filenames[0].reverse();
                let futureFilename = filenames[1];
                resolve(pastFilename.concat(futureFilename));
            }).catch((e) => {
                console.error(e);
            });
        });
    }
    fetchPastPng() {
        return new Promise((resolve) => {
            let requests = [];
            for (let i = 1; i <= 13; i++) {
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
            let time = this.future.format('YYYYMMDDHHmm');
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
    postBot(filename) {
        return new Promise((resolve) => {
            // Load your image
            var data = fs.readFileSync(filename);

            // Make post request on media endpoint. Pass file data as media parameter
            this.client.post('media/upload', { media: data }, (error, media, response) => {
                if (!error) {
                    // Lets tweet it
                    var status = {
                        status: this.now.format('YYYY/MM/DD HH:mm') + '\n\n' + this.temperature + '\n\n降水量\n' + this.rain + '\n\n日照値\n' + this.sun,
                        media_ids: media.media_id_string // Pass the media id string
                    }
                    this.client.post('statuses/update', status, (error, tweet, response) => {
                        if (!error) {
                            resolve(tweet);
                        }
                    });
                }
            });
        });
    }
    unlinkPng() {
        return new Promise((resolve) => {

            fs.readdir('.', function (err, files) {
                if (err) throw err;
                var fileList = files.filter(function (file) {
                    return fs.statSync(file).isFile() && /.*\.png$/.test(file); //絞り込み
                })
                fileList.forEach((file) => {
                    fs.unlink(file, (err) => {
                        if (err) throw err;
                    });
                });
                resolve();
            });
        });
    }
}
let radarnowcast = new RadarNowcat();

radarnowcast.fetchTenk()
    .then((text) => radarnowcast.parseTenk(text))
    .then(() => radarnowcast.fetchPng())
    .then((filenames) => radarnowcast.pngToGif(filenames))
    .then((filename) => radarnowcast.postBot(filename))
    .then(() => radarnowcast.unlinkPng())
    .then((res) => {
        console.log(res);
        console.log("ok");
    })
    .catch((e) => {
        console.error(e);
    });