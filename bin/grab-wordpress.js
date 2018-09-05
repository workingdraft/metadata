const cheerio = require('cheerio');
const http = require('https');
const episodes = process.argv.slice(2);

const months = {
  'Januar': '01',
  'Februar': '02',
  'März': '03',
  'April': '04',
  'Mai': '05',
  'Juni': '06',
  'Juli': '07',
  'August': '08',
  'September': '09',
  'Oktober': '10',
  'November': '11',
  'Dezember': '12'
}

const parseDate = (dateString) => {
  const dateParts = dateString.replace(/(.*)\. (.*) (\d\d\d\d) .*/, `$3-$2-$1`).split('-');
  dateParts[1] = months[dateParts[1]];
  return dateParts.map(part => part.trim()).join('-');
}

const parseEpisode = (episode) => {
  return new Promise((resolve) => {
    http.get(`https://workingdraft.de/${episode}/`, res => {
      let result = [];
      res.on('data', (d) => {
        result.push(d);
      });

      res.on('end', () => {
        const text = result.join('');
        const $ = cheerio.load(text);

        const title = $('h2 a').text().replace(/Revision ...:/, '').trim();
        const audio = $('a.podpress_downloadlink.podpress_downloadlink_audio_mp3').attr('href');
        const href = `https://workingdraft.de/${episode}/`;
        const date = parseDate($('.commenthead').text());
        const duration = $('.podpress_mediafile_dursize.podpress_mediafile_dursize_audio_mp3')
          .text().replace(/\[(.*)\| .* \]/, '$1').trim();

        resolve(`"${episode}": {
  "id": ${episode},
  "date": "${date}",
  "people": [

  ],
  "duration": "${duration}",
  "href": "${href}",
  "audio": "${audio}",
  "title": "${title}"
}`);
      });

    });
  })
}

Promise.all(episodes.map(parseEpisode))
  .then(parsedEpisodes => {
    console.log(parsedEpisodes.join(',\n'));
  })

