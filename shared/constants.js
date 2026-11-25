/**
 * Shared game constants used identically by server and browser clients.
 */

export const PHYSICS = {
  GRAVITY: 1550,
  MAX_FALL_SPEED: 880,
  MOVE_SPEED: 300,
  ACCEL_GROUND: 2400,
  DECEL_GROUND: 2200,
  ACCEL_AIR: 1500,
  DECEL_AIR: 600,
  JUMP_VEL: -590,
  DOUBLE_JUMP_VEL: -540,
  BOUNCE_VEL: -860,
  PARTNER_BOOST_VEL: -760,
  COYOTE_TIME: 0.12,
  JUMP_BUFFER: 0.12,
  PLAYER_W: 34,
  PLAYER_H: 48,
};

export const ROLES = {
  sola: {
    id: 'sola',
    name: 'SOLA',
    thaiName: 'โซลา (ตะวัน)',
    title: 'ผู้พิทักษ์เปลวตะวัน',
    powerName: 'Solar Bolt',
    powerThai: 'ลำแสงสุริยะ',
    powerDesc: 'ยิงลูกไฟตะวัน เผาเถาวัลย์เงา และจุดเสาสุริยัน',
    primary: '#FFB347',
    glow: '#FFF0B8',
    accent: '#FF6B2B',
  },
  luna: {
    id: 'luna',
    name: 'LUNA',
    thaiName: 'ลูนา (จันทรา)',
    title: 'ผู้พิทักษ์แสงจันทร์',
    powerName: 'Lunar Wave',
    powerThai: 'คลื่นจันทรา',
    powerDesc: 'ยิงคลื่นแสงจันทร์ กระตุ้นผลึกจันทรา เสกสะพานแสง',
    primary: '#6EE7FF',
    glow: '#D8F8FF',
    accent: '#4B8BFF',
  },
};

export const POWERS = {
  SOLAR_COOLDOWN: 0.45,
  SOLAR_SPEED: 620,
  SOLAR_LIFETIME: 1.1,
  SOLAR_RADIUS: 14,
  SOLAR_DAMAGE: 22,
  LUNAR_COOLDOWN: 0.55,
  LUNAR_SPEED: 540,
  LUNAR_LIFETIME: 1.15,
  LUNAR_RADIUS: 18,
  LUNAR_DAMAGE: 20,
  HARMONY_RADIUS: 190,
  HARMONY_COOLDOWN: 2.5,
};

export const PLAYER_MAX_HP = 5;
export const INVULN_DURATION = 1.4;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const TICK_RATE_MS = 50;

export const MSG = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  ROOM_STATE: 'room_state',
  ROOM_ERROR: 'room_error',
  SWAP_ROLES: 'swap_roles',
  SET_READY: 'set_ready',
  START_GAME: 'start_game',
  GAME_STARTED: 'game_started',
  PLAYER_STATE: 'player_state',
  PARTNER_STATE: 'partner_state',
  CAST_POWER: 'cast_power',
  POWER_CAST: 'power_cast',
  HARMONY_PULSE: 'harmony_pulse',
  HARMONY_TRIGGERED: 'harmony_triggered',
  COLLECT_SHARD: 'collect_shard',
  TOUCH_CHECKPOINT: 'touch_checkpoint',
  PING_EMOTE: 'ping_emote',
  EMOTE_RECEIVED: 'emote_received',
  PARTNER_BOOST: 'partner_boost',
  PLAYER_DAMAGED: 'player_damaged',
  ENTER_PORTAL: 'enter_portal',
  RESTART_GAME: 'restart_game',
  SELECT_ACT: 'select_act',
  WORLD_TICK: 'world_tick',
  WORLD_EVENT: 'world_event',
  ACT_CHANGED: 'act_changed',
  VICTORY: 'victory',
  PARTNER_CONNECTION: 'partner_connection',
  PING: 'ping',
  PONG: 'pong',
};
