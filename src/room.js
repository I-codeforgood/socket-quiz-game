var {
    nanoid
} = require("nanoid");

const ROOM_MAX_CAPACITY = 2;

// class Room {
//     constructor() {
//         this.roomsState = [];
//     }

//     joinRoom() {
//         return new Promise((resolve) => {
//             for (let i = 0; i < this.roomsState.length; i++) {
//                 if (this.roomsState[i].users < ROOM_MAX_CAPACITY) {
//                     this.roomsState[i].users++;
//                     return resolve(this.roomsState[i].id);
//                 }
//             }

//             const newID = nanoid();
//             this.roomsState.push({
//                 id: newID,
//                 users: 1,
//             });
//             return resolve(newID);
//         });
//     }

//     leaveRoom(id) {
//         this.roomsState = this.roomsState.filter((room) => {
//             if (room.id === id) {
//                 if (room.users === 1) {
//                     return false;
//                 } else {
//                     room.users--;
//                 }
//             }
//             return true;
//         });
//     }


// }

// room.js
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(userId) {
        const roomId = nanoid();
        this.rooms.set(roomId, {
            users: []
        });
        this.rooms.get(roomId).users.push(userId);
        return roomId;
    }

    joinRoom(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (room && room.users.length < 2 && !room.users.includes(userId)) {
            room.users.push(userId);
            return true;
        }
        return false;
    }

    getRooms() {
        return Array.from(this.rooms.keys());
    }

    deleteRoom(roomId) {
        this.rooms.delete(roomId);
    }
}


module.exports = RoomManager;