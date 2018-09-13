var phantom = require("node-phantom-simple");
var phantomjs = require('phantomjs');
var _ = require('lodash');
var ejs = require('ejs');
var fs = require('fs');
var _session;

function pdfMaker(template, data, pdfPath, option) {

    return new Promise((resolve, reject) => {

        var fileExtension = template
            .split('/')
            .pop()
            .split('.')
            .pop();

        if (fileExtension === 'html') {
            option = pdfPath || {
                paperSize: {
                    format: 'A4',
                    orientation: 'portrait',
                    border: '1.8cm'
                }
            };

            pdfPath = data;

            fs.readFile(template, 'utf8', function (err, html) {
                if (err) {
                    throw err;
                }

                createSession(html, pdfPath, option);

            });

        } else if (fileExtension === 'ejs') {
            if (!data) {
                console.log('Please provide data object');
            }

            if (!pdfPath) {
                console.log('Please provide file path of the pdf');
            }

            option = option || {
                paperSize: {
                    format: 'A4',
                    orientation: 'portrait',
                    border: '1.8cm'
                }
            };

            fs.readFile(template, 'utf8', function (err, file) {
                if (err) {
                    throw err;
                }

                var html = ejs.render(file, data);
                createSession(html, pdfPath, option).then(res => {
                    resolve(res)
                }).catch(err => {
                    reject(err)
                })
            });

        } else {
            console.log('Unknown file extension')
        }

    })
}

function createSession(html, pdfPath, option) {
    return new Promise((resolve, reject) => {

        if (_session) {
            resolve(createPage(_session, html, pdfPath, option))
        } else {
            phantom.create({
                path: phantomjs.path
            }, (err, session) => {
                if (err) {
                    reject(err)
                }

                _session = session;
                createPage(session, html, pdfPath, option).then(res => {
                    resolve(res)
                }).catch(err => {
                    reject(err)
                })
            });
        }

    })
}

function createPage(session, html, pdfPath, option) {
    return new Promise((resolve, reject) => {

        session.createPage((err, page) => {
            if (err) {
                reject(err)
            }

            _.forEach(option, (val, key) => {
                page.set(key, val);
            });

            page.set('content', html, (err) => {
                if (err) {
                    reject(err)
                }
            });

            page.onLoadFinished = (status) => {
                page.render(pdfPath, (error) => {
                    page.close();
                    page = null;
                    if (error) {
                        reject(err)
                    } else {
                        resolve('success');
                    }
                });
            };
        });

    })
}

module.exports = pdfMaker;
