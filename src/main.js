const socket = io();

socket.on("connection", (socket) => {
    console.log(socket.id);
});

function joinRoom() {
    socket.emit('join-room', {});
}