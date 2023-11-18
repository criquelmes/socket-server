//Referencias HTML
const labelPending = document.querySelector("#lbl-pending");
const deskHeader = document.querySelector("h1");
const noMoreAlert = document.querySelector(".alert");
const labelCurrentTicket = document.querySelector("small");

const btnDraw = document.querySelector("#btn-draw");
const btnDone = document.querySelector("#btn-done");

const searchParams = new URLSearchParams(window.location.search);

if (!searchParams.has("escritorio")) {
  window.location = "index.html";
  throw new Error("El escritorio es requerido");
}

const deskNumber = searchParams.get("escritorio");
let workingTicket = null;
deskHeader.innerText = deskNumber;

function checkTicketCount(currentCount = 0) {
  if (currentCount === 0) {
    noMoreAlert.classList.remove("d-none");
  } else {
    noMoreAlert.classList.add("d-none");
  }
  labelPending.innerHTML = currentCount;
}

async function loadInitialCount() {
  const pendingTickets = await fetch("api/ticket/pending").then((res) =>
    res.json()
  );
  checkTicketCount(pendingTickets.length);
}

async function getTicket() {
  await finishTicket();

  const { status, ticket, message } = await fetch(
    `api/ticket/draw/${deskNumber}`
  ).then((res) => res.json());
  if (status === "error") {
    labelCurrentTicket.innerText = message;
    return;
  }

  workingTicket = ticket;
  labelCurrentTicket.innerText = ticket.number;
}

async function finishTicket() {
  if (!workingTicket) return;

  const { status, message } = await fetch(
    `api/ticket/done/${workingTicket.id}`,
    {
      method: "PUT",
    }
  ).then((res) => res.json());

  if (status === "ok") {
    workingTicket = null;
    labelCurrentTicket.innerText = "Nadie";
  }
}

function connectToWebSockets() {
  const socket = new WebSocket("ws://localhost:3000/ws");

  socket.onmessage = (event) => {
    const { type, payload } = JSON.parse(event.data);
    if (type !== "on-ticket-count-changed") return;
    checkTicketCount(payload);
  };

  socket.onclose = (event) => {
    setTimeout(() => {
      connectToWebSockets();
    }, 1500);
  };

  socket.onopen = (event) => {
    console.log("Connected");
  };
}

//Listeners
btnDraw.addEventListener("click", getTicket);
btnDone.addEventListener("click", finishTicket);

//Inicialización
loadInitialCount();
connectToWebSockets();
