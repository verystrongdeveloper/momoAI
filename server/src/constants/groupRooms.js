// src/constants/groupRooms.js
// 단톡방 정의는 프론트와 공유하는 shared/groupRooms.json 한 곳에서 관리한다.
const rooms = require('../../../shared/groupRooms.json');

/** roomId → 멤버 이름 배열 */
const groupRooms = Object.fromEntries(rooms.map((room) => [room.id, room.members]));

module.exports = { groupRooms };
