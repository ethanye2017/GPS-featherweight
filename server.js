const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const WebSocket = require("ws");
const express = require("express");

const SERIAL_PORT = "COM3"; // Mac/Linux example: "/dev/tty.usbmodemXXXX"
const BAUD_RATE = 115200;

const app = express();
app.use(express.static("public"));

const server = app.listen(3000, () => {
  console.log("Dashboard: http://localhost:3000");
});

const wss = new WebSocket.Server({ server });

const port = new SerialPort({
  path: SERIAL_PORT,
  baudRate: BAUD_RATE,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  flowControl: false
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

parser.on("data", (line) => {
  line = line.trim();

  // Ignore Featherweight binary packets
  if (line.startsWith("FWT")) return;

  // Featherweight text packets start with @
  if (!line.startsWith("@")) return;

  console.log(line);

  const data = parseFeatherweightLine(line);

  if (data) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
});

function parseFeatherweightLine(line) {
  // This is a starter parser.
  // First, just send the raw packet to the website.
  return {
    raw: line,
    time: new Date().toLocaleTimeString()
  };
}
