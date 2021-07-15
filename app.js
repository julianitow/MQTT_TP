const mqtt = require('mqtt');
const express = require('express');
const http = require('http');

const client = mqtt.connect(
    'mqtt://group1.local', 
    {
        clientId: "js_client",
        username: "esgi",
        password: "esgi"
    }
);
const app = express();
app.use(express.json());
app.use(express.urlencoded())

const topic = 'esgi/julien/weather';
const TOPIC_BASE = 'tp/weather';
const TOPIC_TEMP = `${TOPIC_BASE}/temp`;
const TOPIC_HUMIDITY = `${TOPIC_BASE}/humidity`; 
const TOPIC_PRESSURE = `${TOPIC_BASE}/pressure`;
const TOPIC_SET_SPRINKLER = `${TOPIC_BASE}/sprinkler/set`;
const TOPIC_GET_SPRINKLER = `${TOPIC_BASE}/sprinkler`;
const API_KEY = '0433bdd4948ad85274d3e7442ecc389b';
const CITY = 'Paris';
const URL = `http://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`;
const port = 3000;
let sprinklerActive = false;

app.get('/', (req, res) => {
  res.send('Sample mqtt weather app');
});

app.get('/temp', (req, res) => {
    postTemp();
    res.send();
});

app.get('/humidity', (req, res) => {
    postHumidity();
    res.send();
});

app.get('/pressure', (req, res) => {
    postPressure();
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
  setInterval(() => { 
      postTemp();
      postHumidity();
      postPressure();
      postSprinklerState();
    }, 10000);
}); 

client.on('connect', () => {
    client.subscribe(topic, function(err) {
        if(!err){
            client.publish(topic, 'Hello there');

        } else {
            console.err(err);
        }
    });

    client.subscribe(TOPIC_SET_SPRINKLER, function(err) {
        if(!err){
            console.log('Subscribed to sprinkle events !');

        } else {
            console.err(err);
        }
    });
});

client.on('message', (topic, message) => {
    if(topic === TOPIC_SET_SPRINKLER) {
        String(message) === 'true' ? sprinklerActive = true : sprinklerActive = false;
        console.log(`Sprinkler active: ${sprinklerActive}`);
        postSprinklerState();
    }
});

function fetchData() {
    return new Promise((resolve, reject) => {
        http.get(URL, res => {
            let data = "";
    
            res.on("data", d => {
                data += d;
            });
    
            res.on("end", () => {
                //console.log(JSON.parse(data));
                const jsonData = JSON.parse(data);
                resolve(jsonData);
            });

            res.on('error', (err) => {
                reject(err);
            });
        });
    })
}

function postPressure() {
    fetchData().then(jsonData => {
        const pressure = jsonData.main.pressure;
        client.publish(TOPIC_PRESSURE, pressure.toString(), {qos: 1});
    });
}

function postHumidity() {
    fetchData().then(jsonData => {
        const humidity = jsonData.main.humidity;
        client.publish(TOPIC_HUMIDITY, humidity.toString());
    });
}

function postSprinklerState() {
    client.publish(TOPIC_GET_SPRINKLER, sprinklerActive.toString(), {qos: 1});
}

function postTemp() {
    fetchData().then(jsonData => {
        const temp = jsonData.main.temp;
        if(temp > 25){
            sprinklerActive = true;
        } else {
            sprinklerActive = false;
        }
        client.publish(TOPIC_GET_SPRINKLER, sprinklerActive.toString());
        client.publish(TOPIC_TEMP, temp.toString());
    });
}