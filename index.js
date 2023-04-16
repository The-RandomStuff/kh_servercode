const express = require("express");
const app = express();
const http = require('http');
const https = require('https');
const fs = require('fs');
const axios = require('axios');

var videoId = "";
var tracks = [];

app.use(express.json());


app.get('/allTracks', async function(req, res){
    
  res.send(JSON.stringify(tracks));

});

app.get('/videoId', async function(req, res){

    //console.log();
    res.send(JSON.stringify(this.videoId));

});

getNewestVideo('https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UC4l8WmdF9ivMDQHHVOdYKqQ&maxResults=1&order=date&type=video&key=AIzaSyCic299WlN4vQJFug8PIltnKHwJ8CZEqn0');
getSermons('https://yetanothersermon.host/_/kc/public-api/v1/sermons/');

async function getSermons(url) {
    try {
        const response = await axios.get(url);
        const data = response.data;
        console.log("The supposed amount: " + data.count);
        const results = data.results;

        results.forEach(result => {
            try{
                const track = {
                    id: result.id,
                    name: result.preachers[0]?.name || 'Kharis Church',
                    title: result.title,
                    image: result.image,
                    audio: result.audio_link.download_url,
                    duration: result.audio_link.duration
                }

                tracks.push(track);

            }catch (error) {
                console.log(error);
            }

        })

        console.log("array amount: " + tracks.length);

        const nextPage = data.next;

        if (nextPage != null){
            await getSermons(nextPage);
        }

    } catch (error) {
        console.error('Error fetching sermons:', error);
    }
}

async function getNewestVideo(url) {
    try {
        const response = await axios.get(url);
        const data = response.data;
        const results = data.items[0].id.videoId;

        this.videoId = results;

    } catch (error) {
        console.error('Error fetching sermons:', error);
    }
}



var pk = fs.readFileSync( '/opt/bitnami/letsencrypt/certificates/www.therandomstuff-server.uk.key' );
var ck = fs.readFileSync( '/opt/bitnami/letsencrypt/certificates/www.therandomstuff-server.uk.crt' );
//
//  app.listen(8082);


const httpsServer = https.createServer({
  key: pk,
  cert: ck
}, app);

httpsServer.listen(8082, () =>{
console.log("Running");
});
