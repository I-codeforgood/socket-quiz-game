var {
    nanoid
} = require("nanoid");

const ROOM_MAX_CAPACITY = 2;

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
        if (room && room.users.length < ROOM_MAX_CAPACITY && !room.users.includes(userId)) {
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