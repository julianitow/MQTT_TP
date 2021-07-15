const mqtt = require('mqtt');
const express = require('express');
const http = require('http');

const client = mqtt.connect('mqtt://test.mosquitto.org');
const app = express();
app.use(express.json());
app.use(express.urlencoded())

const topic = 'esgi/julien/weather';
const API_KEY = '0433bdd4948ad85274d3e7442ecc389b';
const CITY = 'Paris';
const URL = `http://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`;
const port = 3000;

app.get('/', (req, res) => {
  res.send('Sample mqtt weather app');
});

app.get('/weather', (req, res) => {
    postTemp();
    res.send();
});

app.post('/send-mqtt', (req, res) => {
    const msg = JSON.stringify(req.body.message);
    client.publish(topic, msg);
    console.log(msg);
    res.send();
});

app.listen(port, () => {
  console.log(`server is listening on ${port}`);
  setInterval(() => { postTemp() }, 5000);
}); 

client.on('connect', () => {
    client.subscribe(topic, function(err) {
        if(!err){
            client.publish(topic, 'Hello ju');

        } else {
            console.err(err);
        }
    });
});

function postTemp() {
    http.get(URL, res => {
        let data = "";

        res.on("data", d => {
            data += d;
        });

        res.on("end", () => {
            console.log(JSON.parse(data));
            const jsonData = JSON.parse(data);
            const temp = jsonData.main.temp;
            client.publish(topic, temp.toString());
        });
    });
}
/*client.on('message', function(msg) {
    console.warn(topic);
    console.log(msg.toString());
});*/