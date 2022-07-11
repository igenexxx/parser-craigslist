const request = require('requestretry').defaults({
    fullResponse: false
}),
    // request = require('request-promise'),
    cheerio = require('cheerio'),
    ObjectsToCsv = require('objects-to-csv');

const url = 'https://sfbay.craigslist.org/d/web-html-info-design/search/web';

const scrapeResult = {
    title: '',
    description: '',
    datePosted: new Date(),
    url: '',
    hood: '',
    address: '',
    compensation: ''
};

const scrapeResults = [];

async function scrapeJobHeader() {
    try {
        const htmlResult = await request.get(url);
        const $ = await cheerio.load(htmlResult);

        $(".result-info").each((index, element) => {
            const resultTitle = $(element)
                .children(".result-title");
            const title = resultTitle.text();
            const url = resultTitle.attr('href');
            const datePosted = new Date($(element).children("time").attr("datetime"));
            const hood = $(element).find(".result-hood").text().replace(/\(|\)/g, '').trim();
            const scrapeResult = { title, url, datePosted, hood };

            scrapeResults.push(scrapeResult);
        })

        return scrapeResults;
    } catch (e) {
        console.error(e);
    }
}

async function scrapeDescription(jobsWidthHeaders) {
    return await Promise.all(jobsWidthHeaders.map(async job => {
        try {
            const htmlResult = await request.get(job.url);
            const $ = await cheerio.load(htmlResult);
            $(".print-qrcode-container").remove();
            job.description = $("#postingbody").text();
            job.address = $("div.mapaddress").text();
            job.compensation = $(".attrgroup").children()
                .first().text().replace("compensation: ", "");
            return job;
        } catch (err) {
            console.error(err);
        }
    }));
}

async function createCsvFile(data) {
    let csv = new ObjectsToCsv(data);
    await csv.toDisk('./test.csv');
}

async function scrapeCraigslist() {
    const jobsWidthHeaders = await scrapeJobHeader();
    const jobsFullData = await scrapeDescription(jobsWidthHeaders);
    await createCsvFile(jobsFullData);
}

scrapeCraigslist();